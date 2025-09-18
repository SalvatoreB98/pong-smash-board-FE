import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { ICompetition } from '../../../../api/competition.api';
import { ModalService } from '../../../../services/modal.service';
import { CompetitionService } from '../../../../services/competitions.service';

@Component({
  selector: 'app-competition-detail',
  imports: [...SHARED_IMPORTS],
  templateUrl: './competition-detail.component.html',
  styleUrl: './competition-detail.component.scss'
})
export class CompetitionDetailComponent {
  @Input() competition: ICompetition | null = null;
  @Output() actionSelected = new EventEmitter<{ action: string, competition: ICompetition | null }>();
  private competitionService = inject(CompetitionService);
  readonly detailsModalName = 'competitionDetailsModal';
  readonly editModalName = 'editCompetitionModal';
  constructor(public modalService: ModalService) { }

  ngOnInit() {
    console.log('CompetitionDetailComponent initialized with competition:', this.competition?.id);
  }

  isEmpty(array: any): boolean {
    return !array || (Array.isArray(array) && array.length === 0);
  }
  onDropdownAction(action: string) {
    if (!this.competition?.id) {
      return;
    }

    switch (action) {
      case 'favorite':
        this.competitionService.updateActiveCompetition(this.competition.id).subscribe();
        break;
      case 'delete':
        this.competitionService.remove(this.competition.id).subscribe(() => {
          this.competitionService.getCompetitions(true);
        });
        break;
      case 'details':
        this.modalService.openModal(this.detailsModalName);
        break;
      case 'edit':
        this.modalService.openModal(this.editModalName);
        break;
    }

    this.actionSelected.emit({ action, competition: this.competition });
  }
}
