import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { ICompetition } from '../../../../api/competition.api';
import { ModalService } from '../../../../services/modal.service';
import { MSG_TYPE } from '../../../utils/enum';
import { CompetitionService } from '../../../../services/competitions.service';
import { LoaderService } from '../../../../services/loader.service';
import { TranslationService } from '../../../../services/translation.service';

@Component({
  selector: 'app-competition-detail',
  imports: [...SHARED_IMPORTS],
  templateUrl: './competition-detail.component.html',
  styleUrl: './competition-detail.component.scss'
})
export class CompetitionDetailComponent {

  @Input() competition: ICompetition | null = null;
  @Output() actionSelected = new EventEmitter<{ action: string, competition: ICompetition | null }>();
  
  copied: boolean = false;
  private competitionService = inject(CompetitionService);
  activeCompetition$ = this.competitionService.activeCompetition$;

  constructor(public modalService: ModalService, private loader: LoaderService, private translateService: TranslationService) { }
  
  readonly detailsModalName = 'viewCompetitionModal';
  readonly editModalName = 'editCompetitionModal';

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

  copyCode() {
    this.activeCompetition$.subscribe(comp => {
      console.log(comp);
      if (comp?.['code']) {
        navigator.clipboard.writeText(comp['code'])
          .then(() => {
            this.loader.showToast(this.translateService.translate('code_copied'), MSG_TYPE.SUCCESS);
            setTimeout(() => this.copied = false, 2000); // reset messaggio dopo 2s
          })
          .catch(() => {
            this.loader.showToast(this.translateService.translate('code_copy_failed'), MSG_TYPE.ERROR);
          });
      } else {
        this.loader.showToast(this.translateService.translate('code_not_available'), MSG_TYPE.ERROR);
      }
    });
  }
}
