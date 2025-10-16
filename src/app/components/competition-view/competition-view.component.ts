import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DataService,
  ICompetitionViewMatchSummary,
  ICompetitionViewPlayer,
  ICompetitionViewResponse,
} from '../../../services/data.service';

@Component({
  selector: 'app-competition-view',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DatePipe],
  templateUrl: './competition-view.component.html',
  styleUrl: './competition-view.component.scss',
})
export class CompetitionViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(DataService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly competition = signal<ICompetitionViewResponse | null>(null);

  readonly competitionInfo = computed(() => this.competition()?.competition ?? null);

  readonly participantsCount = computed(() => {
    const stats = this.competition()?.stats;
    if (stats?.totalPlayers != null) {
      return stats.totalPlayers;
    }
    return this.competition()?.players?.length ?? null;
  });

  readonly statsEntries = computed(() => {
    const stats = this.competition()?.stats;
    if (!stats) {
      return [] as {
        key: string;
        label: string;
        value: number | string;
        isDate: boolean;
      }[];
    }

    const entries: { key: keyof typeof stats; label: string }[] = [
      { key: 'totalPlayers', label: 'Giocatori totali' },
      { key: 'totalMatches', label: 'Partite totali' },
      { key: 'completedMatches', label: 'Partite concluse' },
      { key: 'upcomingMatches', label: 'Partite in arrivo' },
      { key: 'totalPoints', label: 'Punti complessivi' },
      { key: 'totalSets', label: 'Set giocati' },
      { key: 'lastPlayedAt', label: 'Ultima partita' },
    ];

    return entries
      .map(({ key, label }) => {
        const value = stats[key];
        if (value == null || value === '') {
          return null;
        }
        return {
          key: key as string,
          label,
          value: value as number | string,
          isDate: key === 'lastPlayedAt',
        };
      })
      .filter(
        (entry): entry is {
          key: string;
          label: string;
          value: number | string;
          isDate: boolean;
        } => entry !== null
      );
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        filter((id) => !Number.isNaN(id) && id > 0),
        distinctUntilChanged(),
        tap(() => {
          this.isLoading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap((competitionId) =>
          this.dataService.getCompetitionView(competitionId).pipe(
            catchError((error) => {
              console.error('Unable to load competition view', error);
              this.errorMessage.set('Impossibile caricare la competizione.');
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((data) => {
        this.competition.set(data);
        this.isLoading.set(false);
      });
  }

  trackPlayer(_: number, player: ICompetitionViewPlayer) {
    return player.playerId ?? player.player.id;
  }

  trackMatch(_: number, match: ICompetitionViewMatchSummary) {
    return match.id;
  }

  formatMatchScore(match: ICompetitionViewMatchSummary): string | null {
    const score = match.score;
    if (!score) {
      return null;
    }
    const { player1, player2 } = score;
    if (
      player1 == null ||
      player2 == null ||
      Number.isNaN(player1) ||
      Number.isNaN(player2)
    ) {
      return null;
    }
    return `${player1} - ${player2}`;
  }

  formatMatchSets(match: ICompetitionViewMatchSummary): string | null {
    if (!match.matchSets?.length) {
      return null;
    }
    return match.matchSets
      .map((set) => `${set.player1Score}-${set.player2Score}`)
      .join(', ');
  }
}
