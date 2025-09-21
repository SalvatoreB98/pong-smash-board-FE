import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ICompetition } from '../../../api/competition.api';
import { TranslatePipe } from '../../utils/translate.pipe';
import { EliminationRound } from '../../interfaces/elimination-bracket.interface';

@Component({
  selector: 'app-elimination-bracket',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './elimination-bracket.component.html',
  styleUrl: './elimination-bracket.component.scss'
})
export class EliminationBracketComponent {
  @Input() competition: ICompetition | null = null;
  @Input() rounds: EliminationRound[] = [];

  trackByRound(index: number, round: EliminationRound) {
    return `${round.name}-${index}`;
  }

  trackByMatch(index: number, _match: unknown) {
    return index;
  }
}
