import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';
import { ModalService } from '../../../services/modal.service';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { BASE_SLIDER_CONFIG } from '../../config/slider.config';

@Component({
  selector: 'app-matches',
  imports: [...SHARED_IMPORTS],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss'
})
export class MatchesComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() matches: any;
  @Output() matchEmitter: EventEmitter<IMatch> = new EventEmitter<IMatch>();
  maxMatchesToShow = 25;
  clickedMatch: IMatch | null = null;
  swiperConfig: SwiperOptions = {
    ...BASE_SLIDER_CONFIG,
    modules: [Navigation],
    navigation: true
  };
  @ViewChild('swiperEl') swiperEl?: ElementRef<HTMLElement>;
  private swiperInstance?: Swiper;

  constructor(public modalService: ModalService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matches']) {
      this.queueSwiperUpdate();
    }
  }

  ngAfterViewInit(): void {
    this.initSwiper();
  }

  ngOnDestroy(): void {
    this.swiperInstance?.destroy(true, true);
    this.swiperInstance = undefined;
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

  private initSwiper(): void {
    if (this.swiperInstance || !this.swiperEl) {
      return;
    }

    this.swiperInstance = new Swiper(this.swiperEl.nativeElement, this.swiperConfig);
    this.queueSwiperUpdate();
  }

  private queueSwiperUpdate(): void {
    queueMicrotask(() => {
      if (!this.swiperInstance) {
        this.initSwiper();
      } else {
        this.swiperInstance.update();
      }
    });
  }
}