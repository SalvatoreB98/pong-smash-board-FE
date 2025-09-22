import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ICompetition } from '../../../api/competition.api';
import { TranslatePipe } from '../../utils/translate.pipe';
import { EliminationRound } from '../../interfaces/elimination-bracket.interface';
import { ModalService } from '../../../services/modal.service';

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
  modalService = inject(ModalService);

  ngOnInit() {
    console.log('EliminationBracketComponent initialized');
    console.log('Competition:', this.competition);
    console.log('Rounds:', this.rounds);
  }

  trackByRound(index: number, round: EliminationRound) {
    console.log('trackByRound called:', index, round);
    return `${round.name}-${index}`;
  }

  trackByMatch(index: number, _match: unknown) {
    console.log('trackByMatch called:', index, _match);
    return index;
  }
}
