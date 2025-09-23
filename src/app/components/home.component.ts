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
  matches: IMatch[] = [];
  isAddMatchModalOpen: boolean = false;
  isShowMatchModalOpen: boolean = false;
  clickedMatch: IMatch | undefined;
  userState$ = this.userService.getState();
  players: IPlayer[] = [];
  activeCompetition: ICompetition | null = null;
  isEliminationMode = false;
  eliminationRounds: EliminationRound[] = [];

  player1Selected: IPlayer | null = null;
  player2Selected: IPlayer | null = null;

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
      this.matches = matches ?? [];
      this.updateEliminationRounds();
    });
    this.dataService.fetchMatches({ ttlMs: 5 * 60 * 1000 }) // cache 5 minuti
      .then(res => {
        this.matches = res.matches;
        this.updateEliminationRounds();
      });
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
    // Calcola il numero totale di slot (potenza di 2 >= num giocatori)
    // Se i giocatori sono già una potenza di 2, usa quel numero, altrimenti prendi la potenza di 2 successiva
    const nextPow2 = (n: number) => Math.pow(2, Math.ceil(Math.log2(n)));
    const totalSlots = nextPow2(players.length);

    // Se siamo già a una potenza di 2, non aggiungere slot extra
    // Se no, fermati alla potenza di 2 immediatamente superiore (es: 7 -> 8, 9 -> 16)
    const seeding: (IPlayer | null)[] = [...players];

    // Aggiungi bye/null se necessario
    while (seeding.length < totalSlots) {
      seeding.push(null);
    }

    const rounds: EliminationRound[] = [];
    let currentRoundPlayers = seeding;
    let roundNumber = 1;
    // Mappa per i nomi dei round in base al numero di slot
    const roundNames: { [key: number]: string } = {
      32: 'one_sixteenth_finals',
      16: 'one_eighth_finals',
      8: 'quarter_finals',
      4: 'semi_finals',
      2: 'finals'
    };

    let slotsInRound = currentRoundPlayers.length;

    while (slotsInRound > 1) {
      const roundName = roundNames[slotsInRound] || `${this.translateService.translate('round')} ${roundNumber}`;
      const round: EliminationRound = {
        roundNumber,
        name: roundName,
        matches: []
      };

      const nextRoundPlayers: (IPlayer | null)[] = [];

      for (let i = 0; i < currentRoundPlayers.length; i += 2) {
        const player1 = currentRoundPlayers[i] ?? null;
        const player2 = currentRoundPlayers[i + 1] ?? null;
        const matchResult = this.getMatchResultForPlayers(player1, player2);

        let winnerId = matchResult.winnerId;

        if (!winnerId) {
          if (player1 && !player2) {
            winnerId = player1.id;
          } else if (!player1 && player2) {
            winnerId = player2.id;
          }
        }

        const winnerPlayer = winnerId
          ? this.players.find(p => String(p.id) === String(winnerId)) ?? null
          : null;

        nextRoundPlayers.push(winnerPlayer);

        round.matches.push({
          id: `round-${roundNumber}-match-${i / 2 + 1}`,
          slots: [
            { seed: i + 1, player: player1 },
            { seed: i + 2, player: player2 }
          ],
          player1Score: matchResult.player1Score,
          player2Score: matchResult.player2Score,
          winnerId
        });
      }

      rounds.push(round);

      currentRoundPlayers = nextRoundPlayers;
      slotsInRound = currentRoundPlayers.length;
      roundNumber++;
    }

    return rounds;
  }

  private getMatchResultForPlayers(player1: IPlayer | null, player2: IPlayer | null): {
    player1Score?: number;
    player2Score?: number;
    winnerId: number | string | null;
  } {
    if (!player1 || !player2 || !this.matches?.length) {
      return { winnerId: null };
    }

    const relevantMatches = this.matches.filter(match => {
      const p1 = Number(match.player1_id);
      const p2 = Number(match.player2_id);
      return (
        (p1 === player1.id && p2 === player2.id) ||
        (p1 === player2.id && p2 === player1.id)
      );
    });

    if (!relevantMatches.length) {
      return { winnerId: null };
    }

    const latestMatch = [...relevantMatches].sort((a, b) => {
      const dateA = this.getMatchTimestamp(a);
      const dateB = this.getMatchTimestamp(b);

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      return (Number(b.id) || 0) - (Number(a.id) || 0);
    })[0];

    if (!latestMatch) {
      return { winnerId: null };
    }

    const winnerId = (latestMatch as any)?.winner_id ?? null;
    const player1Id = Number(latestMatch.player1_id);
    const player2Id = Number(latestMatch.player2_id);

    if (player1Id === player1.id && player2Id === player2.id) {
      return {
        player1Score: latestMatch.player1_score,
        player2Score: latestMatch.player2_score,
        winnerId
      };
    }

    return {
      player1Score: latestMatch.player2_score,
      player2Score: latestMatch.player1_score,
      winnerId
    };
  }

  private getMatchTimestamp(match: IMatch): number {
    const matchAny = match as any;
    const dateString = matchAny?.created ?? matchAny?.created_at ?? match.data;
    const date = dateString ? new Date(dateString).getTime() : 0;
    if (!Number.isNaN(date) && date !== 0) {
      return date;
    }

    return Number(match.id) || 0;
  }

  onClickRound(event: any) {
    console.log(event);
    this.player1Selected = event.player1;
    this.player2Selected = event.player2;
    this.modalService.openModal(this.modalService.MODALS[event.modalName]);
  }
}