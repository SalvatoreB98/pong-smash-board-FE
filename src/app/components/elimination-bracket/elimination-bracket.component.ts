import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ICompetition } from '../../../api/competition.api';
import { TranslatePipe } from '../../utils/translate.pipe';
import { EliminationRound } from '../../interfaces/elimination-bracket.interface';
import { ModalService } from '../../../services/modal.service';
import { IPlayer } from '../../../services/players.service';

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
  @Output() playersSelected = new EventEmitter<{ modalName: string, player1: IPlayer | null, player2: IPlayer | null }>();

  ngOnInit() {
    console.log('EliminationBracketComponent initialized');
    console.log('Competition:', this.competition);
    console.log('Rounds:', this.rounds);
  }

  trackByRound(index: number, round: EliminationRound) {
    return `${round.name}-${index}`;
  }

  trackByMatch(index: number, _match: unknown) {
    return index;
  }
  openModal(modalName: string, player1: any, player2: any) {
    console.log('openModal called with:', modalName, player1, player2);
    const objectToEmit = { modalName, player1, player2 };
    this.playersSelected.emit(objectToEmit);
  }

}
