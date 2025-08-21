import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Slider } from '../../utils/Slider';
import { Utils } from '../../utils/Utils';
import { IMatchResponse } from '../../interfaces/responsesInterfaces';
import { CommonModule } from '@angular/common';
import { ShowMatchModalComponent } from '../show-match-modal/show-match-modal.component';
import { ModalService } from '../../../services/modal.service';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../utils/translate.pipe';

@Component({
  selector: 'app-matches',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss'
})
export class MatchesComponent {
  @Input() matches: any;
  @ViewChild('matchesSlider') matchesSlider!: ElementRef;

  slider: Slider | undefined;
  clickedMatch: any;

  @Output() matchEmitter: EventEmitter<IMatch> = new EventEmitter<IMatch>();
  maxMatchesToShow: number = 25;

  isOverflowing: boolean = true;
  width = 0;
  @HostListener('window:resize')
  onWinResize() {
    this.isOverflowing = this.matchesSlider.nativeElement.scrollWidth > window.innerWidth - 50;

    console.log(this.matchesSlider.nativeElement.scrollWidth, window.innerWidth);
  }

  constructor(public modalService: ModalService) {

  }
  ngOnInit() {
    if(this.matchesSlider)
    this.isOverflowing = this.matchesSlider.nativeElement.scrollWidth > window.innerWidth - 50;
  }
  
  ngAfterViewInit() {
    console.log(environment.production)
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
      this.clickedMatch = matchData;
      this.matchEmitter.emit(matchData);
      this.modalService.openModal(this.modalService.MODALS['SHOW_MATCH']);
    } else {
      console.error('Match not found with id: ' + matchId);
      //show error message
    }
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '/default-player.jpg';
  }
  trackByIndex(index: number, item: any) {
    return index;
  }
  getMatchesToRender() {
    if (!this.matches) return [];
    return this.matches.slice().reverse().slice(0, this.maxMatchesToShow);
  }
}