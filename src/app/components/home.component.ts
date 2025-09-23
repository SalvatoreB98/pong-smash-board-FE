import { Component } from '@angular/core';
import { MatchesComponent } from './matches/matches.component';
import { CompetitionMode, IMatch } from '../interfaces/matchesInterfaces';
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
import { EliminationBracketComponent, EliminationModalEvent } from './elimination-bracket/elimination-bracket.component';
import { EliminationRound } from '../interfaces/elimination-bracket.interface';
import { ICompetition } from '../../api/competition.api';
import { Router } from '@angular/router';

type MatchWithContext = IMatch & {
  competitionType?: CompetitionMode;
  competitionName?: string;
  roundName?: string | null;
  roundLabel?: string;
};

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
  clickedMatch: MatchWithContext | undefined;
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
    this.clickedMatch = {
      ...match,
      competitionType: 'league',
      competitionName: this.activeCompetition?.name ?? undefined,
      roundName: match.roundName ?? null,
      roundLabel: match.roundLabel ?? undefined,
    };
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

    // Calcola numero di slot (prossima potenza di 2 >= num giocatori)
    const nextPow2 = (n: number) => Math.pow(2, Math.ceil(Math.log2(n)));
    const totalSlots = nextPow2(players.length);

    // Seeding iniziale
    const seeding: (IPlayer | null)[] = [...players];
    while (seeding.length < totalSlots) {
      seeding.push(null);
    }

    const rounds: EliminationRound[] = [];
    let currentRoundPlayers = seeding;
    let roundNumber = 1;

    const roundNames: Record<number, string> = {
      32: 'one_sixteenth_finals',
      16: 'one_eighth_finals',
      8: 'quarter_finals',
      4: 'semi_finals',
      2: 'finals',
    };

    let slotsInRound = currentRoundPlayers.length;

    while (slotsInRound > 1) {
      const roundKey = roundNames[slotsInRound] ?? null;
      const roundName =
        roundKey ||
        `${this.translateService.translate('round')} ${roundNumber}`;
      const roundLabel = roundKey
        ? this.translateService.translate(roundKey)
        : roundName;

      const round: EliminationRound = {
        roundNumber,
        name: roundName,
        matches: [],
      };

      const nextRoundPlayers: (IPlayer | null)[] = [];

      for (let i = 0; i < currentRoundPlayers.length; i += 2) {
        const player1 = currentRoundPlayers[i] ?? null;
        const player2 = currentRoundPlayers[i + 1] ?? null;

        const matchResult = this.getMatchResultForPlayers(player1, player2);

        let winnerId: number | null = null;

        // ✅ winner solo se c’è un match giocato
        const matchPlayed =
          matchResult.player1Score !== undefined &&
          matchResult.player2Score !== undefined;

        if (matchPlayed) {
          winnerId = matchResult.winnerId ? Number(matchResult.winnerId) : null;
        } else {
          // ✅ fallback bye solo nel primo round
          if (roundNumber === 1) {
            if (player1 && !player2) {
              winnerId = player1.id;
            } else if (!player1 && player2) {
              winnerId = player2.id;
            }
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
            { seed: i + 2, player: player2 },
          ],
          player1Score: matchResult.player1Score,
          player2Score: matchResult.player2Score,
          winnerId: matchPlayed ? winnerId : null, // 👈 winner solo se c’è stato match
          matchData: matchResult.match ?? null,
          roundKey,
          roundLabel,
        });
      }

      rounds.push(round);

      currentRoundPlayers = nextRoundPlayers;
      slotsInRound = currentRoundPlayers.length;
      roundNumber++;
    }

    return rounds;
  }


  private getMatchResultForPlayers(
    player1: IPlayer | null,
    player2: IPlayer | null
  ): {
    player1Score?: number;
    player2Score?: number;
    winnerId: number | string | null;
    match?: IMatch | null;
  } {
    if (!player1 || !player2 || !this.matches?.length) {
      return { winnerId: null, match: null };
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
      return { winnerId: null, match: null };
    }

    // prendi l’ultimo match
    const latestMatch = [...relevantMatches].sort((a, b) => {
      const dateA = this.getMatchTimestamp(a);
      const dateB = this.getMatchTimestamp(b);
      if (dateA !== dateB) return dateB - dateA;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    })[0];

    if (!latestMatch) return { winnerId: null, match: null };

    // punteggi originali
    let p1Score = latestMatch.player1_score;
    let p2Score = latestMatch.player2_score;

    // se i player erano invertiti, ribalta i punteggi
    if (latestMatch.player1_id !== player1.id) {
      [p1Score, p2Score] = [p2Score, p1Score];
    }

    // calcola il winner
    let winnerId: number | null = null;
    if (p1Score > p2Score) winnerId = player1.id;
    else if (p2Score > p1Score) winnerId = player2.id;

    return {
      player1Score: p1Score,
      player2Score: p2Score,
      winnerId,
      match: latestMatch,
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
}