import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-add-match-modal',
  standalone: true,
  templateUrl: './add-match-modal.component.html',
  styleUrls: ['./add-match-modal.component.scss'],
  imports: [CommonModule, ReactiveFormsModule] // ✅ Import ReactiveFormsModule
})
export class AddMatchModalComponent implements OnInit {
  @Output() closeModalEvent = new EventEmitter<void>();

  matchForm!: FormGroup;
  players: string[] = ['Player 1', 'Player 2', 'Player 3'];
  isShowSetsPointsTrue = false;

  constructor(private fb: FormBuilder, private modalService: ModalService) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.matchForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      player1: ['', Validators.required],
      player2: ['', Validators.required],
      p1Score: [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      p2Score: [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      isShowSetsPointsTrue: [],
      setsPoints: this.fb.array([this.fb.control('')]),
    });
  }

  // ✅ Fix: Explicitly cast `setsPoints` to `FormArray`
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

    console.log('Match added:', this.matchForm.value);
    this.closeModal();
  }

  closeModal() {
    this.modalService.closeModal();
  }
}
