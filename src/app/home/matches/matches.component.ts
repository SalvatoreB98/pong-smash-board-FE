import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Slider } from '../../utils/Slider';
import { Utils } from '../../utils/Utils';
import { IMatchResponse } from '../../interfaces/responsesInterfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-matches',
  imports: [CommonModule],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss'
})
export class MatchesComponent implements OnInit {
  @Input() matches: any;
  @ViewChild('matchesSlider') matchesSlider!: ElementRef;
  slider: Slider | undefined;
  ngOnInit(): void {
  }
  constructor() {
  }

  ngAfterViewInit() {
    if (this.matchesSlider) {
      this.slider = new Slider('slider', this.matchesSlider.nativeElement);
    }
  }
  private sliderInitialized = false;

  ngAfterViewChecked() {
    if (!this.sliderInitialized && this.matchesSlider?.nativeElement.querySelectorAll('.match').length) {
      this.slider = new Slider('slider', this.matchesSlider.nativeElement);
      this.sliderInitialized = true;
    }
  }
  onMatchClick(matchId: string): void {
    if (!Utils.isMobile() && this.slider?.justDragged) {
      return;
    }
    const matchData = this.matches.find((m: { id: string; }) => m.id === matchId);
    if (matchData) {
      //show match details
    } else {
      console.error('Match not found with id: ' + matchId);
      //show error message
    }
  }
  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/default-player.png';
  }
}