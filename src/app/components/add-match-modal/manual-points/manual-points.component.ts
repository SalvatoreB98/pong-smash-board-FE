import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';

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
  ngOnInit() {
    this.checkViewport();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkViewport();
  }

  private checkViewport() {
    this.isMobile = window.innerWidth <= 768; // breakpoint mobile
  }
}
