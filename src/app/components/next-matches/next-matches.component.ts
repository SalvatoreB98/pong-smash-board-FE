import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { DataService } from '../../../services/data.service';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { BASE_SLIDER_CONFIG } from '../../config/slider.config';

type NextMatch = IMatch & {
  group_name?: string | null;
  groupName?: string | null;
  player1?: { id?: number; name?: string | null; img?: string | null } | null;
  player2?: { id?: number; name?: string | null; img?: string | null } | null;
  player1_img?: string | null;
  player2_img?: string | null;
  player1_name?: string | null;
  player2_name?: string | null;
};

@Component({
  selector: 'app-next-matches',
  standalone: true,
  imports: [CommonModule, ...SHARED_IMPORTS],
  templateUrl: './next-matches.component.html',
  styleUrls: ['./next-matches.component.scss']
})
export class NextMatchesComponent implements OnInit, AfterViewInit, OnDestroy {
  nextMatches: NextMatch[] = [];
  swiperConfig: SwiperOptions = {
    ...BASE_SLIDER_CONFIG,
    modules: [Navigation],
    navigation: true
  };
  @ViewChild('swiperEl') swiperEl?: ElementRef<HTMLElement>;
  private swiperInstance?: Swiper;

  constructor(private readonly dataService: DataService) { }

  ngOnInit(): void {
    this.loadMatches();
  }

  ngAfterViewInit(): void {
    this.initSwiper();
  }

  ngOnDestroy(): void {
    this.swiperInstance?.destroy(true, true);
    this.swiperInstance = undefined;
  }

  async loadMatches(): Promise<void> {
    const matches = await this.dataService.fetchNextMatches();
    this.nextMatches = Array.isArray(matches) ? (matches as NextMatch[]) : [];
    this.queueSwiperUpdate();
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/default-player.jpg';
  }

  trackByMatch(index: number, match: NextMatch): string | number {
    return match?.id ?? index;
  }

  private initSwiper(): void {
    if (this.swiperInstance || !this.swiperEl) {
      return;
    }

    this.swiperInstance = new Swiper(this.swiperEl.nativeElement, this.swiperConfig);
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
