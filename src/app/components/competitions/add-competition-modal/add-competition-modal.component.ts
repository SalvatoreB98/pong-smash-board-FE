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

  ngOnInit() {
    this.updateCompetitionTypes();

    // 🔄 Aggiorna quando cambia il tipo di gestione
    this.managementForm.get('managementCtrl')?.valueChanges.subscribe(() => {
      this.updateCompetitionTypes();
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
    if (this.competitionForm.invalid || this.managementForm.invalid) return;

    const toYmd = (d: any) => d ? new Date(d).toLocaleDateString("en-CA") : undefined;

    // Estrai i valori in modo esplicito
    const { nameCtrl, typeCtrl, setsCtrl, pointsCtrl, startDate, endDate } = this.competitionForm.value;
    const { managementCtrl, isPartOfCompetitionCtrl } = this.managementForm.value;

    const payload = {
      name: nameCtrl,
      type: typeCtrl,
      bestOf: Number(setsCtrl), // Assicurati che siano numeri
      pointsTo: Number(pointsCtrl),
      startDate: toYmd(startDate),
      endDate: toYmd(endDate),
      management: managementCtrl,
      isPartOfCompetition: !!isPartOfCompetitionCtrl, // Forza il cast a booleano
    };

    console.log('Payload inviato:', payload);

    this.competitionService.addCompetition(payload)
      .then(() => this.closeModal())
      .catch(err => console.error('Errore:', err));
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
        return this.competitionForm.get('setsCtrl')?.invalid ?? true;
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
