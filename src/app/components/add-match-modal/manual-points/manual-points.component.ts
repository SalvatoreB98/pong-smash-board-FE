import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { IPlayer } from '../../../../services/players.service';
import { CompetitionService } from '../../../../services/competitions.service';
import { ICompetition } from '../../../../api/competition.api';
import { DataService } from '../../../../services/data.service';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { SelectPlayerComponent } from '../../../utils/components/select-player/select-player.component';
import { VoiceScoreComponent } from './voice-score/voice-score.component';
import { ModalService } from '../../../../services/modal.service';
import { LoaderService } from '../../../../services/loader.service';
import { Utils } from '../../../utils/Utils';

@Component({
  selector: 'app-manual-points',
  imports: [SHARED_IMPORTS, SelectPlayerComponent, VoiceScoreComponent],
  templateUrl: './manual-points.component.html',
  styleUrl: './manual-points.component.scss'
})
export class ManualPointsComponent {

  @Output() close = new EventEmitter<any>();
  @ViewChild('effectLeft') effectLeft!: ElementRef;
  @ViewChild('effectRight') effectRight!: ElementRef;
  @Input() isAlreadySelected: boolean = false;

  @Input() maxSets = 5;
  @Input() maxPoints = 21;
  initialMaxPoints = 21;
  @Input() player2: IPlayer | null = null;
  @Input() player1: IPlayer | null = null;
  @Input() players: IPlayer[] = [];

  playersForm!: FormGroup;

  player1Points = 0;
  player2Points = 0;

  player1SetsPoints = 0;
  player2SetsPoints = 0;
  sets: Array<{ player1: number; player2: number }> = [];
  competitionService = inject(CompetitionService);
  competition: ICompetition | null = null;
  isMobile = false;
  selectingPlayer: boolean = true;

  constructor(private dataService: DataService, private fb: FormBuilder, private modalService: ModalService, private loaderService: LoaderService) { }

  ngOnChanges() {
    console.info('player1 value:', this.player1);
    console.info('player2 value:', this.player2);
    if (this.playersForm) {
      this.playersForm.patchValue({
        player1: this.player1 || null,
        player2: this.player2 || null
      });
    }
  }


