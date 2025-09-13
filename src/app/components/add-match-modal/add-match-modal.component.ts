import { Component, EventEmitter, Output, OnInit, ViewChild, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../services/modal.service';
import { DataService } from '../../../services/data.service';
import { SelectPlayerComponent } from '../../utils/components/select-player/select-player.component';
import { TranslatePipe } from '../../utils/translate.pipe';
import { MSG_TYPE } from '../../utils/enum';
import { LoaderService } from '../../../services/loader.service';
import { TranslationService } from '../../../services/translation.service';
import { ManualPointsComponent } from './manual-points/manual-points.component';
import { CompetitionService } from '../../../services/competitions.service';
import { ICompetition } from '../../../api/competition.api';

@Component({
  selector: 'app-add-match-modal',
  standalone: true,
  templateUrl: './add-match-modal.component.html',
  styleUrls: ['./add-match-modal.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, SelectPlayerComponent, TranslatePipe, ManualPointsComponent]
})
export class AddMatchModalComponent implements OnInit {
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() openManualPointsEvent = new EventEmitter<void>();
  @Input() players: any[] = [];
  competition: ICompetition | null = null;
  // manualSetPointsActive: boolean = false;
  maxSets: number = 5;
  maxPoints: number = 11;
  matchForm!: FormGroup;
  isShowSetsPointsTrue = false;
  constructor(
    private fb: FormBuilder,
    private modalService: ModalService,
    private dataService: DataService,
    private loaderService: LoaderService,
    private translateService: TranslationService,
    private competitionService: CompetitionService
  ) { }

  ngOnChanges() {
    console.log('Players input changed:', this.players);
  }

  ngOnInit() {
    if (this.players.length < 2) {
      this.loaderService.showToast(this.translateService.translate('not_enough_players'), MSG_TYPE.WARNING);
      this.closeModal();
    }
    this.competitionService.activeCompetition$.subscribe(comp => {
      this.competition = comp;
      this.maxPoints = this.competition?.['points_type'] || 21;
      this.maxSets = this.competition?.['sets_type'] || 10;
      console.info("BTR", this.competition, this.maxPoints, this.maxSets);
      this.initializeForm();
    });
  }

  getPlayers(player?: number): any[] {
    if (!this.players || this.players.length === 0) return [];

    const loggedInPlayerId = this.dataService.getLoggedInPlayerId();

    let filteredPlayers = this.players.filter(p => p.id !== loggedInPlayerId);

    const selectedPlayer1 = this.matchForm.get('player1')?.value;
    const selectedPlayer2 = this.matchForm.get('player2')?.value;

    if (player === 1 && selectedPlayer2) {
      filteredPlayers = filteredPlayers.filter(p => p.id !== selectedPlayer2);
    }

    if (player === 2 && selectedPlayer1) {
      filteredPlayers = filteredPlayers.filter(p => p.id !== selectedPlayer1);
    }

    return filteredPlayers;
  }


  initializeForm() {
    this.matchForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      player1: ['', Validators.required],
      player2: ['', Validators.required],
      p1Score: [null, [Validators.required, Validators.min(0), Validators.max(this.maxSets), this.validateSetsPoints(this.maxSets)]],
      p2Score: [null, [Validators.required, Validators.min(0), Validators.max(this.maxSets), this.validateSetsPoints(this.maxSets)]],
      isShowSetsPointsTrue: [false],
      setsPoints: this.fb.array([]),
    });
    this.matchForm.valueChanges.subscribe((e) => console.log('Form changes', e));
  }

  get setsPoints(): FormArray {
    return this.matchForm.get('setsPoints') as FormArray;
  }

  setPlayer(player: any) {
    this.matchForm.get(`player${player.playerNumber}`)?.setValue(player.id);
  }

  updateContainers() {
    this.isShowSetsPointsTrue = this.matchForm.value.isShowSetsPointsTrue;
    const totalPoints = (this.matchForm.value.p1Score || 0) + (this.matchForm.value.p2Score || 0);
    const totalSets = this.isShowSetsPointsTrue ? Math.max(totalPoints, 1) : 0;

    this.setsPoints.clear();
    for (let i = 0; i < totalSets; i++) {
      this.setsPoints.push(
        this.fb.group({
          player1Points: [null, [Validators.required, Validators.min(0), Validators.max(this.maxPoints)]],
          player2Points: [null, [Validators.required, Validators.min(0), Validators.max(this.maxPoints)]]
        })
      );
    }
  }

  getSetFormGroup(index: number): FormGroup {
    return this.setsPoints.at(index) as FormGroup;
  }

  addMatch() {
    if (this.matchForm.invalid) return;

    if (this.matchForm.value.player1 === this.matchForm.value.player2) {
      alert('I Giocatori devono essere diversi!');
      return;
    }

    this.sendData();
  }

  private sendData() {
    if (this.matchForm.invalid) return;

    const dateInput = new Date(this.matchForm.value.date);
    const today = new Date();

    const formattedDate =
      dateInput.toLocaleDateString("en-GB") +
      ` - ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    const formData = {
      date: formattedDate,
      player1: this.matchForm.value.player1,
      player2: this.matchForm.value.player2,
      p1Score: this.matchForm.value.p1Score,
      p2Score: this.matchForm.value.p2Score,
      setsPoints: this.setsPoints.value
    };

    console.log('Saving match...', formData);

    this.dataService.addMatch(formData).then(() => {
      this.closeModal();
    });
  }

  closeModal() {
    this.modalService.closeModal();
  }

  validateSetsPoints(max: number): ValidatorFn {
    return (control: AbstractControl) => {
      const value = Number(control.value);

      if (isNaN(value)) {
        control.setValue(null, { emitEvent: false });
        return null;
      }

      if (value < 0) {
        control.setValue(0, { emitEvent: false });
        return { belowMin: true };
      }

      if (value > max) {
        control.setValue(max, { emitEvent: false });
        return { aboveMax: true };
      }

      return null;
    };
  }

  getEveryErrorFormFormGroup(): string {
    let errors: string[] = [];
    Object.keys(this.matchForm.controls).forEach(key => {
      const controlErrors = this.matchForm.get(key)?.errors;
      if (controlErrors) {
        Object.keys(controlErrors).forEach(errorKey => {
          errors.push(`Control: ${key}, Error: ${errorKey}`);
        });
      }
    });
    return errors.join(' | ');
  }
  // addManualSetPoint() {
  //   this.manualSetPointsActive = true;
  //   let myModal = document.querySelector(".my-modal") as HTMLElement | null;
  //   myModal?.style.setProperty("position", "relative");
  //   myModal?.style.setProperty("transform", "none");
  //   myModal?.style.setProperty("left", "0");
  // }

  // closeManualSetPoint() {
  //   this.manualSetPointsActive = false;
  //   let myModal = document.querySelector(".my-modal") as HTMLElement | null;
  //   myModal?.style.setProperty("position", "fixed");
  //   myModal?.style.removeProperty("transform");
  //   myModal?.style.removeProperty("position");
  //   myModal?.style.removeProperty("left");
  // }
}
