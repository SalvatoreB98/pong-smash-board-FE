import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ICompetition } from '../../../../../api/competition.api';
import { CompetitionService } from '../../../../../services/competitions.service';
import { ModalService } from '../../../../../services/modal.service';
import { SHARED_IMPORTS } from '../../../../common/imports/shared.imports';

@Component({
  selector: 'app-view-competition-modal',
  imports: [SHARED_IMPORTS],
  templateUrl: './view-competition-modal.component.html',
  styleUrl: './view-competition-modal.component.scss'
})
export class ViewCompetitionModalComponent {
  @Input() competition: ICompetition | null = null;
  @Output() actionSelected = new EventEmitter<{ action: string, competition: ICompetition | null }>();
  private competitionService = inject(CompetitionService);
  readonly detailsModalName = 'viewCompetitionModal';
  readonly editModalName = 'editCompetitionModal';
  constructor(public modalService: ModalService) { }

  ngOnInit() {
    console.log('CompetitionDetailComponent initialized with competition:', this.competition?.id);
  }

  isEmpty(array: any): boolean {
    return !array || (Array.isArray(array) && array.length === 0);
  }
}
