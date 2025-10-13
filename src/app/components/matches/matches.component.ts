import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Utils } from '../../utils/Utils';
import { IMatchResponse } from '../../interfaces/responsesInterfaces';
import { CommonModule } from '@angular/common';
import { ShowMatchModalComponent } from '../show-match-modal/show-match-modal.component';
import { ModalService } from '../../../services/modal.service';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../utils/translate.pipe';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';

@Component({
  selector: 'app-matches',
  imports: [...SHARED_IMPORTS],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss'
})
export class MatchesComponent {
  @Input() matches: any;
  @ViewChild('matchesSlider') matchesSlider!: ElementRef;

  clickedMatch: any;

  @Output() matchEmitter: EventEmitter<IMatch> = new EventEmitter<IMatch>();
  maxMatchesToShow: number = 25;
  canScrollLeft: boolean = false;
  canScrollRight: boolean = false;
  isOverflowing: boolean = true;
  width = 0;
  showNavButtons = false;
  private sliderInitialized = false;

  @HostListener('window:resize')
  onWinResize() {
    this.isOverflowing = this.matchesSlider.nativeElement.scrollWidth > window.innerWidth - 50;

    console.log(this.matchesSlider.nativeElement.scrollWidth, window.innerWidth);
  }

  constructor(public modalService: ModalService) {

  }
  ngOnInit() {
    console.log("DEBYG", this.matches);
    this.updateOverflowState();
    if (this.matchesSlider)
      this.isOverflowing = this.matchesSlider.nativeElement.scrollWidth > window.innerWidth - 50;
  }

  ngAfterViewInit() {
    this.updateOverflowState();
    console.log(environment.production)
    this.isOverflowing = this.matchesSlider.nativeElement.scrollWidth > window.innerWidth - 50
  }

  ngAfterViewChecked() {
    this.updateOverflowState();
    if (!this.sliderInitialized && this.matchesSlider?.nativeElement.querySelectorAll('.match').length) {
      this.sliderInitialized = true;
    }
  }

  onMatchClick(matchId: string): void {
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
  getMatchesToRender(reverse: boolean = false): any[] {
    if (!this.matches) return [];
    const matches = this.matches.slice();
    if (reverse) {
      matches.reverse();
    }
    return matches.slice(0, this.maxMatchesToShow);
  }

  scrollLeft(): void {
    const slider = this.matchesSlider?.nativeElement;
    if (!slider) {
      return;
    }
    slider.scrollLeft -= slider.clientWidth;
    this.updateOverflowState();
  }

  scrollRight(): void {
    const slider = this.matchesSlider?.nativeElement;
    if (!slider) {
      return;
    }
    slider.scrollLeft += slider.clientWidth;
    this.updateOverflowState();
  }

  private updateOverflowState(): void {
    const slider = this.matchesSlider?.nativeElement;
    if (!slider) {
      this.showNavButtons = false;
      this.canScrollLeft = false;
      this.canScrollRight = false;
      return;
    }

    const hasOverflow = slider.scrollWidth > slider.clientWidth + 1;
    this.showNavButtons = hasOverflow;

    if (!hasOverflow) {
      this.canScrollLeft = false;
      this.canScrollRight = false;
      slider.scrollLeft = 0;
      return;
    }

    const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
    this.canScrollLeft = slider.scrollLeft > 0;
    this.canScrollRight = slider.scrollLeft < maxScrollLeft;
  }
}