  ngOnInit() {
    this.checkViewport();
    this.competitionService.activeCompetition$.subscribe(comp => {
      this.competition = comp;
      this.maxPoints = this.competition?.['points_type'] || 21;
      this.initialMaxPoints = this.maxPoints;
      this.maxSets = this.competition?.['sets_type'] || 10;
    });
    this.playersForm = this.fb.group({
      player1: [this.player1?.id, Validators.required],
      player2: [this.player2?.id, Validators.required]
    });
    this.playersForm.valueChanges.subscribe((val) => {
      this.player1 = this.players.find(p => p.id === val.player1) || null;
      this.player2 = this.players.find(p => p.id === val.player2) || null;
      console.log(val, this.player1, this.player2);
    });
    
    if (this.isAlreadySelected && this.player1 && this.player2) {
      this.selectingPlayer = false;
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkViewport();
  }

  private checkViewport() {
    this.isMobile = window.innerWidth <= 768 || window.innerWidth < window.innerHeight; // breakpoint mobile
  }

  onScoreChanged(event: { p1: number; p2: number }) {
    // Clamp points to maxPoints
    event.p1 = Math.min(event.p1, this.maxPoints + 1); // +1 per permettere il vantaggio
    event.p2 = Math.min(event.p2, this.maxPoints + 1); // +1 per permettere il vantaggio
    if (this.effectLeft && this.effectLeft.nativeElement) {
      if (this.player1Points != event.p1) {
        this.triggerHighlight(this.effectLeft);
      }
      if (this.player2Points != event.p2) {
        this.triggerHighlight(this.effectRight);
      }
    }
    this.player1Points = event.p1;
    this.player2Points = event.p2;
  }

  changePoint(player: number) {
    console.log('Change point for player', player, this.player1Points, this.player2Points, this.player1, this.player2);

    // Allow increment if under maxPoints, or if both at least maxPoints and difference < 2 (advantage rule)
    if (
      (player === 1 &&
        (this.player1Points < this.maxPoints ||
          (this.player1Points >= this.maxPoints - 1 &&
            this.player2Points >= this.maxPoints - 1 &&
            Math.abs(this.player1Points - this.player2Points) < 2))) ||
      (player === 2 &&
        (this.player2Points < this.maxPoints ||
          (this.player1Points >= this.maxPoints - 1 &&
            this.player2Points >= this.maxPoints - 1 &&
            Math.abs(this.player1Points - this.player2Points) < 2)))
    ) {
      if (player === 1) {
        this.player1Points++;
        this.triggerHighlight(this.effectLeft);
      } else if (player === 2) {
        this.player2Points++;
        this.triggerHighlight(this.effectRight);
      }
      // If both players reach maxPoints, increase maxPoints by 2 for advantage
      if (this.player1Points >= this.maxPoints && this.player2Points >= this.maxPoints && Math.abs(this.player1Points - this.player2Points) < 2) {
        this.maxPoints += 2;
      }
    }
  }

  subtractPoint(player: number) {
    if (player === 1 && this.player1Points > 0) {
      this.recalculateMaxPoints();
      this.player1Points--;
    } else if (player === 2 && this.player2Points > 0) {
      this.player2Points--;
      this.recalculateMaxPoints();
    }
    console.log(this.maxPoints)
  }

  private recalculateMaxPoints() {
    // Decrease maxPoints only if both players have at least initialMaxPoints - 1 and the difference is less than 2
    if (
      this.player1Points >= this.initialMaxPoints - 1 &&
      this.player2Points >= this.initialMaxPoints - 1 &&
      Math.abs(this.player1Points - this.player2Points) < 2 &&
      this.maxPoints > this.initialMaxPoints
    ) {
      this.maxPoints -= 2;
    }
  }

  getPlayers(player?: number): any[] {
    if (!this.players || this.players.length === 0) return [];

    const loggedInPlayerId = this.dataService.getLoggedInPlayerId();
    let filteredPlayers = this.players.filter(p => p.id !== loggedInPlayerId);

    const selectedPlayer1 = this.playersForm.get('player1')?.value;
    const selectedPlayer2 = this.playersForm.get('player2')?.value;

    if (player === 1 && selectedPlayer2) {
      filteredPlayers = filteredPlayers.filter(p => p.id !== selectedPlayer2);
    }

    if (player === 2 && selectedPlayer1) {
      filteredPlayers = filteredPlayers.filter(p => p.id !== selectedPlayer1);
    }

    return filteredPlayers;
  }

  setPlayer(player: any) {
    this.playersForm.get(`player${player.playerNumber}`)?.setValue(player.id);
  }

  onContinue() {
    if (this.playersForm.valid) {
      this.player1 = this.players.find(p => p.id === this.playersForm.get('player1')?.value) || null;
      this.player2 = this.players.find(p => p.id === this.playersForm.get('player2')?.value) || null;
      this.selectingPlayer = false;
    }
  }

  onSave() {
    if (this.player1Points > this.player2Points) {
      this.player1SetsPoints++;
      this.sets.push({ player1: this.player1Points, player2: this.player2Points });
      this.onReset();
    } else if (this.player2Points > this.player1Points) {
      this.player2SetsPoints++;
      this.sets.push({ player1: this.player1Points, player2: this.player2Points });
      this.onReset();
    }
  }

  onReset() {
    this.player1Points = 0;
    this.player2Points = 0;

    this.maxPoints = this.initialMaxPoints;
    // Trigger the highlight animation on reset for both players
    if (this.effectRight && this.effectRight.nativeElement) {
      this.triggerHighlight(this.effectRight);
    }
    if (this.effectLeft && this.effectLeft.nativeElement) {
      this.triggerHighlight(this.effectLeft);
    }
  }

  // Restituisce true se la situazione dei punti NON è valida secondo le regole del vantaggio
  isPointsError(p1: number, p2: number, maxPoints: number): boolean {
    // Caso iniziale
    if (p1 === 0 && p2 === 0) return true;

    const diff = Math.abs(p1 - p2);
    const max = Math.max(p1, p2);
    const min = Math.min(p1, p2);
    // Entrambi sotto al maxPoints → nessun vincitore
    if (p1 < maxPoints && p2 < maxPoints) return true;

    // Qualcuno ha raggiunto almeno maxPoints
    if (max >= maxPoints) {
      // Per essere valido: differenza >= 2 e l'altro almeno a maxPoints - 1
      if (diff >= 2) {
        console.log('isPointsError: diff < 2 or min < maxPoints - 1');
        if (p1 >= this.initialMaxPoints - 1 && p2 > this.initialMaxPoints - 1 && diff > 2) {
          return true; // punteggio non valido
        }
        return false; // punteggio valido

      }
      console.log('isPointsError: diff < 2 or min < maxPoints - 1');
      return true; // ancora non valido
    }
    console.log('Unexpected case in isPointsError');
    return true;
  }
  // Trigger highlight animation without flashes
  private triggerHighlight(el: ElementRef) {
    if (!el || !el.nativeElement) return;

    const element = el.nativeElement;

    // reset animation
    element.style.animation = 'none';
    element.offsetHeight; // force reflow
    element.style.animation = ''; // restore

    // reapply the class (keeps CSS control)
    element.classList.add(Utils.isIos() ? 'highlight-once-mobile' : 'highlight-once');

    // quando finisce l’animazione la rimuovo
    element.addEventListener('animationend', () => {
      element.classList.remove(Utils.isIos() ? 'highlight-once-mobile' : 'highlight-once');
    }, { once: true });
  }
  isCompleted(): boolean {
    return this.player1SetsPoints >= this.maxSets || this.player2SetsPoints >= this.maxSets;
  }
  saveMatch(target: EventTarget | null) {

    // 1. Verifica che la partita sia completata
    if (!this.isCompleted()) {
      alert('La partita non è ancora conclusa!');
      return;
    }

    // 2. Verifica che i giocatori siano selezionati
    if (!this.player1 || !this.player2) {
      alert('Seleziona entrambi i giocatori!');
      return;
    }
    if (target instanceof HTMLElement) {
      this.loaderService.addSpinnerToButton(target);
    }
    // 3. Prepara data e ora
    const today = new Date();
    const formattedDate =
      today.toLocaleDateString('en-GB') +
      ` - ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    const setsData = this.sets.map((s) => ({
      player1Points: s.player1 ?? s.player1 ?? 0,
      player2Points: s.player2 ?? s.player2 ?? 0
    }));

    // 4. Prepara l’oggetto da salvare
    const formData = {
      date: formattedDate,
      player1: this.player1.id,
      player2: this.player2.id,
      p1Score: this.player1SetsPoints,  // set vinti da player1
      p2Score: this.player2SetsPoints,  // set vinti da player2
      setsPoints: setsData
    };

    console.log('Saving manual match...', formData);

    // 5. Chiamata al service
    this.dataService.addMatch(formData).then(() => {
      this.modalService.closeModal();
      if (target instanceof HTMLElement) {
        this.loaderService.removeSpinnerFromButton(target);
      }
    }).catch(err => {
      console.error('Errore durante il salvataggio match', err);
    });
  }
}
