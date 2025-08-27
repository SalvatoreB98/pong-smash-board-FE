import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl,
  ReactiveFormsModule
} from '@angular/forms';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { ModalComponent } from '../../../common/modal/modal.component';
import { ModalService } from '../../../../services/modal.service';
import { DataService } from '../../../../services/data.service';
import { CompetitionService } from '../../../../services/competitions.service';
import { LoaderService } from '../../../../services/loader.service';

type CompetitionType = 'elimination' | 'league' | 'group_knockout';
@Component({
  selector: 'app-add-competition-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './add-competition-modal.component.html',
  styleUrl: './add-competition-modal.component.scss'
})
export class AddCompetitionModalComponent {
  competitionForm: FormGroup;

  constructor(private fb: FormBuilder, public modalService: ModalService, private competitionService: CompetitionService, private loaderService: LoaderService) {

    this.competitionForm = this.fb.group(
      {
        nameCtrl: ['', [Validators.required, Validators.minLength(3)]],
        typeCtrl: [null, Validators.required],
        setsCtrl: [null, Validators.required],
        pointsCtrl: [null, Validators.required],
      },
    );
  }

  // Getter comodi per il template
  get nameCtrl() { return this.competitionForm.get('nameCtrl')!; }
  get typeCtrl() { return this.competitionForm.get('typeCtrl')!; }
  get hybridCtrl() { return this.competitionForm.get('typeCtrl')!; }
  get setsCtrl() { return this.competitionForm.get('setsCtrl')!; }
  get pointsCtrl() { return this.competitionForm.get('pointsCtrl')!; }

  submit() {
    if (this.competitionForm.invalid) {
      this.competitionForm.markAllAsTouched();
      return;
    }
    const payload = {
      name: String(this.nameCtrl.value).trim(),
      type: this.typeCtrl.value as CompetitionType,
      bestOf: this.setsCtrl.value as number,
      pointsTo: this.pointsCtrl.value as number,
    };
    this.addCompetition();
  }

  addCompetition() {
    if (this.competitionForm.invalid) return;
    this.sendCompetition();
    this.closeModal();
  }

  private sendCompetition() {
    if (this.competitionForm.invalid) return;

    this.loaderService.startLittleLoader();
    try {
      const toYmd = (d: string | Date | null) =>
        d ? new Date(d).toLocaleDateString("en-CA") : undefined; // → YYYY-MM-DD

      const formValue = this.competitionForm.value;

      const payload = {
        name: formValue.nameCtrl,
        type: formValue.typeCtrl,            // "league" | "elimination" ...
        bestOf: formValue.setsCtrl,        // es. 3/5/7
        pointsTo: formValue.pointsCtrl,    // es. 11/21
        startDate: toYmd(formValue.startDate) ?? undefined,
        endDate: toYmd(formValue.endDate) ?? undefined
      };

      console.log('Saving competition...', payload);
      console.log('Saving competition...', payload);
      
      this.competitionService.addCompetition(payload).then((res) => {
        console.log('Competition added:', res);
        this.closeModal();
      });

    } catch (error) {
      console.log(error)
      this.loaderService.stopLittleLoader()
    } finally {
      this.loaderService.stopLittleLoader()
    }
  }

  closeModal() {
    this.modalService.closeModal();
  }
}
