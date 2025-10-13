import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Slider } from '../../utils/Slider';
import { Utils } from '../../utils/Utils';
import { IMatchResponse } from '../../interfaces/responsesInterfaces';
import { CommonModule } from '@angular/common';
import { ShowMatchModalComponent } from '../show-match-modal/show-match-modal.component';
import { ModalService } from '../../../services/modal.service';
import { IMatch } from '../../interfaces/matchesInterfaces';
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
  @ViewChild('matchesSlider') matchesSlider!: ElementRef<HTMLElement>;
  @ViewChild('sliderContainer') sliderContainer!: ElementRef<HTMLElement>;

  slider: Slider | undefined;
  clickedMatch: any;

  @Output() matchEmitter: EventEmitter<IMatch> = new EventEmitter<IMatch>();
  maxMatchesToShow: number = 25;

  isOverflowing: boolean = true;
  isDesktop = this.checkIsDesktop();
  @HostListener('window:resize')
  onWinResize() {
    this.isDesktop = this.checkIsDesktop();
    this.updateOverflowState();
    this.ensureSlider();
  }

  constructor(public modalService: ModalService) {

  }
  ngOnInit() {
  }

  ngAfterViewInit() {
    this.ensureSlider();
    this.updateOverflowState();
  }
  private sliderInitialized = false;

  ngAfterViewChecked() {
    if (!this.sliderInitialized && this.matchesSlider?.nativeElement.querySelectorAll('.match').length && this.isDesktop) {
      this.ensureSlider();
      this.sliderInitialized = true;
    }
  }

  onMatchClick(matchId: string): void {
    if (this.isDesktop && this.slider?.justDragged) {
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
  getMatchesToRender(reverse: boolean = false): any[] {
    if (!this.matches) return [];
    const matches = this.matches.slice();
    if (reverse) {
      matches.reverse();
    }
    return matches.slice(0, this.maxMatchesToShow);
  }

  private ensureSlider(): void {
    const container = this.sliderContainer?.nativeElement;
    const sliderEl = this.matchesSlider?.nativeElement;
    if (!sliderEl || !container) {
      return;
    }

    if (this.isDesktop) {
      if (!this.slider) {
        this.slider = new Slider(container, sliderEl, {
          itemSelector: '.match',
          enableMouseDrag: true,
          enableTouchDrag: false,
        });
        this.sliderInitialized = true;
      } else {
        this.slider.updateUI();
      }
    } else {
      this.slider = undefined;
      sliderEl.style.transition = '';
      sliderEl.style.transform = '';
      this.sliderInitialized = false;
    }
  }

  private updateOverflowState(): void {
    const sliderEl = this.matchesSlider?.nativeElement;
    if (!sliderEl) {
      this.isOverflowing = false;
      return;
    }
    if (!this.isDesktop) {
      this.isOverflowing = sliderEl.scrollWidth > sliderEl.clientWidth + 1;
      return;
    }
    this.isOverflowing = sliderEl.scrollWidth > window.innerWidth - 50;
  }

  private checkIsDesktop(): boolean {
    if (typeof window === 'undefined') {
      return true;
    }
    const isMobileDevice = Utils.isMobile();
    return !isMobileDevice && window.innerWidth >= 768;
  }
}