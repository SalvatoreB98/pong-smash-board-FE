import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ICompetition } from '../../../api/competition.api';
import { TranslatePipe } from '../../utils/translate.pipe';
import { EliminationMatchSlot, EliminationRound } from '../../interfaces/elimination-bracket.interface';
import { ModalService } from '../../../services/modal.service';
import { IPlayer } from '../../../services/players.service';
import { IMatch } from '../../interfaces/matchesInterfaces';

export interface EliminationModalEvent {
  modalName: string;
  player1: IPlayer | null;
  player2: IPlayer | null;
  match?: IMatch | null;
  roundName?: string | null;
  roundLabel?: string;
}

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
  @Input() readonly = false;
  modalService = inject(ModalService);
  @Output() playersSelected = new EventEmitter<EliminationModalEvent>();

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
  openModal(modalName: string, options: {
    player1?: IPlayer | null;
    player2?: IPlayer | null;
    match?: IMatch | null;
    roundName?: string | null;
    roundLabel?: string;
  } = {}) {
    if (this.readonly) {
      return;
    }
    console.log('openModal called with:', modalName, options);
    this.playersSelected.emit({
      modalName,
      player1: options.player1 ?? null,
      player2: options.player2 ?? null,
      match: options.match ?? null,
      roundName: options.roundName ?? null,
      roundLabel: options.roundLabel,
    });
  }

  isSlotWinner(slot: EliminationMatchSlot, winnerId: number | string | null | undefined): boolean {
    if (!slot?.player || winnerId == null) {
      return false;
    }

    return String(slot.player.id) === String(winnerId);
  }

}
