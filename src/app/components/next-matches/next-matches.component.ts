import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { DataService } from '../../../services/data.service';
import { INextMatch } from '../../interfaces/next-match.interface';
import { Slider } from '../../utils/Slider';
import { Utils } from '../../utils/Utils';
import { ModalService } from '../../../services/modal.service';
import { ModalComponent } from '../../common/modal/modal.component';
import { ShowNextMatchModalComponent } from '../show-next-match-modal/show-next-match-modal.component';

@Component({
  selector: 'app-next-matches',
  standalone: true,
  imports: [CommonModule, ModalComponent, ShowNextMatchModalComponent, ...SHARED_IMPORTS],
  templateUrl: './next-matches.component.html',
  styleUrls: ['./next-matches.component.scss']
})
export class NextMatchesComponent implements OnInit, AfterViewInit, AfterViewChecked {
  nextMatches: INextMatch[] = [];

  @ViewChild('matchesSlider')
  matchesSlider?: ElementRef<HTMLDivElement>;

  @ViewChild('sliderContainer')
  sliderContainer?: ElementRef<HTMLElement>;

  showNavButtons = false;

  slider?: Slider;
  private sliderInitialized = false;
  isDesktop = this.checkIsDesktop();
  selectedMatch?: INextMatch;
  autoOpenScheduler = false;

  constructor(private readonly dataService: DataService, public modalService: ModalService) {}

  ngOnInit(): void {
    this.loadMatches();
  }

  async loadMatches(): Promise<void> {
    const matches = await this.dataService.fetchNextMatches();
    this.nextMatches = Array.isArray(matches) ? (matches as INextMatch[]) : [];
    this.sliderInitialized = false;
    queueMicrotask(() => {
      this.updateOverflowState();
      this.ensureSlider();
    });
  }

  ngAfterViewInit(): void {
    this.updateOverflowState();
    this.ensureSlider();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.isDesktop = this.checkIsDesktop();
    this.sliderInitialized = false;
    this.ensureSlider();
    this.updateOverflowState();
  }

  ngAfterViewChecked(): void {
    if (!this.sliderInitialized && this.matchesSlider?.nativeElement.querySelectorAll('.match-card').length && this.isDesktop) {
      this.ensureSlider();
      this.sliderInitialized = true;
    }
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/default-player.jpg';
  }

  trackByMatch(index: number, match: INextMatch): string | number {
    return match?.id ?? index;
  }

  onMatchClick(match: INextMatch): void {
    if (this.isDesktop && this.slider?.justDragged) {
      return;
    }
    this.autoOpenScheduler = false;
    this.openMatchModal(match);
  }

  onScheduleButtonClick(match: INextMatch, event: MouseEvent): void {
    event.stopPropagation();
    this.autoOpenScheduler = true;
    this.openMatchModal(match);
  }

  onModalClosed(): void {
    this.selectedMatch = undefined;
    this.autoOpenScheduler = false;
  }

  onScheduleUpdated(match: INextMatch): void {
    this.selectedMatch = match;
    const index = this.nextMatches.findIndex(item => item.id === match.id);
    if (index >= 0) {
      this.nextMatches = [
        ...this.nextMatches.slice(0, index),
        match,
        ...this.nextMatches.slice(index + 1)
      ];
    }
    queueMicrotask(() => {
      this.updateOverflowState();
      if (this.isDesktop) {
        this.slider?.updateUI();
      }
    });
  }

  private updateOverflowState(): void {
    const slider = this.matchesSlider?.nativeElement;
    if (!slider) {
      this.showNavButtons = false;
      return;
    }

    if (!this.isDesktop) {
      this.showNavButtons = false;
      return;
    }

    this.showNavButtons = slider.scrollWidth > slider.clientWidth + 1;
  }

  private ensureSlider(): void {
    const sliderEl = this.matchesSlider?.nativeElement;
    const containerEl = this.sliderContainer?.nativeElement;
    if (!sliderEl || !containerEl) {
      return;
    }

    if (this.isDesktop) {
      if (!this.slider) {
        this.slider = new Slider(containerEl, sliderEl, {
          itemSelector: '.match-card',
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

  private openMatchModal(match: INextMatch): void {
    this.selectedMatch = match;
    this.modalService.openModal(this.modalService.MODALS['SHOW_NEXT_MATCH']);
  }

  private checkIsDesktop(): boolean {
    if (typeof window === 'undefined') {
      return true;
    }
    const isMobile = Utils.isMobile();
    return !isMobile && window.innerWidth >= 768;
  }
}
