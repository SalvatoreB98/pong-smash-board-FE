import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { IPlayer } from '../../../../services/players.service';
import { CompetitionService } from '../../../../services/competitions.service';
import { ICompetition } from '../../../../api/competition.api';
import { DataService } from '../../../../services/data.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectPlayerComponent } from '../../../utils/components/select-player/select-player.component';

@Component({
  selector: 'app-manual-points',
  imports: [SHARED_IMPORTS, SelectPlayerComponent],
  templateUrl: './manual-points.component.html',
  styleUrl: './manual-points.component.scss'
})
export class ManualPointsComponent {

  @Output() close = new EventEmitter<any>();
  @ViewChild('effectLeft') effectLeft!: ElementRef;
  @ViewChild('effectRight') effectRight!: ElementRef;
  @Input() maxSets = 5;
  @Input() maxPoints = 21;
  @Input() player2: IPlayer | null = null;
  @Input() player1: IPlayer | null = null;
  @Input() players: any[] = [];

  playersForm!: FormGroup;

  player1Points = 0;
  player2Points = 0;

  player1SetsPoints = 0;
  player2SetsPoints = 0;

  competitionService = inject(CompetitionService);
  competition: ICompetition | null = null;
  isMobile = false;
  selectingPlayer: boolean = true;

  constructor(private dataService: DataService, private fb: FormBuilder) { }

  ngOnChanges() {
    console.info('player1 value:', this.player1);
    console.info('player2 value:', this.player2);
  }


  ngOnInit() {
    this.checkViewport();
    this.competitionService.activeCompetition$.subscribe(comp => {
      this.competition = comp;
      this.maxPoints = this.competition?.['points_type'] || 21;
      this.maxSets = this.competition?.['sets_type'] || 10;
    });
    this.playersForm = this.fb.group({
      player1: [null, Validators.required],
      player2: [null, Validators.required]
    });
    this.playersForm.valueChanges.subscribe((val) => {
      this.player1 = this.players.find(p => p.id === val.player1) || null;
      this.player2 = this.players.find(p => p.id === val.player2) || null;
      console.log(val, this.player1, this.player2);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.checkViewport();
  }

  private checkViewport() {
    this.isMobile = window.innerWidth <= 768 || window.innerWidth < window.innerHeight; // breakpoint mobile
  }

  changePoint(player: number) {
    console.log('Change point for player', player, this.player1Points, this.player2Points, this.player1, this.player2);
    if (player === 1 && this.player1Points < this.maxPoints) {
      this.player1Points++;
      this.effectLeft.nativeElement.classList.add('highlight-once');
      setTimeout(() => {
        this.effectLeft.nativeElement.classList.remove('highlight-once');
      }, 1000);
    } else if (player === 2 && this.player2Points < this.maxPoints) {
      this.player2Points++;
      this.effectRight.nativeElement.classList.add('highlight-once');
      setTimeout(() => {
        this.effectRight.nativeElement.classList.remove('highlight-once');
      }, 1000);
    }
    if (this.player1Points === this.maxPoints && this.player2Points === this.maxPoints) {
      this.maxPoints += 2;
    }
  }

  subtractPoint(player: number) {
    if (player === 1 && this.player1Points > 0) {
      this.player1Points--;
    } else if (player === 2 && this.player2Points > 0) {
      this.player2Points--;
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
    // Implement save functionality checking sets and points
    if (this.player1SetsPoints > this.player2SetsPoints) {
      this.player1SetsPoints++;
    } else if (this.player2SetsPoints > this.player1SetsPoints) {
      this.player2SetsPoints++;
    }
  }

  onReset() {
    this.player1Points = 0;
    this.player2Points = 0;
    this.player1SetsPoints = 0;
    this.player2SetsPoints = 0;
    this.effectRight.nativeElement.classList.add('highlight-once');
    setTimeout(() => {
      this.effectRight.nativeElement.classList.remove('highlight-once');
    }, 1000);
    this.effectLeft.nativeElement.classList.add('highlight-once');
    setTimeout(() => {
      this.effectLeft.nativeElement.classList.remove('highlight-once');
    }, 1000);
  }
}
