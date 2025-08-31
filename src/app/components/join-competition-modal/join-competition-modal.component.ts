import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-join-competition-modal',
  imports: [CommonModule, ...SHARED_IMPORTS, FormsModule],
  templateUrl: './join-competition-modal.component.html',
  styleUrl: './join-competition-modal.component.scss'
})
export class JoinCompetitionModalComponent {
  competitionCode: string = '';
  showInstructions: boolean = false;

  onWhereClick() {
    this.showInstructions = true;
  }
}
