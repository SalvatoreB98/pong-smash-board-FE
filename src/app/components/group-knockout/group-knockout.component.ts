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
import { MatchesComponent } from '../matches/matches.component';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { NextMatchesComponent } from '../next-matches/next-matches.component';

@Component({
  selector: 'app-group-knockout',
  standalone: true,
  imports: [
    CommonModule,
    EliminationBracketComponent,
    GroupKnockoutBoardComponent,
    TranslatePipe,
    MatchesComponent,
    NextMatchesComponent
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
  @Output() matchSelected = new EventEmitter<IMatch>();
  private _matches: IMatch[] = [];
  @Input()
  set matches(value: IMatch[]) {
    this._matches = value;
    const now = new Date().getTime();
    this.nextMatches = value?.filter(m => {
      console.log("DEBUG match", m);
      console.log("DEBUG match date", new Date(m.date).getTime(), now);
      return new Date(m.date).getTime() < now;
    }) ?? [];
    console.log("DEBUG next matches", this.nextMatches, value);

  }
  get matches(): IMatch[] {
    return this._matches;
  }
  nextMatches: IMatch[] = [];

  modalService = inject(ModalService);

  ngOnChanges() {
    this.nextMatches = this.matches;
  }

  onRoundSelected(event: EliminationModalEvent) {
    this.roundSelected.emit(event);
  }
  get hasMatches(): boolean {
    return this.matches?.length > 0;
  }
  onMatchSelected(match: IMatch) {
    this.matchSelected.emit(match);
  }
}
