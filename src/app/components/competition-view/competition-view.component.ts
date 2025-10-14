import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DataService,
  ICompetitionMatchSummary,
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

  readonly participantsCount = computed(() => {
    const competition = this.competition();
    if (!competition) {
      return null;
    }
    return (
      competition.participantsCount ?? competition.players?.length ?? null
    );
  });

  readonly shouldShowNextMatches = computed(() => {
    const competition = this.competition();
    if (!competition) {
      return false;
    }
    const hasMatches = (competition.nextMatches?.length ?? 0) > 0;
    const type = competition.type;
    return hasMatches && (type === 'elimination' || type === 'group_knockout');
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
    return player.id ?? player.nickname ?? player.name;
  }

  trackMatch(_: number, match: ICompetitionMatchSummary) {
    return match.id;
  }

  formatMatchScore(match: ICompetitionMatchSummary): string | null {
    if (
      match.player1_score == null ||
      match.player2_score == null ||
      Number.isNaN(match.player1_score) ||
      Number.isNaN(match.player2_score)
    ) {
      return null;
    }
    return `${match.player1_score} - ${match.player2_score}`;
  }
}
