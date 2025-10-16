import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompetitionService } from '../../../services/competitions.service';
import { ICompetition } from '../../../api/competition.api';
import { IMatch, IMatchSet } from '../../interfaces/matchesInterfaces';
import { Group, GroupPlayer, mapGroupPlayerToIPlayer } from '../../interfaces/group.interface';
import { EliminationRound } from '../../interfaces/elimination-bracket.interface';
import { IPlayer } from '../../../services/players.service';
import { EliminationBracketComponent } from '../elimination-bracket/elimination-bracket.component';
import { GroupKnockoutComponent } from '../group-knockout/group-knockout.component';
import { LeagueBoardComponent } from '../home/league-board/league-board.component';

interface KnockoutPayload {
  rounds?: EliminationRound[] | null;
  qualifiedPlayers?: Array<GroupPlayer | IPlayer | null> | null;
}

interface CompetitionViewPayload {
  competition?: ICompetition | null;
  matches?: unknown[] | null;
  matchesLeague?: unknown[] | null;
  matchesElimination?: unknown[] | null;
  latestMatches?: unknown[] | null;
  groups?: Group[] | null;
  groupStage?: { groups?: Group[] | null } | null;
  rounds?: EliminationRound[] | null;
  eliminationRounds?: EliminationRound[] | null;
  knockout?: KnockoutPayload | null;
  knockoutStage?: KnockoutPayload | null;
  qualifiedPlayers?: Array<GroupPlayer | IPlayer | null> | null;
}

