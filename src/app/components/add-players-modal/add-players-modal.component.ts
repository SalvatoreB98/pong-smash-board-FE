import { Component, inject } from '@angular/core';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { UserService } from '../../../services/user.service';
import { CompetitionService } from '../../../services/competitions.service';

@Component({
  selector: 'app-add-players-modal',
  imports: [...SHARED_IMPORTS],
  templateUrl: './add-players-modal.component.html',
  styleUrl: './add-players-modal.component.scss'
})
export class AddPlayersModalComponent {

  competitionService = inject(CompetitionService);
  activeCompetition$ = this.competitionService.activeCompetition$;
  constructor() { }
  addPlayer() {
    // Logica per aggiungere un giocatore
  }
}
