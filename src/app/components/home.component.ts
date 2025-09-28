import { Component } from '@angular/core';
import { CompetitionMode, IMatch } from '../interfaces/matchesInterfaces';
import { DataService } from '../../services/data.service';
import { AddMatchModalComponent } from './add-match-modal/add-match-modal.component';
import { ModalComponent } from '../common/modal/modal.component';
import { ShowMatchModalComponent } from './show-match-modal/show-match-modal.component';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { MODALS, MSG_TYPE } from '../utils/enum';
import { TranslatePipe } from '../utils/translate.pipe';
import { BottomNavbarComponent } from '../common/bottom-navbar/bottom-navbar.component';
import { inject } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CompetitionService } from '../../services/competitions.service';
import { IPlayer, PlayersService } from '../../services/players.service';
import { LoaderService } from '../../services/loader.service';
import { TranslationService } from '../../services/translation.service';
import { ManualPointsComponent } from './add-match-modal/manual-points/manual-points.component';
import { EliminationBracketComponent, EliminationModalEvent } from './elimination-bracket/elimination-bracket.component';
import { EliminationRound } from '../interfaces/elimination-bracket.interface';
import { ICompetition } from '../../api/competition.api';
import { Router } from '@angular/router';
import { GroupKnockoutComponent } from './group-knockout/group-knockout.component';
import { Group, KnockoutStageData, mapGroupPlayerToIPlayer } from '../interfaces/group.interface';
import { LeagueBoardComponent } from './home/league-board/league-board.component';
import { AddGroupMatchModalComponent } from './add-match-modal/add-group-match-modal/add-group-match-modal.component';

type MatchWithContext = IMatch & {
  competitionType?: CompetitionMode;
  competitionName?: string;
  roundName?: string | null;
  roundLabel?: string;
};

