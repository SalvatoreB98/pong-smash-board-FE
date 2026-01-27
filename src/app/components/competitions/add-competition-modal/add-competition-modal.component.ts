import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { ModalService } from '../../../../services/modal.service';
import { CompetitionService } from '../../../../services/competitions.service';
import { LoaderService } from '../../../../services/loader.service';
import { StepIndicatorComponent } from '../../../common/step-indicator/step-indicator.component';
import { UserService } from '../../../../services/user.service';
import { CompetitionType } from '../../../../api/competition.api';

@Component({
  selector: 'app-add-competition-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, StepIndicatorComponent],
  templateUrl: './add-competition-modal.component.html',
  styleUrl: './add-competition-modal.component.scss',
})
export class AddCompetitionModalComponent {
  competitionForm: FormGroup;
  step = 1;
  managementForm: FormGroup;
  competitionTypes: any[] = [];
  readonly freeSetsMin = 1;
  readonly freeSetsMax = 99;
  readonly freeSetsSentinel = 'FREE';
  readonly setsModeStandard = 'STANDARD';
  readonly setsModeFree = 'FREE';

  ngOnInit() {
    this.updateCompetitionTypes();

    // 🔄 Aggiorna quando cambia il tipo di gestione
    this.managementForm.get('managementCtrl')?.valueChanges.subscribe(() => {
      this.updateCompetitionTypes();
    });

    this.setsCtrl.valueChanges.subscribe((value) => {
      if (value === this.freeSetsSentinel) {
        this.freeSetsCtrl.enable({ emitEvent: false });
        this.freeSetsCtrl.setValidators([
          Validators.required,
          Validators.min(this.freeSetsMin),
          Validators.max(this.freeSetsMax),
        ]);
        this.freeSetsCtrl.updateValueAndValidity({ emitEvent: false });
        this.freeSetsCtrl.markAsTouched({ onlySelf: true });
        return;
      }

      if (this.freeSetsCtrl.enabled) {
        this.freeSetsCtrl.reset(null, { emitEvent: false });
        this.freeSetsCtrl.disable({ emitEvent: false });
      }
      this.freeSetsCtrl.clearValidators();
      this.freeSetsCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  private updateCompetitionTypes() {
    if (this.managementForm.get('managementCtrl')?.value !== 'admin') {
      this.competitionTypes = [
        {
          value: 'league',
          icon: '/numbered-list.png',
          labelKey: 'competition_type_league',
          descriptionKey: 'competition_type_league_description'
        }
      ];
    } else {
      this.competitionTypes = [
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
        },
        {
          value: 'group_knockout',
          icon: '/trophy.png',
          labelKey: 'competition_type_group_knockout',
          descriptionKey: 'competition_type_group_knockout_description',
        }
      ];
    }
  }

  constructor(private fb: FormBuilder, public modalService: ModalService, private competitionService: CompetitionService, private loaderService: LoaderService, private userService: UserService) {

    this.competitionForm = this.fb.group(
      {
        nameCtrl: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
        typeCtrl: [null, Validators.required],
        setsCtrl: [3, Validators.required],
        freeSetsCtrl: [{ value: null, disabled: true }],
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
  get freeSetsCtrl() { return this.competitionForm.get('freeSetsCtrl')!; }
  get pointsCtrl() { return this.competitionForm.get('pointsCtrl')!; }
  get setsMode(): string {
    return this.setsCtrl.value === this.freeSetsSentinel ? this.setsModeFree : this.setsModeStandard;
  }
  get effectiveSets(): number | null {
    if (this.setsCtrl.value === this.freeSetsSentinel) {
      const value = Number(this.freeSetsCtrl.value);
      return Number.isFinite(value) ? value : null;
    }
    return this.setsCtrl.value as number;
  }

  submit() {
    if (this.competitionForm.invalid) {
      this.competitionForm.markAllAsTouched();
      return;
    }
    const effectiveSets = this.effectiveSets;
    if (effectiveSets === null) {
      this.freeSetsCtrl.markAsTouched({ onlySelf: true });
      return;
    }
    const payload = {
      name: String(this.nameCtrl.value).trim(),
      type: this.typeCtrl.value as CompetitionType,
      bestOf: effectiveSets,
      pointsTo: this.pointsCtrl.value as number,
      setsMode: this.setsMode,
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
      const effectiveSets = this.effectiveSets;
      if (effectiveSets === null) {
        this.freeSetsCtrl.markAsTouched({ onlySelf: true });
        return;
      }

      const payload = {
        name: formValue.nameCtrl,
        type: formValue.typeCtrl,            // "league" | "elimination" ...
        bestOf: effectiveSets,        // es. 3/5/7
        setsMode: this.setsMode,           // STANDARD | FREE (assunzione: backend opzionale)
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
        return this.competitionForm.get('typeCtrl')?.invalid ?? true;
      case 3:
        return this.competitionForm.get('nameCtrl')?.invalid ?? true;
      case 4:
        return this.competitionForm.get('setsCtrl')?.invalid
          || (this.setsCtrl.value === this.freeSetsSentinel && this.freeSetsCtrl.invalid);
      case 5:
        return this.competitionForm.get('pointsCtrl')?.invalid ?? true;
      default:
        return false;
    }
  }
  trackByValue(index: number, item: any) {
    return item.value;
  }
}
