import { Component, Input } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { ICompetition } from '../../../../api/competition.api';
import { ModalService } from '../../../../services/modal.service';

@Component({
  selector: 'app-competition-detail',
  imports: [...SHARED_IMPORTS],
  templateUrl: './competition-detail.component.html',
  styleUrl: './competition-detail.component.scss'
})
export class CompetitionDetailComponent {
  @Input() competition: ICompetition | null = null;
  
  constructor(public modalService: ModalService) {}
  
  ngOnInit() {
    console.log('CompetitionDetailComponent initialized with competition:', this.competition?.id);
  }
}
