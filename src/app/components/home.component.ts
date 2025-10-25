import { Component, DestroyRef, inject } from '@angular/core';
import { CompetitionMode, IMatch } from '../interfaces/matchesInterfaces';
import { DataService } from '../../services/data.service';
import { AddMatchModalComponent } from './add-match-modal/add-match-modal.component';
import { ModalComponent } from '../common/modal/modal.component';
import { ShowMatchModalComponent } from './show-match-modal/show-match-modal.component';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { KnockoutStage, MODALS, MSG_TYPE, toKnockoutStage } from '../utils/enum';
import { TranslatePipe } from '../utils/translate.pipe';
import { BottomNavbarComponent } from '../common/bottom-navbar/bottom-navbar.component';
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
import { Group, GroupPlayer, KnockoutStageData, mapGroupPlayerToIPlayer } from '../interfaces/group.interface';
import { mapKnockoutResponse } from '../interfaces/knockout.interface';
import type { KnockoutPlayer } from '../interfaces/knockout.interface';
import { LeagueBoardComponent } from './home/league-board/league-board.component';
import { AddGroupMatchModalComponent } from './add-match-modal/add-group-match-modal/add-group-match-modal.component';
import { AddPlayerModalComponent } from './modals/add-player-modal/add-player-modal.component';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SetMatchDateModalComponent } from '../common/set-match-date-modal/set-match-date-modal.component';

type MatchWithContext = IMatch & {
  competitionType?: CompetitionMode;
  competitionName?: string;
  roundName?: KnockoutStage | null;
  roundLabel?: KnockoutStage | string | null;
};


