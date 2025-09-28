import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatchesComponent } from '../../matches/matches.component';
import { ModalService } from '../../../../services/modal.service';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { StatsComponent } from '../../../common/stats/stats.component';
import { IMatch } from '../../../interfaces/matchesInterfaces';

@Component({
  selector: 'app-league-board',
  standalone: true,
  imports: [CommonModule, MatchesComponent, TranslatePipe, StatsComponent],
  templateUrl: './league-board.component.html',
  styleUrl: './league-board.component.scss'
})
export class LeagueBoardComponent {
  @Input() matches: IMatch[] = [];
  @Input() isLoading = false;
  @Output() matchSelected = new EventEmitter<IMatch>();

  modalService = inject(ModalService);

  readonly placeholderMatchCards = Array.from({ length: 1 });
  readonly placeholderStatsRows = Array.from({ length: 5 });

  onMatchSelected(match: IMatch) {
    this.matchSelected.emit(match);
  }

  get hasMatches(): boolean {
    return this.matches.length > 0;
  }

  get showEmptyState(): boolean {
    return !this.isLoading && !this.hasMatches;
  }
}
