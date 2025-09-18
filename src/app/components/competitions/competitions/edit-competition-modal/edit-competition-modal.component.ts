import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICompetition } from '../../../../../api/competition.api';
import { CompetitionService } from '../../../../../services/competitions.service';
import { ModalService } from '../../../../../services/modal.service';
import { SHARED_IMPORTS } from '../../../../common/imports/shared.imports';

@Component({
  selector: 'app-edit-competition-modal',
  imports: [SHARED_IMPORTS],
  templateUrl: './edit-competition-modal.component.html',
  styleUrl: './edit-competition-modal.component.scss'
})
export class EditCompetitionModalComponent {
  competition?: ICompetition;
  modalService = inject(ModalService);
  competitionService = inject(CompetitionService);
  fb = inject(FormBuilder);

  competitionForm!: FormGroup;

  ngOnInit() {
    this.competitionForm = this.fb.group({
      name: [this.competition?.name, Validators.required],
    });
  }


  saveCompetition() {
    if (this.competitionForm.valid) {
      this.competitionService.update(this.competition!.id, this.competitionForm.value).subscribe(() => {
        this.modalService.closeModal();
      });
    }
  }
}
