import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectPlayerComponent } from '../../../utils/components/select-player/select-player.component';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { StepIndicatorComponent } from '../../../common/step-indicator/step-indicator.component';
import { ModalService } from '../../../../services/modal.service';
import { DataService } from '../../../../services/data.service';
import { LoaderService } from '../../../../services/loader.service';
import { TranslationService } from '../../../../services/translation.service';
import { CompetitionService } from '../../../../services/competitions.service';
import { ICompetition } from '../../../../api/competition.api';
import { IPlayer } from '../../../../services/players.service';
import { Group, mapGroupPlayerToIPlayer } from '../../../interfaces/group.interface';
import { MSG_TYPE } from '../../../utils/enum';

@Component({
  selector: 'app-add-group-match-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectPlayerComponent,
    TranslatePipe,
    StepIndicatorComponent,
  ],
  templateUrl: './add-group-match-modal.component.html',
  styleUrl: './add-group-match-modal.component.scss'
})
export class AddGroupMatchModalComponent implements OnInit {
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() openManualPointsEvent = new EventEmitter<void>();

  @Input() player1: IPlayer | null = null;
  @Input() player2: IPlayer | null = null;
  @Input() isAlreadySelected = false;

  competition: ICompetition | null = null;
  matchForm!: FormGroup;
  groupForm!: FormGroup;
  groups: Group[] = [];
  groupPlayers: IPlayer[] = [];
  step = 1;
  readonly totalSteps = 2;

  maxSets = 5;
  maxPoints = 11;
  isShowSetsPointsTrue = false;

  errorsOfSets: string[] = [];
  errorsOfPoints: string[] = [];

  isSending = false;

  constructor(
    private fb: FormBuilder,
    private modalService: ModalService,
    private dataService: DataService,
    private loaderService: LoaderService,
    private translateService: TranslationService,
    private competitionService: CompetitionService,
  ) { }

  ngOnInit(): void {
    this.initializeForms();

    this.competitionService.activeCompetition$.subscribe(comp => {
      this.competition = comp;
      this.maxPoints = this.competition?.points_type || 11;
      this.maxSets = this.competition?.sets_type || 5;
      this.matchForm.get('p1Score')?.setValidators([Validators.required, Validators.min(0), Validators.max(this.maxSets)]);
      this.matchForm.get('p2Score')?.setValidators([Validators.required, Validators.min(0), Validators.max(this.maxSets)]);
      this.matchForm.updateValueAndValidity({ emitEvent: false });
    });

    this.dataService.groupsObs.subscribe(groups => {
      this.groups = groups ?? [];
      this.tryPreselectGroup();
    });
  }

