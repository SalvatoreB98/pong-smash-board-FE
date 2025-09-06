import { Component, inject } from '@angular/core';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { UserService } from '../../../services/user.service';
import { CompetitionService } from '../../../services/competitions.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
export interface IPlayerToAdd {
  name: string;
  surname: string;
  imgUrl: string;
  nickname: string;
}
@Component({
  selector: 'app-add-players-modal',
  imports: [...SHARED_IMPORTS, FormsModule, ReactiveFormsModule],
  templateUrl: './add-players-modal.component.html',
  styleUrl: './add-players-modal.component.scss'
})
export class AddPlayersModalComponent {

  addPlayerForm: FormGroup ;
  competitionService = inject(CompetitionService);
  activeCompetition$ = this.competitionService.activeCompetition$;
  playersToAdd: IPlayerToAdd[] = [];

  constructor(private fb: FormBuilder) {
    this.addPlayerForm = this.fb.group({
      name: [''],
      surname: [''],
      imgUrl: [''],
      nickname: ['']
    });
  }

  addPlayer() {
    if (this.addPlayerForm.valid) {
      const player: IPlayerToAdd = this.addPlayerForm.value;
      this.playersToAdd.push(player);
      this.addPlayerForm.reset();
    }
  }
  removePlayer(index: number) {
    this.playersToAdd.splice(index, 1);
  }

  addPlayers() {
    // Logica per aggiungere i giocatori
  }
}
