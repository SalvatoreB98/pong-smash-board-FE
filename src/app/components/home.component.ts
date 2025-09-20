import { Component } from '@angular/core';
import { MatchesComponent } from './matches/matches.component';
import { IMatch } from '../interfaces/matchesInterfaces';
import { IMatchResponse } from '../interfaces/responsesInterfaces';
import { DataService } from '../../services/data.service';
import { AddMatchModalComponent } from './add-match-modal/add-match-modal.component';
import { ModalComponent } from '../common/modal/modal.component';
import { ShowMatchModalComponent } from './show-match-modal/show-match-modal.component';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { MODALS, MSG_TYPE } from '../utils/enum';
import { TranslatePipe } from '../utils/translate.pipe';
import { BottomNavbarComponent } from '../common/bottom-navbar/bottom-navbar.component';
import { StatsComponent } from '../common/stats/stats.component';
import { inject } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CompetitionService } from '../../services/competitions.service';
import { IPlayer, PlayersService } from '../../services/players.service';
import { LoaderService } from '../../services/loader.service';
import { TranslationService } from '../../services/translation.service';
import { ManualPointsComponent } from './add-match-modal/manual-points/manual-points.component';
import { EliminationBracketComponent } from './elimination-bracket/elimination-bracket.component';
import { EliminationRound } from '../interfaces/elimination-bracket.interface';
import { ICompetition } from '../../api/competition.api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, BottomNavbarComponent, MatchesComponent, AddMatchModalComponent, ModalComponent, ShowMatchModalComponent, TranslatePipe, StatsComponent, ManualPointsComponent, EliminationBracketComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  dataService = inject(DataService);
  userService = inject(UserService);
  playersService = inject(PlayersService);
  matches$ = this.dataService.matchesObs;
  competitionService = inject(CompetitionService);
  matches: any;
  isAddMatchModalOpen: boolean = false;
  isShowMatchModalOpen: boolean = false;
  clickedMatch: IMatch | undefined;
  userState$ = this.userService.getState();
  players: IPlayer[] = [];
  activeCompetition: ICompetition | null = null;
  isEliminationMode = false;
  eliminationRounds: EliminationRound[] = [];

  constructor(public modalService: ModalService, private loaderService: LoaderService, private translateService: TranslationService, private router: Router) { }

  ngOnInit() {
    this.userState$.subscribe(state => {
      if (!state) {
        console.error('User state is null or undefined');
        return;
      } else {
        console.log('User state:', state);
        this.competitionService.activeCompetition$.subscribe(activeCompetition => {
          if (!activeCompetition) {
            this.loaderService.showToast(this.translateService.translate('no_active_competition'), MSG_TYPE.WARNING);
            this.router.navigate(['/competitions']);
          }
          this.activeCompetition = activeCompetition ?? null;
          this.isEliminationMode = (activeCompetition?.type === 'elimination');
          this.updateEliminationRounds();
        });
      }
    });
    this.playersService.getPlayers().subscribe(players => {
      this.players = players;
      console.log(this.players);
      if (players.length < 2) {
        this.loaderService.showToast('not_enough_players', MSG_TYPE.WARNING);
        this.router.navigate(['/competitions']);
      }
      this.updateEliminationRounds();
    });
    this.matches$.subscribe(matches => {
      this.matches = matches;
    });
    this.dataService.fetchMatches({ ttlMs: 5 * 60 * 1000 }) // cache 5 minuti
      .then(res => this.matches = res.matches);
  }

  setClickedMatch(match: IMatch) {
    this.clickedMatch = match;
  }

  private updateEliminationRounds() {
    if (!this.isEliminationMode) {
      this.eliminationRounds = [];
      return;
    }

    if (this.players.length < 2) {
      this.eliminationRounds = [];
      return;
    }

    this.eliminationRounds = this.buildInitialEliminationBracket(this.players);
  }

  private buildInitialEliminationBracket(players: IPlayer[]): EliminationRound[] {
    if (!players.length) {
      return [];
    }

    const totalSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(2, players.length))));
    const seeding: (IPlayer | null)[] = [...players];

    while (seeding.length < totalSlots) {
      seeding.push(null);
    }

    const roundLabel = `${this.translateService.translate('round')} 1`;
    const round: EliminationRound = {
      name: roundLabel,
      matches: []
    };

    for (let i = 0; i < totalSlots; i += 2) {
      round.matches.push({
        id: `round-1-match-${i / 2 + 1}`,
        slots: [
          { seed: i + 1, player: seeding[i] ?? null },
          { seed: i + 2, player: seeding[i + 1] ?? null }
        ]
      });
    }

    return [round];
  }

}