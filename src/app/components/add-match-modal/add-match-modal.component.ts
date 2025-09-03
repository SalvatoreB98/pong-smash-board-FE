import { Component, EventEmitter, Output, OnInit, ViewChild, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../services/modal.service';
import { DataService } from '../../../services/data.service';
import { SelectPlayerComponent } from '../../utils/components/select-player/select-player.component';
import { TranslatePipe } from '../../utils/translate.pipe';

@Component({
  selector: 'app-add-match-modal',
  standalone: true,
  templateUrl: './add-match-modal.component.html',
  styleUrls: ['./add-match-modal.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, SelectPlayerComponent, TranslatePipe]
})
export class AddMatchModalComponent implements OnInit {
  @Output() closeModalEvent = new EventEmitter<void>();

  @Input() players: any[] = [];

  matchForm!: FormGroup;
  isShowSetsPointsTrue = false;

  constructor(
    private fb: FormBuilder,
    private modalService: ModalService,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.initializeForm();
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
      p1Score: [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      p2Score: [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      isShowSetsPointsTrue: [false],
      setsPoints: this.fb.array([]),
    });
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
          player1Points: [null, [Validators.min(0), Validators.max(21)]],
          player2Points: [null, [Validators.min(0), Validators.max(21)]]
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
}