@Component({
  selector: 'app-home',
  imports: [CommonModule, BottomNavbarComponent, AddMatchModalComponent, ModalComponent, ShowMatchModalComponent, ManualPointsComponent, EliminationBracketComponent, GroupKnockoutComponent, LeagueBoardComponent, AddGroupMatchModalComponent, SetMatchDateModalComponent, AddPlayerModalComponent],
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
  roundTypeOfMatch: KnockoutStage | null = null;
  private readonly destroyRef = inject(DestroyRef);
  // Track the last loaded competition to avoid race conditions during fast navigation.
  private lastLoadedCompetitionId: string | null = null;
  private hasShownNoCompetitionToast = false;

  constructor(public modalService: ModalService, private loaderService: LoaderService, private translateService: TranslationService, private router: Router) { }

  ngOnInit() {
    combineLatest([this.userState$, this.competitionService.activeCompetition$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([state, activeCompetition]) => {
        if (!state) {
          console.error('User state is null or undefined');
          return;
        }
        this.onActiveCompetitionResolved(activeCompetition ?? null);
      });

    this.playersService.getPlayers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(players => this.handlePlayersUpdate(players));

    this.matches$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(matches => { this.matches = matches ?? []; });

    this.matchesElimination$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(matches => { this.matchesElimination = matches ?? []; });

    this.groups$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(groups => {
        this.groups = groups ?? [];
        this.refreshModalPlayers();
      });

    this.knockout$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(knockout => this.handleKnockoutUpdate(knockout));
  }

  setClickedMatch(match: IMatch) {
    const competitionType = (this.activeCompetition?.type ?? 'league') as CompetitionMode;
    const roundLabel = match.roundLabel
      ? typeof match.roundLabel === 'string'
        ? match.roundLabel
        : this.translateService.translate(match.roundLabel)
      : match.roundName
        ? this.translateService.translate(match.roundName)
        : undefined;

    this.clickedMatch = {
      ...match,
      competitionType,
      competitionName: this.activeCompetition?.name ?? undefined,
      roundName: match.roundName ?? null,
      roundLabel,
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

  private async onActiveCompetitionResolved(activeCompetition: ICompetition | null) {
    if (!activeCompetition) {
      if (!this.hasShownNoCompetitionToast) {
        this.loaderService.showToast(this.translateService.translate('no_active_competition'), MSG_TYPE.WARNING);
        this.hasShownNoCompetitionToast = true;
      }
      await this.router.navigate(['/competitions']);
      return;
    }

    this.hasShownNoCompetitionToast = false;
    const nextId = String(activeCompetition.id ?? '');
    const hasChanged = this.lastLoadedCompetitionId !== nextId;
    this.handleCompetitionChange(activeCompetition);

    if (hasChanged || !this.matches.length) {
      await this.loadMatchesForCompetition(activeCompetition.id, { force: hasChanged });
      this.lastLoadedCompetitionId = nextId;
    }
  }

  private async loadMatchesForCompetition(competitionId: number | string | null, options?: { force?: boolean }) {
    if (competitionId == null) {
      return;
    }
    this.isLoadingMatches = true;
    try {
      const response = await this.dataService.fetchMatches({
        competitionId,
        ttlMs: 5 * 60 * 1000,
        force: options?.force,
      });
      this.matches = response.matches;
      this.matchesElimination = response.matchesElimination ?? [];
      if (this.isEliminationMode || this.isGroupKnockoutMode) {
        this.requestKnockoutData(options?.force ?? false);
      }
    } catch (error) {
      console.error('Failed to load matches for competition:', error);
    } finally {
      this.isLoadingMatches = false;
    }
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

    this.competitionQualifiedPlayers = this.mapQualifiedPlayers(knockout.qualifiedPlayers);
    this.eliminationRounds = mapKnockoutResponse(knockout);
    this.refreshModalPlayers();
  }

  private requestKnockoutData(force = false) {
    const options = force ? { force: true } : undefined;
    this.dataService.fetchGroups(options).catch(error => {
      console.error('Failed to load group data:', error);
    });
    const competitionId = this.activeCompetition?.id;
    if (competitionId != null) {
      this.dataService.fetchKnockouts({ competitionId: Number(competitionId), force }).catch(error => {
        console.error('Failed to load knockout data:', error);
      });
    } else {
      this.dataService.fetchKnockouts().catch(error => {
        console.error('Failed to load knockout data:', error);
      });
    }
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

  private mapQualifiedPlayers(players: KnockoutStageData['qualifiedPlayers']): IPlayer[] {
    return (players ?? [])
      .map(player => this.mapQualifiedPlayer(player))
      .filter((p): p is IPlayer => p != null);
  }

  private mapQualifiedPlayer(player: GroupPlayer | KnockoutPlayer | null | undefined): IPlayer | null {
    if (!player) {
      return null;
    }

    if (this.isGroupPlayer(player)) {
      return mapGroupPlayerToIPlayer(player);
    }

    if ('nickname' in player) {
      return {
        id: Number(player.id),
        name: player.nickname ?? '',
        nickname: player.nickname ?? undefined,
        image_url: (player as { imageUrl?: string | null }).imageUrl ?? undefined,
      };
    }

    return null;
  }

  private isGroupPlayer(player: unknown): player is GroupPlayer {
    if (!player || typeof player !== 'object') {
      return false;
    }

    const candidate = player as Partial<GroupPlayer>;
    return 'points' in candidate || 'wins' in candidate || 'losses' in candidate || 'matchesPlayed' in candidate;
  }

  onClickMatchRound(event: EliminationModalEvent) {
    console.log(event);
    this.player1Selected = event.player1 ?? null;
    this.player2Selected = event.player2 ?? null;
    const stage = toKnockoutStage(event.roundName ?? event.roundLabel ?? null);

    if (event.modalName === 'SHOW_MATCH') {
      if (!event.match) {
        return;
      }

      const roundLabel = event.roundLabel
        ? typeof event.roundLabel === 'string'
          ? event.roundLabel
          : this.translateService.translate(event.roundLabel)
        : stage
          ? this.translateService.translate(stage)
          : undefined;

      this.clickedMatch = {
        ...event.match,
        competitionType: 'elimination',
        competitionName: this.activeCompetition?.name ?? undefined,
        roundName: stage,
        roundLabel,
      };
      this.roundTypeOfMatch = stage;
      this.modalService.openModal(this.modalService.MODALS['SHOW_MATCH']);
      return;
    }

    this.roundTypeOfMatch = stage;
    this.modalService.openModal(this.modalService.MODALS[event.modalName]);
  }

  get canStartElimination(): boolean {
    return !!this.activeCompetition && this.competitionQualifiedPlayers.length >= 2;
  }

  get hasMatches(): boolean {
    return this.matches?.length > 0;
  }
}