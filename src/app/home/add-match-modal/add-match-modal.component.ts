import { Component, EventEmitter, Output, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
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

  matchForm!: FormGroup;
  players: any[] = [];
  isShowSetsPointsTrue = false;

  /** Filtered players list */

  /** Subject to manage unsubscriptions */
  constructor(private fb: FormBuilder, private modalService: ModalService, private dataService: DataService) { }

  ngOnInit() {
    this.initializeForm();
    this.players = this.dataService.players || [];
  }

  ngOnDestroy() {
  }
  getPlayers(player?: number): any[] {
    if (!this.players || this.players.length === 0) return [];

    const loggedInPlayerId = this.dataService.getLoggedInPlayerId(); // Assuming this method exists

    let filteredPlayers = this.players.filter(p => p.playerid !== loggedInPlayerId);

    if (player === 2) {
      const selectedPlayer1 = this.matchForm.get('player1')?.value;
      filteredPlayers = filteredPlayers.filter(p => p.playerid !== selectedPlayer1);
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
      isShowSetsPointsTrue: [],
      setsPoints: this.fb.array([]),
    });
  }

  /** Gets setsPoints as a FormArray */
  get setsPoints(): FormArray {
    return this.matchForm.get('setsPoints') as FormArray;
  }
  setPlayer(player: any) {
    this.matchForm.get(`player${player.playerNumber}`)?.setValue(player.playerid); // Set value in formControl
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

  addMatch() {
    if (this.matchForm.invalid) return;

    if (this.matchForm.value.player1 === this.matchForm.value.player2) {
      alert('I Giocatori devono essere diversi!');
      return;
    }

    this.sendData();
    this.closeModal();
  }

  private sendData() {
    if (this.matchForm.invalid) return;

    const dateInput = new Date(this.matchForm.value.date);
    let currentHour = '';
    let currentMinutes = '';

    const today = new Date();
    currentHour = String(today?.getHours()).padStart(2, '0');
    currentMinutes = String(today?.getMinutes()).padStart(2, '0');

    const formattedDate = dateInput.toLocaleDateString("en-GB");

    const formData = {
      date: formattedDate + (currentHour ? ` - ${currentHour}:${currentMinutes}` : ''),
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