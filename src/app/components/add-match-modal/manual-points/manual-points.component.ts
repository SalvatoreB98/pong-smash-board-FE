import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { IPlayer } from '../../../../services/players.service';
import { CompetitionService } from '../../../../services/competitions.service';
import { ICompetition } from '../../../../api/competition.api';

@Component({
  selector: 'app-manual-points',
  imports: [SHARED_IMPORTS],
  templateUrl: './manual-points.component.html',
  styleUrl: './manual-points.component.scss'
})
export class ManualPointsComponent {
  @Output() close = new EventEmitter<any>();
  isMobile = false;
  @ViewChild('effectLeft') effectLeft!: ElementRef;
  @ViewChild('effectRight') effectRight!: ElementRef;
  @Input() maxSets = 5;
  @Input() maxPoints = 21;
  @Input() player1: IPlayer | null = null;
  competitionService = inject(CompetitionService);
  competition: ICompetition | null = null;

  ngOnChanges() {
    console.info('player1 value:', this.player1);
    console.info('player2 value:', this.player2);
  }

  @Input() player2: IPlayer | null = null;
  player1Points = 0;
  player2Points = 0;

  ngOnInit() {
    this.checkViewport();
    this.competitionService.activeCompetition$.subscribe(comp => {
      this.competition = comp;
      this.maxPoints = this.competition?.['points_type'] || 21;
      this.maxSets = this.competition?.['sets_type'] || 10;
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
}