  private initializeForms() {
    this.groupForm = this.fb.group({
      groupId: [null, Validators.required],
    });

    this.matchForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      player1: [this.player1?.id, Validators.required],
      player2: [this.player2?.id, Validators.required],
      p1Score: [null, [Validators.required, Validators.min(0), Validators.max(this.maxSets)]],
      p2Score: [null, [Validators.required, Validators.min(0), Validators.max(this.maxSets)]],
      isShowSetsPointsTrue: [false],
      setsPoints: this.fb.array([]),
      groupId: [null, Validators.required],
    });

    this.groupForm.get('groupId')?.valueChanges.subscribe(value => {
      if (!value) {
        return;
      }

      this.onGroupSelected(value);
    });

    this.matchForm.get('isShowSetsPointsTrue')?.valueChanges.subscribe(() => this.updateContainers());
    this.matchForm.get('p1Score')?.valueChanges.subscribe(() => this.sanitizeInput('p1Score'));
    this.matchForm.get('p2Score')?.valueChanges.subscribe(() => this.sanitizeInput('p2Score'));
  }

  get setsPoints(): FormArray {
    return this.matchForm.get('setsPoints') as FormArray;
  }

  getSetFormGroup(index: number): FormGroup {
    return this.setsPoints.at(index) as FormGroup;
  }

  get selectedGroup(): Group | null {
    const groupId = this.matchForm.get('groupId')?.value;
    return this.groups.find(group => group.id === groupId) ?? null;
  }

  private tryPreselectGroup() {
    if (!this.groups.length) {
      return;
    }

    const selectedId = this.matchForm.get('groupId')?.value ?? this.groupForm.get('groupId')?.value;
    if (selectedId) {
      this.onGroupSelected(selectedId, false);
      return;
    }

    const candidate = this.findGroupForPlayers();
    if (candidate) {
      this.groupForm.patchValue({ groupId: candidate.id }, { emitEvent: true });
      if (this.isAlreadySelected && this.player1 && this.player2) {
        this.step = 2;
      }
      return;
    }

    if (this.groups.length === 1) {
      const [group] = this.groups;
      this.groupForm.patchValue({ groupId: group.id }, { emitEvent: true });
    }
  }

  private findGroupForPlayers(): Group | null {
    if (!this.player1 && !this.player2) {
      return null;
    }

    return this.groups.find(group => {
      const members = new Set(group.players.map(player => Number(player.playerId)));
      const player1Ok = !this.player1 || members.has(Number(this.player1.id));
      const player2Ok = !this.player2 || members.has(Number(this.player2.id));
      return player1Ok && player2Ok;
    }) ?? null;
  }

  onBackToGroupSelection() {
    this.step = 1;
  }

  onContinueToMatch() {
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    this.step = 2;
  }

  private onGroupSelected(groupId: string, resetStep = true) {
    this.matchForm.patchValue({ groupId, player1: null, player2: null }, { emitEvent: false });
    const group = this.groups.find(g => g.id === groupId);
    this.groupPlayers = group ? group.players.map(mapGroupPlayerToIPlayer) : [];

    const groupMemberIds = new Set(this.groupPlayers.map(player => Number(player.id)));

    if (this.player1 && !groupMemberIds.has(Number(this.player1.id))) {
      this.player1 = null;
    }
    if (this.player2 && !groupMemberIds.has(Number(this.player2.id))) {
      this.player2 = null;
    }

    this.matchForm.patchValue({
      player1: this.player1?.id ?? null,
      player2: this.player2?.id ?? null,
    }, { emitEvent: false });

    if (resetStep) {
      this.step = 1;
    }
  }

  getPlayers(playerNumber?: number): IPlayer[] {
    const loggedInPlayerId = this.dataService.getLoggedInPlayerId();
    let filtered = [...this.groupPlayers];

    if (loggedInPlayerId != null) {
      filtered = filtered.filter(player => Number(player.id) !== Number(loggedInPlayerId));
    }

    const selectedPlayer1 = this.matchForm.get('player1')?.value;
    const selectedPlayer2 = this.matchForm.get('player2')?.value;

    if (playerNumber === 1 && selectedPlayer2) {
      filtered = filtered.filter(player => Number(player.id) !== Number(selectedPlayer2));
    }

    if (playerNumber === 2 && selectedPlayer1) {
      filtered = filtered.filter(player => Number(player.id) !== Number(selectedPlayer1));
    }

    return filtered;
  }

  setPlayer(selection: { playerNumber: number; id: number }) {
    this.matchForm.get(`player${selection.playerNumber}`)?.setValue(selection.id);
  }

  updateContainers() {
    this.isShowSetsPointsTrue = this.matchForm.value.isShowSetsPointsTrue;
    const totalPoints = (this.matchForm.value.p1Score || 0) + (this.matchForm.value.p2Score || 0);
    const totalSets = this.isShowSetsPointsTrue ? Math.max(totalPoints, 1) : 0;

    this.setsPoints.clear();
    this.errorsOfPoints.length = 0;
    for (let i = 0; i < totalSets && i < 10; i++) {
      this.setsPoints.push(
        this.fb.group({
          player1Points: [0],
          player2Points: [0],
        })
      );
      this.getSetFormGroup(i).valueChanges.subscribe(() => this.checkPointsError());
    }
  }

  sanitizeInput(controlName: 'p1Score' | 'p2Score') {
    const control = this.matchForm.get(controlName);
    const otherControlName = controlName === 'p1Score' ? 'p2Score' : 'p1Score';
    const otherControl = this.matchForm.get(otherControlName);

    if (!control) {
      return;
    }

    const max = this.competition?.sets_type || this.maxSets;
    let value = Number(control.value);

    this.errorsOfSets.length = 0;

    if (!Number.isNaN(value) && typeof control.value === 'string' && control.value.length > 1) {
      value = Number(control.value.slice(-1));
    }

    if (Number.isNaN(value) || value < 0) {
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
  }

  checkPointsError() {
    this.errorsOfPoints.length = 0;

    const maxPoints = this.competition?.points_type ?? this.maxPoints;

    this.setsPoints.controls.forEach((setGroup: AbstractControl, index: number) => {
      let p1 = Number(setGroup.get('player1Points')?.value);
      let p2 = Number(setGroup.get('player2Points')?.value);

      if (Number.isNaN(p1) || p1 < 0) {
        this.errorsOfPoints.push(`set ${index + 1}: number_positive_p1`);
        p1 = 0;
      }
      if (p1 > maxPoints) {
        this.errorsOfPoints.push(`set ${index + 1}: number_maximum_p1 ${maxPoints}`);
        p1 = maxPoints;
      }

      if (Number.isNaN(p2) || p2 < 0) {
        this.errorsOfPoints.push(`set ${index + 1}: number_positive_p2`);
        p2 = 0;
      }
      if (p2 > maxPoints) {
        this.errorsOfPoints.push(`set ${index + 1}: number_maximum_p2 ${maxPoints}`);
        p2 = maxPoints;
      }

      if (p1 === p2 && p1 > 0) {
        this.errorsOfPoints.push(`set ${index + 1}`);
      }

      setGroup.patchValue({ player1Points: p1, player2Points: p2 }, { emitEvent: false });
    });
  }

  async addMatch(event?: SubmitEvent) {
    event?.preventDefault();

    if (this.step !== 2) {
      this.onContinueToMatch();
      return;
    }

    if (this.matchForm.invalid) {
      this.matchForm.markAllAsTouched();
      return;
    }

    if (this.matchForm.value.player1 === this.matchForm.value.player2) {
      alert('I Giocatori devono essere diversi!');
      return;
    }

    const button = (event?.submitter as HTMLButtonElement) ?? undefined;
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
    if (this.matchForm.invalid) {
      return;
    }

    this.isSending = true;
    const dateInput = new Date(this.matchForm.value.date);
    const today = new Date();

    const formattedDate =
      dateInput.toLocaleDateString('en-GB') +
      ` - ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    const payload = {
      date: formattedDate,
      player1: this.matchForm.value.player1,
      player2: this.matchForm.value.player2,
      p1Score: this.matchForm.value.p1Score,
      p2Score: this.matchForm.value.p2Score,
      setsPoints: this.matchForm.value.setsPoints,
      groupId: this.matchForm.value.groupId,
    };

    if (this.isShowSetsPointsTrue && (!payload.setsPoints || payload.setsPoints.length === 0)) {
      this.loaderService.showToast(this.translateService.translate('sets_points_required'), MSG_TYPE.WARNING);
      this.isSending = false;
      return;
    }

    await this.dataService.addMatch(payload);
    this.isSending = false;
    this.closeModal();
  }

  closeModal() {
    this.modalService.closeModal();
    this.closeModalEvent.emit();
  }

  openManualPoints() {
    this.openManualPointsEvent.emit();
    this.modalService.openModal(this.modalService.MODALS['MANUAL_POINTS']);
  }
}
