import { Component, EventEmitter, Output, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../services/modal.service';
import { DataService } from '../../../services/data.service';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-match-modal',
  standalone: true,
  templateUrl: './add-match-modal.component.html',
  styleUrls: ['./add-match-modal.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatSelectModule] // ✅ Added MatSelectModule
})
export class AddMatchModalComponent implements OnInit {
  @Output() closeModalEvent = new EventEmitter<void>();

  @ViewChild('player1Select', { static: true }) player1Select!: MatSelect;
  @ViewChild('player2Select', { static: true }) player2Select!: MatSelect;

  matchForm!: FormGroup;
  players: any[] = [];
  isShowSetsPointsTrue = false;

  /** Player search controls */
  public player1FilterCtrl = new FormControl<string | null>('');
  public player2FilterCtrl = new FormControl<string | null>('');

  /** Filtered players list */
  public filteredPlayers1: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  public filteredPlayers2: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  /** Subject to manage unsubscriptions */
  protected _onDestroy = new Subject<void>();

  constructor(private fb: FormBuilder, private modalService: ModalService, private dataService: DataService) { }

  ngOnInit() {
    this.initializeForm();

    // ✅ Load players from service
    this.players = this.dataService.players || [];
    this.filteredPlayers1.next(this.players.slice()); // Load initial player1 list
    this.filteredPlayers2.next(this.players.slice()); // Load initial player2 list

    // ✅ Subscribe to search filters
    this.player1FilterCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.filterPlayers(1);
    });

    this.player2FilterCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.filterPlayers(2);
    });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  initializeForm() {
    this.matchForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      player1: ['', Validators.required],
      player2: ['', Validators.required],
      p1Score: [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      p2Score: [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      isShowSetsPointsTrue: [],
      setsPoints: this.fb.array([]), // ✅ Initially empty, managed dynamically
    });
  }

  /** Gets setsPoints as a FormArray */
  get setsPoints(): FormArray {
    return this.matchForm.get('setsPoints') as FormArray;
  }

  updateContainers() {
    this.isShowSetsPointsTrue = this.matchForm.value.isShowSetsPointsTrue;
    const totalPoints = (this.matchForm.value.p1Score || 0) + (this.matchForm.value.p2Score || 0);
    const totalSets = this.isShowSetsPointsTrue ? Math.max(totalPoints, 1) : 0;

    this.setsPoints.clear();
    for (let i = 0; i < totalSets; i++) {
      this.setsPoints.push(
        this.fb.group({
          player1: [null, [Validators.min(0), Validators.max(21)]],
          player2: [null, [Validators.min(0), Validators.max(21)]]
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
    if (
      dateInput.getFullYear() === today.getFullYear() &&
      dateInput.getMonth() === today.getMonth() &&
      dateInput.getDate() === today.getDate()
    ) {
      currentHour = String(today.getHours()).padStart(2, '0');
      currentMinutes = String(today.getMinutes()).padStart(2, '0');
    }

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

  /** Filters players based on search keyword */
  protected filterPlayers(playerNumber: number) {
    if (!this.players) return;

    let searchValue = playerNumber === 1 ? this.player1FilterCtrl.value : this.player2FilterCtrl.value;

    if (!searchValue) {
      playerNumber === 1 ? this.filteredPlayers1.next(this.players.slice()) : this.filteredPlayers2.next(this.players.slice());
      return;
    }

    searchValue = searchValue.toLowerCase();
    const filtered = this.players.filter(player => player.name.toLowerCase().includes(searchValue));

    if (playerNumber === 1) {
      this.filteredPlayers1.next(filtered);
    } else {
      this.filteredPlayers2.next(filtered);
    }
  }

  closeModal() {
    this.modalService.closeModal();
  }
}