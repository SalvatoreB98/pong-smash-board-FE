import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl,
  ReactiveFormsModule
} from '@angular/forms';
import { TranslatePipe } from '../../../utils/translate.pipe';

type CompetitionType = 'elimination' | 'league';

@Component({
  selector: 'app-add-competition-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe], // 👈 QUI
  templateUrl: './add-competition-modal.component.html',
  styleUrl: './add-competition-modal.component.scss'
})
export class AddCompetitionModalComponent {
  competitionForm: FormGroup;

  constructor(private fb: FormBuilder) {
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
    console.log('✅ Create competition →', payload);
  }
}
