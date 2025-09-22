import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import {
  FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  ValidatorFn, AbstractControl, ValidationErrors
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../services/modal.service';
import { DataService } from '../../../services/data.service';
import { SelectPlayerComponent } from '../../utils/components/select-player/select-player.component';
import { TranslatePipe } from '../../utils/translate.pipe';
import { MSG_TYPE } from '../../utils/enum';
import { LoaderService } from '../../../services/loader.service';
import { TranslationService } from '../../../services/translation.service';
import { CompetitionService } from '../../../services/competitions.service';
import { ICompetition } from '../../../api/competition.api';
import { IPlayer } from '../../../services/players.service';

@Component({
  selector: 'add-match-modal',
  standalone: true,
  templateUrl: './add-match-modal.component.html',
  styleUrls: ['./add-match-modal.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, SelectPlayerComponent, TranslatePipe]
})
export class AddMatchModalComponent implements OnInit {

  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() openManualPointsEvent = new EventEmitter<void>();

  @Input() players: IPlayer[] = [];
  @Input() player1: IPlayer | null = null;
  @Input() player2: IPlayer | null = null;
  @Input() isAlreadySelected: boolean = false;

  errorsOfSets: string[] = [];
  errorsOfPoints: string[] = [];

  competition: ICompetition | null = null;
  maxSets: number = 5;
  maxPoints: number = 11;

  isSending = false;
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

  ngOnInit() {
    this.initializeForm();

    if (this.players.length < 2) {
      this.loaderService.showToast(this.translateService.translate('not_enough_players'), MSG_TYPE.WARNING);
      this.closeModal();
    }

    this.competitionService.activeCompetition$.subscribe(comp => {
      this.competition = comp;
      console.log('Active competition:', this.competition);
      this.maxPoints = this.competition?.points_type || 11;
      this.maxSets = this.competition?.sets_type || 5;
    });
  }

  // ------- FORM -------
  initializeForm() {
    this.matchForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      player1: [this.player1?.id, Validators.required],
      player2: [this.player2?.id, Validators.required],
      p1Score: [null, [Validators.required, Validators.min(1), Validators.max(this.maxSets)]],
      p2Score: [null, [Validators.required, Validators.min(1), Validators.max(this.maxSets)]],
      isShowSetsPointsTrue: [false],
      setsPoints: this.fb.array([]),
    });
    this.matchForm.get('p1Score')?.valueChanges.subscribe(() => this.sanitizeInput('p1Score'));
    this.matchForm.get('p2Score')?.valueChanges.subscribe(() => this.sanitizeInput('p2Score'));
    console.log('Initial form value:', this.matchForm.value);
    console.log('Initial player 1:', this.player1);
    console.log('Initial player 2:', this.player2);
  }

  get setsPoints(): FormArray {
    return this.matchForm.get('setsPoints') as FormArray;
  }

  getSetFormGroup(index: number): FormGroup {
    return this.setsPoints.at(index) as FormGroup;
  }

  updateContainers(event: any) {
    this.isShowSetsPointsTrue = this.matchForm.value.isShowSetsPointsTrue;
    const totalPoints = (this.matchForm.value.p1Score || 0) + (this.matchForm.value.p2Score || 0);
    const totalSets = this.isShowSetsPointsTrue ? Math.max(totalPoints, 1) : 0;

    this.setsPoints.clear();
    for (let i = 0; i < totalSets && i < 10; i++) {
      this.setsPoints.push(
        this.fb.group(
          {
            player1Points: [0],
            player2Points: [0],
          }
        )
      );
      this.getSetFormGroup(i).valueChanges.subscribe(() => this.checkPointsError());
    }
  }

  // ------- PLAYER UTILS -------
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

  setPlayer(player: any) {
    this.matchForm.get(`player${player.playerNumber}`)?.setValue(player.id);
  }

  // ------- MATCH -------
  async addMatch(event?: SubmitEvent) {
    event?.preventDefault();
    if (this.matchForm.invalid) return;
    if (this.matchForm.value.player1 === this.matchForm.value.player2) {
      alert('I Giocatori devono essere diversi!');
      return;
    }

    const button = this.resolveButton(event);
    if (button) {
      button.disabled = true;
      this.loaderService.addSpinnerToButton(button);
    }

    try {
      await this.sendData();
    } catch (error) {
      console.error('Error adding match:', error);
    } finally {
      if (button) {
        button.disabled = false;
        this.loaderService.removeSpinnerFromButton(button);
      }
    }
  }

  private async sendData(): Promise<void> {
    if (this.matchForm.invalid) return;
    this.isSending = true;
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

    try {
      await this.dataService.addMatch(formData);
      this.closeModal();
    } finally {
      this.isSending = false;
    }
  }

  closeModal() {
    this.modalService.closeModal();
  }



  sanitizeInput(controlName: string) {
    if (!controlName) return;
    const control = this.matchForm.get(controlName);
    const otherControlName = controlName === 'p1Score' ? 'p2Score' : 'p1Score';
    const otherControl = this.matchForm.get(otherControlName);
    if (!control) return;
    const max = this.competition?.sets_type || this.maxSets;
    let value = Number(control.value);

    this.errorsOfSets.length = 0; // Reset errors

    // Se l'input è una stringa con più cifre, prendi solo l'ultima
    if (!isNaN(value) && typeof control.value === 'string' && control.value.length > 1) {
      value = Number(control.value.slice(-1));
    }

    if (isNaN(value) || value < 0) {
      value = 0;
      this.errorsOfSets.push('number_positive');
    }
    if (value > max) {
      value = max;
      this.errorsOfSets.push(`number_maximum ${max}`);
    }
    if (otherControl && value === Number(otherControl.value)) {
      value = Math.max(1, Math.min(value, max - 1));
      this.errorsOfSets.push('number_equal');
    }
    if (control.value !== value) {
      control.setValue(value, { emitEvent: true });
    }
    console.log("errors:", this.errorsOfSets);
  }

  checkPointsError() {
    this.errorsOfPoints.length = 0;

    const maxPoints = this.competition?.points_type ?? this.maxPoints;

    this.setsPoints.controls.forEach((setGroup: AbstractControl, i: number) => {
      let p1 = Number(setGroup.get('player1Points')?.value);
      let p2 = Number(setGroup.get('player2Points')?.value);

      // Player 1
      if (isNaN(p1) || p1 < 0) {
        this.errorsOfPoints.push(`set ${i + 1}: number_positive_p1`);
        p1 = 0;
      }
      if (p1 > maxPoints) {
        this.errorsOfPoints.push(`set ${i + 1}: number_maximum_p1 ${maxPoints}`);
        p1 = maxPoints;
      }

      // Player 2
      if (isNaN(p2) || p2 < 0) {
        this.errorsOfPoints.push(`set ${i + 1}: number_positive_p2`);
        p2 = 0;
      }
      if (p2 > maxPoints) {
        this.errorsOfPoints.push(`set ${i + 1}: number_maximum_p2 ${maxPoints}`);
        p2 = maxPoints;
      }

      // Equal check (escludi 0-0)
      if (p1 === p2 && p1 > 0) {
        this.errorsOfPoints.push(`set ${i + 1}`);
      }

      setGroup.patchValue({ player1Points: p1, player2Points: p2 }, { emitEvent: false });
    });

    console.log("errors of points:", this.errorsOfPoints);
  }

  private resolveButton(event?: Event): HTMLButtonElement | null {
    if (!event) return null;
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | undefined;
    if (submitter) return submitter;

    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLButtonElement) return target;
    return target?.closest('button') as HTMLButtonElement | null;
  }
}

