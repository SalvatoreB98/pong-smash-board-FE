import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { EliminationBracketComponent, EliminationModalEvent } from '../elimination-bracket/elimination-bracket.component';
import { EliminationRound } from '../../interfaces/elimination-bracket.interface';
import { IPlayer } from '../../../services/players.service';
import { ICompetition } from '../../../api/competition.api';
import { TranslatePipe } from '../../utils/translate.pipe';
import { ModalService } from '../../../services/modal.service';
import { GroupKnockoutBoardComponent } from './group-knockout-board.component';
import { Group } from '../../interfaces/group.interface';

@Component({
  selector: 'app-group-knockout',
  standalone: true,
  imports: [
    CommonModule,
    EliminationBracketComponent,
    GroupKnockoutBoardComponent,
    TranslatePipe,
  ],
  templateUrl: './group-knockout.component.html',
  styleUrl: './group-knockout.component.scss'
})
export class GroupKnockoutComponent {
  @Input() rounds: EliminationRound[] = [];
  @Input() groups: Group[] = [];
  @Input() qualifiedPlayers: IPlayer[] = [];
  @Input() competition: ICompetition | null = null;

  @Output() roundSelected = new EventEmitter<EliminationModalEvent>();

  modalService = inject(ModalService);

  onRoundSelected(event: EliminationModalEvent) {
    this.roundSelected.emit(event);
  }
}
