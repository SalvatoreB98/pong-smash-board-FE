import { Component } from '@angular/core';
import { EventEmitter, Output } from '@angular/core';
import { TranslatePipe } from '../../../../utils/translate.pipe';

@Component({
  selector: 'app-competition-start',
  imports: [TranslatePipe],
  templateUrl: './competition-start.component.html',
  styleUrl: './competition-start.component.scss'
})
export class CompetitionStartComponent {
  @Output() create = new EventEmitter<any>();

  createNewCompetition() {
    this.create.emit();
  }
}
