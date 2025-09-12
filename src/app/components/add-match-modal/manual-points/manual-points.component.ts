import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { IPlayer } from '../../../../services/players.service';

@Component({
  selector: 'app-manual-points',
  imports: [SHARED_IMPORTS],
  templateUrl: './manual-points.component.html',
  styleUrl: './manual-points.component.scss'
})
export class ManualPointsComponent {
  @Output() close = new EventEmitter<any>();
  isMobile = false;
  @Input() maxSets = 5;
  @Input() maxPoints = 11;
  @Input() player1: IPlayer | null = null;

  ngOnChanges() {
    console.info('player1 value:', this.player1);
    console.info('player2 value:', this.player2);
  }
  
  @Input() player2: IPlayer | null = null;
  player1Points = 0;
  player2Points = 0;

  ngOnInit() {
    this.checkViewport();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkViewport();
  }

  private checkViewport() {
    this.isMobile = window.innerWidth <= 768 || window.innerWidth < window.innerHeight; // breakpoint mobile
  }
  changePoint(player: number) {
    if (player === 1) {
      this.player1Points++;
    } else {
      this.player2Points++;
    }
  }
}
