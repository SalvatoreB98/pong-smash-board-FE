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
import { GroupKnockoutComponent } from './group-knockout/group-knockout.component';

type MatchWithContext = IMatch & {
  competitionType?: CompetitionMode;
  competitionName?: string;
  roundName?: string | null;
  roundLabel?: string;
};

@Component({
  selector: 'app-home',
  imports: [CommonModule, BottomNavbarComponent, MatchesComponent, AddMatchModalComponent, ModalComponent, ShowMatchModalComponent, TranslatePipe, StatsComponent, ManualPointsComponent, EliminationBracketComponent, GroupKnockoutComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  dataService = inject(DataService);
  userService = inject(UserService);
  playersService = inject(PlayersService);
  matches$ = this.dataService.matchesObs;
  matchesElimination$ = this.dataService.matchesEliminationObs;
  competitionService = inject(CompetitionService);
  matches: IMatch[] = [];
  matchesElimination: IMatch[] = [];
  isAddMatchModalOpen: boolean = false;
  isShowMatchModalOpen: boolean = false;
  clickedMatch: MatchWithContext | undefined;
  userState$ = this.userService.getState();
  players: IPlayer[] = [];
  groupStagePlayers: IPlayer[] = [];
  competitionQualifiedPlayers: IPlayer[] = [];
  activeCompetition: ICompetition | null = null;
  isEliminationMode = false;
  isGroupKnockoutMode = false;
  eliminationRounds: EliminationRound[] = [];
  modalPlayers: IPlayer[] = [];

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
          this.isGroupKnockoutMode = (activeCompetition?.type === 'group_knockout');
          this.refreshCompetitionQualifiedPlayers();
          this.refreshGroupStagePlayers();
          this.updateEliminationRounds();
          this.updateModalPlayers();
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
      this.refreshCompetitionQualifiedPlayers();
      this.refreshGroupStagePlayers();
      this.updateEliminationRounds();
      this.updateModalPlayers();
    });
    this.matches$.subscribe(matches => {
      this.matches = matches ?? [];
      this.updateEliminationRounds();
    });
    this.matchesElimination$.subscribe(matches => {
      this.matchesElimination = matches ?? [];
      this.updateEliminationRounds();
    });
    this.dataService.fetchMatches({ ttlMs: 5 * 60 * 1000 }) // cache 5 minuti
      .then(res => {
        this.matches = res.matches;
        this.matchesElimination = res.matchesElimination ?? [];
        this.updateEliminationRounds();
        this.updateModalPlayers();
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

  private updateEliminationRounds() {
    const shouldBuildBracket = this.isEliminationMode || this.isGroupKnockoutMode;
    if (!shouldBuildBracket) {
      this.eliminationRounds = [];
      return;
    }

    if (this.competitionQualifiedPlayers.length < 2) {
      this.eliminationRounds = [];
      return;
    }

    const bracketMatches = this.getBracketMatches();
    this.eliminationRounds = this.buildInitialEliminationBracket(
      this.competitionQualifiedPlayers,
      bracketMatches
    );
  }

  private buildInitialEliminationBracket(players: IPlayer[], matches: IMatch[]): EliminationRound[] {
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

        const matchResult = this.getMatchResultForPlayers(player1, player2, matches);

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

        const winnerPlayer = winnerId ? this.findPlayerById(winnerId) : null;

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

  private refreshCompetitionQualifiedPlayers() {
    const qualifiedFromCompetition = this.extractCompetitionPlayers(
      (this.activeCompetition as any)?.qualifiedPlayers
        ?? (this.activeCompetition as any)?.qualified_players
        ?? null
    );

    if (qualifiedFromCompetition.length > 0) {
      this.competitionQualifiedPlayers = qualifiedFromCompetition;
      this.updateModalPlayers();
      return;
    }

    this.competitionQualifiedPlayers = [...this.players];
    this.updateModalPlayers();
  }

  private refreshGroupStagePlayers() {
    if (!this.isGroupKnockoutMode) {
      this.groupStagePlayers = [];
      this.updateModalPlayers();
      return;
    }

    const compAny = this.activeCompetition as any;
    const candidateSources = [
      compAny?.groupPlayers,
      compAny?.group_players,
      compAny?.boardPlayers,
      compAny?.board_players,
      compAny?.groupKnockoutPlayers,
      compAny?.group_knockout_players,
    ];

    for (const source of candidateSources) {
      const players = this.extractCompetitionPlayers(source);
      if (players.length) {
        this.groupStagePlayers = players;
        this.updateModalPlayers();
        return;
      }
    }

    const groupCollections = compAny?.groups
      ?? compAny?.groupKnockoutGroups
      ?? compAny?.group_knockout_groups
      ?? null;

    if (Array.isArray(groupCollections)) {
      const aggregated = groupCollections.flatMap((group: any) =>
        this.extractCompetitionPlayers(group?.players ?? group?.members ?? group?.playerList ?? [])
      );

      if (aggregated.length) {
        this.groupStagePlayers = aggregated;
        this.updateModalPlayers();
        return;
      }
    }

    this.groupStagePlayers = this.extractCompetitionPlayers(compAny?.players ?? []);
    if (!this.groupStagePlayers.length && this.players?.length) {
      this.groupStagePlayers = [...this.players];
    }
    this.updateModalPlayers();
  }

  private extractCompetitionPlayers(source: unknown): IPlayer[] {
    if (!Array.isArray(source)) {
      return [];
    }

    return source
      .map(raw => this.normalizePlayer(raw))
      .filter((player): player is IPlayer => player !== null);
  }

  private normalizePlayer(player: any): IPlayer | null {
    if (!player) {
      return null;
    }

    const id = player.id ?? player.player_id ?? player.playerId;
    if (id === null || id === undefined) {
      return null;
    }

    const baseName = player.name ?? player.nickname ?? undefined;
    const resolvedName = typeof baseName === 'string' && baseName.trim().length > 0
      ? baseName.trim()
      : `Player ${id}`;

    const normalized: IPlayer = {
      id: Number(id),
      name: resolvedName,
      lastname: player.lastname ?? player.last_name ?? player.surname ?? undefined,
      nickname: player.nickname ?? player.nick_name ?? undefined,
      image_url: player.image_url ?? player.imageUrl ?? player.avatar_url ?? undefined,
    };

    return normalized;
  }

  private findPlayerById(playerId: number | string | null | undefined): IPlayer | null {
    if (playerId === null || playerId === undefined) {
      return null;
    }

    const targetId = String(playerId);

    return (
      this.competitionQualifiedPlayers.find(player => String(player.id) === targetId)
      ?? this.players.find(player => String(player.id) === targetId)
      ?? null
    );
  }


  private updateModalPlayers() {
    if (this.isGroupKnockoutMode) {
      const combined = [...this.groupStagePlayers, ...this.competitionQualifiedPlayers];
      const unique = new Map<string, IPlayer>();
      combined.forEach(player => {
        if (!player) {
          return;
        }
        unique.set(String(player.id), player);
      });
      this.modalPlayers = Array.from(unique.values());
      return;
    }

    this.modalPlayers = [...this.players];
  }

  private getBracketMatches(): IMatch[] {
    if (this.isGroupKnockoutMode) {
      return this.matchesElimination ?? [];
    }

    return this.matches ?? [];
  }

  private getMatchResultForPlayers(
    player1: IPlayer | null,
    player2: IPlayer | null,
    matches: IMatch[]
  ): {
    player1Score?: number;
    player2Score?: number;
    winnerId: number | string | null;
    match?: IMatch | null;
  } {
    if (!player1 || !player2 || !matches?.length) {
      return { winnerId: null, match: null };
    }

    const relevantMatches = matches.filter(match => {
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