@Component({
  selector: 'app-competition-view',
  standalone: true,
  imports: [CommonModule, EliminationBracketComponent, GroupKnockoutComponent, LeagueBoardComponent],
  templateUrl: './competition-view.component.html',
  styleUrl: './competition-view.component.scss',
})
export class CompetitionViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly competitionService = inject(CompetitionService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly competition = signal<ICompetition | null>(null);
  readonly matches = signal<IMatch[]>([]);
  readonly rounds = signal<EliminationRound[]>([]);
  readonly groups = signal<Group[]>([]);
  readonly qualifiedPlayers = signal<IPlayer[]>([]);

  readonly isLoadingMatches = computed(() => this.isLoading());

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        filter((id) => Number.isFinite(id) && id > 0),
        distinctUntilChanged(),
        tap(() => {
          this.isLoading.set(true);
          this.errorMessage.set(null);
          this.resetView();
        }),
        switchMap((competitionId) =>
          this.competitionService.getCompetitionView(competitionId).pipe(
            catchError((error) => {
              console.error('[CompetitionView] Unable to load competition view', error);
              this.errorMessage.set('Impossibile caricare la competizione.');
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((payload) => {
        if (!payload) {
          this.isLoading.set(false);
          return;
        }

        this.hydrateView(payload as CompetitionViewPayload);
        this.isLoading.set(false);
      });
  }

  private resetView(): void {
    this.competition.set(null);
    this.matches.set([]);
    this.rounds.set([]);
    this.groups.set([]);
    this.qualifiedPlayers.set([]);
  }

  private hydrateView(payload: CompetitionViewPayload): void {
    this.competition.set(payload.competition ?? null);
    this.matches.set(this.resolveMatches(payload));
    this.groups.set(this.resolveGroups(payload));
    this.rounds.set(this.resolveRounds(payload));
    this.qualifiedPlayers.set(this.resolveQualifiedPlayers(payload));
  }

  private resolveMatches(payload: CompetitionViewPayload): IMatch[] {
    const source =
      payload.matches ??
      payload.matchesLeague ??
      payload.matchesElimination ??
      payload.latestMatches ??
      [];

    if (!Array.isArray(source)) {
      return [];
    }

    return this.normalizeMatches(source, {
      competitionId: payload.competition?.id ?? null,
      competitionType: payload.competition?.type ?? undefined,
      competitionName: payload.competition?.name ?? undefined,
    });
  }

  private resolveGroups(payload: CompetitionViewPayload): Group[] {
    const source = payload.groups ?? payload.groupStage?.groups ?? [];
    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((group) => {
      const normalized = group as Group;
      const players = Array.isArray(normalized.players)
        ? normalized.players.map((player) => ({
            ...player,
            id: String((player as any)?.id ?? player.id ?? ''),
          }))
        : [];

      return {
        ...normalized,
        id: String((normalized as any)?.id ?? normalized.id ?? ''),
        players,
      };
    });
  }

  private resolveRounds(payload: CompetitionViewPayload): EliminationRound[] {
    const source =
      payload.rounds ??
      payload.eliminationRounds ??
      payload.knockout?.rounds ??
      payload.knockoutStage?.rounds ??
      [];
    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((round, roundIndex) => {
      const normalized = round as EliminationRound;
      const matches = Array.isArray((normalized as any)?.matches)
        ? (normalized as any).matches.map((match: any, matchIndex: number) => ({
            ...match,
            id: String(match?.id ?? `${roundIndex}-${matchIndex}`),
          }))
        : [];

      return {
        ...normalized,
        matches,
      };
    });
  }

  private resolveQualifiedPlayers(payload: CompetitionViewPayload): IPlayer[] {
    const sources = [
      payload.qualifiedPlayers,
      payload.knockout?.qualifiedPlayers,
      payload.knockoutStage?.qualifiedPlayers,
    ];

    for (const candidate of sources) {
      const normalized = this.normalizeQualifiedPlayers(candidate);
      if (normalized.length) {
        return normalized;
      }
    }

    return [];
  }

  private normalizeQualifiedPlayers(
    source: Array<GroupPlayer | IPlayer | null | undefined> | null | undefined,
  ): IPlayer[] {
    if (!Array.isArray(source)) {
      return [];
    }

    return source
      .map((player) => this.normalizePlayer(player))
      .filter((player): player is IPlayer => player !== null);
  }

  private normalizePlayer(player: GroupPlayer | IPlayer | null | undefined): IPlayer | null {
    if (!player) {
      return null;
    }

    if ('points' in player || 'matchesPlayed' in player) {
      const groupPlayer: GroupPlayer = {
        id: String((player as any).id ?? (player as any).playerId ?? ''),
        name: (player as any).name ?? '',
        surname: (player as any).surname ?? (player as any).lastname ?? undefined,
        nickname: (player as any).nickname ?? undefined,
        imageUrl: (player as any).imageUrl ?? (player as any).image_url ?? undefined,
        points: Number((player as any).points ?? 0),
        wins: Number((player as any).wins ?? 0),
        losses: Number((player as any).losses ?? 0),
        matchesPlayed: Number((player as any).matchesPlayed ?? 0),
        scoreDifference: Number((player as any).scoreDifference ?? 0),
      };
      return mapGroupPlayerToIPlayer(groupPlayer);
    }

    return {
      id: Number((player as any).id ?? (player as any).playerId ?? 0),
      name: (player as any).name ?? '',
      lastname: (player as any).lastname ?? (player as any).surname ?? undefined,
      nickname: (player as any).nickname ?? undefined,
      image_url: (player as any).image_url ?? (player as any).imageUrl ?? undefined,
    };
  }

  private normalizeMatches(
    matches: unknown[],
    context: {
      competitionId: number | string | null;
      competitionType?: ICompetition['type'];
      competitionName?: string | null | undefined;
    },
  ): IMatch[] {
    return matches
      .map((match, index) => this.normalizeMatch(match, index, context))
      .filter((match): match is IMatch => match !== null);
  }

  private normalizeMatch(
    raw: unknown,
    index: number,
    context: {
      competitionId: number | string | null;
      competitionType?: ICompetition['type'];
      competitionName?: string | null | undefined;
    },
  ): IMatch | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const match = raw as Record<string, any>;
    const rawId = match['id'] ?? match['matchId'] ?? index;
    const id = String(rawId ?? index);

    const dateValue = match['date'] ?? match['created'] ?? null;
    const date: string | number | Date = dateValue ?? '';
    const created =
      dateValue instanceof Date
        ? dateValue.toISOString()
        : dateValue != null
        ? String(dateValue)
        : undefined;

    const player1 = this.normalizeParticipant(match['player1']);
    const player2 = this.normalizeParticipant(match['player2']);

    const fallbackPlayer1Name = match['player1_name'] ?? match['player1Nickname'];
    const fallbackPlayer2Name = match['player2_name'] ?? match['player2Nickname'];

    const player1Name = this.normalizeName(player1?.nickname, player1?.name, fallbackPlayer1Name);
    const player2Name = this.normalizeName(player2?.nickname, player2?.name, fallbackPlayer2Name);

    const score = typeof match['score'] === 'object' && match['score'] !== null ? match['score'] : {};
    const player1Score = this.toNumber(
      score['player1'] ?? score['player1_score'] ?? match['player1_score'],
    );
    const player2Score = this.toNumber(
      score['player2'] ?? score['player2_score'] ?? match['player2_score'],
    );

    const matchSets = this.normalizeMatchSets(
      match['matchSets'] ?? match['match_sets'],
      rawId,
    );
    const setsPoints = matchSets.map((set) => [set.player1_score, set.player2_score]);

    const player1Id = this.toOptionalNumber(
      player1?.id ?? player1?.playerId ?? match['player1_id'] ?? match['player1Id'],
    );
    const player2Id = this.toOptionalNumber(
      player2?.id ?? player2?.playerId ?? match['player2_id'] ?? match['player2Id'],
    );

    const player1Img =
      player1?.imageUrl ?? player1?.image_url ?? match['player1_img'] ?? null;
    const player2Img =
      player2?.imageUrl ?? player2?.image_url ?? match['player2_img'] ?? null;

    const roundNameValue = match['roundName'] ?? match['round'] ?? null;
    const roundName =
      roundNameValue === null || roundNameValue === undefined
        ? null
        : String(roundNameValue);
    const roundLabelValue = match['roundLabel'] ?? match['stageLabel'];
    const roundLabel = roundLabelValue === undefined ? undefined : String(roundLabelValue);

    const winnerId = this.toOptionalNumber(match['winner_id'] ?? match['winnerId']);
    const tournamentId = this.toOptionalNumber(match['tournament_id'] ?? match['tournamentId']);
    const descriptionValue = match['desc'] ?? match['description'] ?? match['status'] ?? undefined;
    const desc = descriptionValue === undefined ? undefined : String(descriptionValue);

    const groupIdValue = match['groupId'] ?? match['group_id'];
    const groupId =
      groupIdValue === null || groupIdValue === undefined
        ? undefined
        : String(groupIdValue);

    const competitionId = match['competition_id'] ?? context.competitionId ?? null;
    const competitionType = this.normalizeCompetitionType(
      match['competitionType'] ?? context.competitionType,
    );
    const competitionNameValue = match['competitionName'] ?? context.competitionName ?? undefined;
    const competitionName =
      competitionNameValue === undefined || competitionNameValue === null
        ? undefined
        : String(competitionNameValue);

    const dataValue = match['data'] ?? dateValue ?? '';
    const data = dataValue === null || dataValue === undefined ? '' : String(dataValue);

    const normalized: IMatch = {
      id,
      date,
      data,
      player1_name: player1Name,
      player2_name: player2Name,
      player1_score: player1Score,
      player2_score: player2Score,
      setsPoints,
      groupId,
      player1_id: player1Id,
      player2_id: player2Id,
      winner_id: winnerId,
      created,
      desc,
      tournament_id: tournamentId,
      player1_img: player1Img ?? null,
      player2_img: player2Img ?? null,
      match_sets: matchSets,
      competitionType,
      competitionName,
      roundName,
      roundLabel,
    };

    const enriched = normalized as IMatch & { competition_id?: number | string | null };
    enriched.competition_id = competitionId;

    return enriched;
  }

  private normalizeMatchSets(source: unknown, matchId: unknown): IMatchSet[] {
    if (!Array.isArray(source)) {
      return [];
    }

    const fallbackMatchId = this.toOptionalNumber(matchId) ?? 0;

    return source.map((set, index) => {
      const value = (typeof set === 'object' && set !== null ? set : {}) as Record<string, any>;
      const rawId = value['id'] ?? index;
      const rawMatchId = value['match_id'] ?? value['matchId'] ?? matchId;

      const player1Score = this.toNumber(
        value['player1Score'] ?? value['player1_score'],
      );
      const player2Score = this.toNumber(
        value['player2Score'] ?? value['player2_score'],
      );

      return {
        id: this.toNumber(rawId, index),
        match_id: this.toNumber(
          rawMatchId,
          fallbackMatchId !== undefined ? fallbackMatchId : index,
        ),
        player1_score: player1Score,
        player2_score: player2Score,
      };
    });
  }

  private normalizeParticipant(participant: unknown):
    | (Record<string, any> & {
        id?: number;
        playerId?: number;
        nickname?: string;
        name?: string;
        imageUrl?: string | null;
        image_url?: string | null;
      })
    | null {
    if (!participant || typeof participant !== 'object') {
      return null;
    }
    return participant as Record<string, any>;
  }

  private normalizeName(
    nickname?: unknown,
    name?: unknown,
    fallback?: unknown,
  ): string {
    const candidate = nickname ?? name ?? fallback;
    if (candidate === null || candidate === undefined) {
      return '';
    }
    return String(candidate);
  }

  private normalizeCompetitionType(
    type: unknown,
  ): IMatch['competitionType'] | undefined {
    if (type === 'league' || type === 'elimination' || type === 'group_knockout') {
      return type;
    }
    return undefined;
  }

  private toNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toOptionalNumber(value: unknown): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
