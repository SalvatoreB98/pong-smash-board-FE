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
import { StepIndicatorComponent } from '../../../common/step-indicator/step-indicator.component';
import { UserService } from '../../../../services/user.service';
import { CompetitionType } from '../../../../api/competition.api';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
@Component({
  selector: 'app-add-competition-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, StepIndicatorComponent],
  templateUrl: './add-competition-modal.component.html',
  styleUrl: './add-competition-modal.component.scss',
  animations: [
    trigger('buttonShift', [
      state('center', style({
        justifyContent: 'center',
        gap: '0'
      })),
      state('side', style({
        justifyContent: 'space-between',
        gap: '1rem'
      })),
      transition('center => side', [
        animate('300ms ease-in-out')
      ]),
      transition('side => center', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class AddCompetitionModalComponent {
  competitionForm: FormGroup;
  step = 1;
  managementForm: FormGroup;

  getCompetitionTypes(): { value: CompetitionType; icon: string; labelKey: string; descriptionKey?: string; badgeKey?: string; disabled?: boolean; }[] {
    return [
      {
        value: 'league',
        icon: '/numbered-list.png',
        labelKey: 'competition_type_league',
        descriptionKey: 'competition_type_league_description'
      },
      {
        value: 'elimination',
        icon: '/vs.svg',
        labelKey: 'competition_type_elimination',
        descriptionKey: 'competition_type_elimination_description',
        badgeKey: 'beta_label',
        disabled: this.managementForm.get('managementCtrl')?.value !== 'admin'
      },
      {
        value: 'group_knockout',
        icon: '/trophy.png',
        labelKey: 'competition_type_group_knockout',
        descriptionKey: 'competition_type_group_knockout_description',
      }
    ];
  }

  constructor(private fb: FormBuilder, public modalService: ModalService, private competitionService: CompetitionService, private loaderService: LoaderService, private userService: UserService) {

    this.competitionForm = this.fb.group(
      {
        nameCtrl: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
        typeCtrl: [null, Validators.required],
        setsCtrl: [null, Validators.required],
        pointsCtrl: [null, Validators.required],
      },
    );

    this.managementForm = this.fb.group(
      {
        managementCtrl: [null, Validators.required],
        isPartOfCompetitionCtrl: [true, Validators.required],
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
        endDate: toYmd(formValue.endDate) ?? undefined,
        management: this.managementForm.value.managementCtrl,
        isPartOfCompetition: this.managementForm.value.isPartOfCompetitionCtrl,
      };

      console.log('Saving competition...', payload);
      console.log('Saving competition...', payload);
      this.competitionService.addCompetition(payload).then((res) => {
        console.log('Competition added:', res);
        this.closeModal();
      });

    } catch (error) {
      console.log(error)
    } finally {
    }
  }

  nextStep() {
    if (this.step < 6) {
      this.step++;
    }
  }

  back() {
    if (this.step > 1) {
      this.step--;
    }
  }

  goToStep(step: number) {
    this.step = step;
  }

  closeModal() {
    this.modalService.closeModal();
  }
  isNextDisabled(): boolean {
    switch (this.step) {
      case 1:
        return this.managementForm.invalid;
      case 2:
        return this.competitionForm.get('nameCtrl')?.invalid ?? true;
      case 3:
        return this.competitionForm.get('typeCtrl')?.invalid ?? true;
      case 4:
        return this.competitionForm.get('setsCtrl')?.invalid ?? true;
      case 5:
        return this.competitionForm.get('pointsCtrl')?.invalid ?? true;
      default:
        return false;
    }
  }
  get buttonState() {
    return this.step === 1 ? 'center' : 'side';
  }
}
