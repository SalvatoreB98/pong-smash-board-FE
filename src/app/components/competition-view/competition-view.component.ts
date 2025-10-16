import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompetitionService } from '../../../services/competitions.service';
import { ICompetition } from '../../../api/competition.api';
import { IMatch } from '../../interfaces/matchesInterfaces';
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
  matches?: IMatch[] | null;
  matchesLeague?: IMatch[] | null;
  matchesElimination?: IMatch[] | null;
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
      [];

    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((match, index) => {
      const normalized = match as IMatch;
      const id = (normalized as any)?.id ?? index;
      return {
        ...normalized,
        id: String(id),
      };
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
}