@Component({
  selector: 'app-home',
  imports: [CommonModule, BottomNavbarComponent, AddMatchModalComponent, ModalComponent, ShowMatchModalComponent, ManualPointsComponent, EliminationBracketComponent, GroupKnockoutComponent, LeagueBoardComponent, AddGroupMatchModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  dataService = inject(DataService);
  userService = inject(UserService);
  playersService = inject(PlayersService);
  matches$ = this.dataService.matchesObs;
  matchesElimination$ = this.dataService.matchesEliminationObs;
  groups$ = this.dataService.groupsObs;
  knockout$ = this.dataService.knockoutObs;
  competitionService = inject(CompetitionService);
  matches: IMatch[] = [];
  matchesElimination: IMatch[] = [];
  isAddMatchModalOpen: boolean = false;
  isShowMatchModalOpen: boolean = false;
  clickedMatch: MatchWithContext | undefined;
  userState$ = this.userService.getState();
  players: IPlayer[] = [];
  groups: Group[] = [];
  competitionQualifiedPlayers: IPlayer[] = [];
  activeCompetition: ICompetition | null = null;
  isEliminationMode = false;
  isGroupKnockoutMode = false;
  eliminationRounds: EliminationRound[] = [];
  modalPlayers: IPlayer[] = [];
  isLoadingMatches = true;

  player1Selected: IPlayer | null = null;
  player2Selected: IPlayer | null = null;

  constructor(public modalService: ModalService, private loaderService: LoaderService, private translateService: TranslationService, private router: Router) { }

  ngOnInit() {
    this.userState$.subscribe(state => {
      if (!state) {
        console.error('User state is null or undefined');
        return;
      }

      this.competitionService.activeCompetition$.subscribe(activeCompetition => {
        if (!activeCompetition) {
          this.loaderService.showToast(this.translateService.translate('no_active_competition'), MSG_TYPE.WARNING);
          this.router.navigate(['/competitions']);
        }

        this.handleCompetitionChange(activeCompetition ?? null);
      });
    });

    this.playersService.getPlayers().subscribe(players => {
      this.handlePlayersUpdate(players);
    });

    this.matches$.subscribe(matches => {
      this.matches = matches ?? [];
    });

    this.matchesElimination$.subscribe(matches => {
      this.matchesElimination = matches ?? [];
    });

    this.groups$.subscribe(groups => {
      this.groups = groups ?? [];
      this.refreshModalPlayers();
    });

    this.knockout$.subscribe(knockout => {
      this.handleKnockoutUpdate(knockout);
    });

    this.isLoadingMatches = true;
    this.dataService.fetchMatches({ ttlMs: 5 * 60 * 1000 })
      .then(res => {
        this.matches = res.matches;
        this.matchesElimination = res.matchesElimination ?? [];
        if (this.isEliminationMode || this.isGroupKnockoutMode) {
          this.requestKnockoutData();
        }
      })
      .finally(() => {
        this.isLoadingMatches = false;
      });
  }

  setClickedMatch(match: IMatch) {
    const competitionType = (this.activeCompetition?.type ?? 'league') as CompetitionMode;
    this.clickedMatch = {
      ...match,
      competitionType,
      competitionName: this.activeCompetition?.name ?? undefined,
      roundName: match.roundName ?? null,
      roundLabel: match.roundLabel ?? undefined,
    };
  }

  private handleCompetitionChange(activeCompetition: ICompetition | null) {
    const previousCompetitionId = this.activeCompetition?.id ?? null;
    this.activeCompetition = activeCompetition;
    this.isEliminationMode = (activeCompetition?.type === 'elimination');
    this.isGroupKnockoutMode = (activeCompetition?.type === 'group_knockout');

    if ((this.isEliminationMode || this.isGroupKnockoutMode) && previousCompetitionId !== activeCompetition?.id) {
      this.requestKnockoutData(true);
    } else {
      this.groups = [];
      this.competitionQualifiedPlayers = [];
      this.eliminationRounds = [];
    }

    this.refreshModalPlayers();
  }

  private handlePlayersUpdate(players: IPlayer[]) {
    this.players = players ?? [];
    if (this.players.length < 2) {
      this.loaderService.showToast('not_enough_players', MSG_TYPE.WARNING);
      this.router.navigate(['/competitions']);
    }

    this.refreshModalPlayers();
  }

  private handleKnockoutUpdate(knockout: KnockoutStageData | null) {
    if (!knockout) {
      this.competitionQualifiedPlayers = [];
      this.eliminationRounds = [];
      this.refreshModalPlayers();
      return;
    }

    const qualifiedPlayers = knockout.qualifiedPlayers ?? [];
    this.competitionQualifiedPlayers = qualifiedPlayers.map(mapGroupPlayerToIPlayer);
    this.eliminationRounds = knockout.rounds ?? [];
    this.refreshModalPlayers();
  }

  private requestKnockoutData(force = false) {
    const options = force ? { force: true } : undefined;
    this.dataService.fetchGroups(options).catch(error => {
      console.error('Failed to load group data:', error);
    });
  }

  private refreshModalPlayers() {
    if (this.isGroupKnockoutMode) {
      const groupedPlayers = this.getPlayersFromGroups(this.groups);
      const unique = new Map<string, IPlayer>();
      groupedPlayers.forEach(player => {
        unique.set(String(player.id), player);
      });
      this.competitionQualifiedPlayers.forEach(player => {
        unique.set(String(player.id), player);
      });
      this.modalPlayers = Array.from(unique.values());
      return;
    }

    if (this.isEliminationMode && this.competitionQualifiedPlayers.length) {
      this.modalPlayers = [...this.competitionQualifiedPlayers];
      return;
    }

    this.modalPlayers = [...this.players];
  }

  private getPlayersFromGroups(groups: Group[]): IPlayer[] {
    const unique = new Map<string, IPlayer>();
    groups.forEach(group => {
      group.players.forEach(member => {
        const mapped = mapGroupPlayerToIPlayer(member);
        unique.set(String(mapped.id), mapped);
      });
    });
    return Array.from(unique.values());
  }

  onClickRound(event: EliminationModalEvent) {
    console.log(event);
    this.player1Selected = event.player1 ?? null;
    this.player2Selected = event.player2 ?? null;

    if (event.modalName === 'SHOW_MATCH') {
      if (!event.match) {
        return;
      }

      const roundLabel = event.roundLabel
        ?? (event.roundName ? this.translateService.translate(event.roundName) : undefined);

      this.clickedMatch = {
        ...event.match,
        competitionType: 'elimination',
        competitionName: this.activeCompetition?.name ?? undefined,
        roundName: event.roundName ?? null,
        roundLabel,
      };

      this.modalService.openModal(this.modalService.MODALS['SHOW_MATCH']);
      return;
    }

    this.modalService.openModal(this.modalService.MODALS[event.modalName]);
  }

  get canStartElimination(): boolean {
    return !!this.activeCompetition && this.competitionQualifiedPlayers.length >= 2;
  }

  get hasMatches(): boolean {
    return this.matches?.length > 0;
  }
}