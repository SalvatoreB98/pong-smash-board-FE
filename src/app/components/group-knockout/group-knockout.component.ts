import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatchesComponent } from '../matches/matches.component';
import { StatsComponent } from '../../common/stats/stats.component';
import { EliminationBracketComponent, EliminationModalEvent } from '../elimination-bracket/elimination-bracket.component';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { EliminationRound } from '../../interfaces/elimination-bracket.interface';
import { IPlayer } from '../../../services/players.service';
import { ICompetition } from '../../../api/competition.api';
import { TranslatePipe } from '../../utils/translate.pipe';
import { ModalService } from '../../../services/modal.service';
import { GroupKnockoutBoardComponent } from './group-knockout-board.component';

@Component({
  selector: 'app-group-knockout',
  standalone: true,
  imports: [
    CommonModule,
    MatchesComponent,
    StatsComponent,
    EliminationBracketComponent,
    GroupKnockoutBoardComponent,
    TranslatePipe,
  ],
  templateUrl: './group-knockout.component.html',
  styleUrl: './group-knockout.component.scss'
})
export class GroupKnockoutComponent {
  @Input() matches: IMatch[] = [];
  @Input() rounds: EliminationRound[] = [];
  @Input() players: IPlayer[] = [];
  @Input() qualifiedPlayers: IPlayer[] = [];
  @Input() competition: ICompetition | null = null;

  @Output() matchSelected = new EventEmitter<IMatch>();
  @Output() roundSelected = new EventEmitter<EliminationModalEvent>();

  modalService = inject(ModalService);

  onMatchSelected(match: IMatch) {
    this.matchSelected.emit(match);
  }

  onRoundSelected(event: EliminationModalEvent) {
    this.roundSelected.emit(event);
  }
}
