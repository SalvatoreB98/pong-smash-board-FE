import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navigation } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { DataService } from '../../../services/data.service';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { BASE_SLIDER_CONFIG } from '../../config/slider.config';
import { MatchCardAction, MatchCardComponent, MatchCardPlayerSlot, MatchCardSchedule } from '../match-card/match-card.component';
import { SwiperManager } from '../../utils/helpers/swiper.manager';

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
  imports: [CommonModule, ...SHARED_IMPORTS, MatchCardComponent],
  templateUrl: './next-matches.component.html',
  styleUrls: ['./next-matches.component.scss']
})
export class NextMatchesComponent implements OnInit, AfterViewInit, OnDestroy {
  nextMatches: NextMatch[] = [];
  @ViewChild('swiperEl2') swiperEl?: ElementRef<HTMLElement>;
  @ViewChild('nextButton', { read: ElementRef }) nextButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('prevButton', { read: ElementRef }) prevButton?: ElementRef<HTMLButtonElement>;
  isLoading: boolean = true;
  swiperConfig: SwiperOptions = {
    ...BASE_SLIDER_CONFIG,
    modules: [Navigation],
    navigation: {
      enabled: true,
    }
  };
  isOverflowing: boolean = false;
  // Shared Swiper manager avoids duplicated lifecycle code across match sliders.
  readonly swiperManager = new SwiperManager(() => this.swiperEl?.nativeElement ?? null, this.swiperConfig);

  constructor(private readonly dataService: DataService) { }

  ngOnInit(): void {
    this.loadMatches();
  }

  ngAfterViewInit(): void {
    this.configureNavigation();
    this.swiperManager.init();
  }

  ngOnDestroy(): void {
    this.swiperManager.destroy();
  }

  async loadMatches(): Promise<void> {
    const matches = await this.dataService.fetchNextMatches();
    this.isLoading = false;
    this.nextMatches = Array.isArray(matches) ? (matches as NextMatch[]) : [];

    // 👇 Garantisce che Swiper parta solo dopo aver popolato il DOM condiviso.
    this.swiperManager.queueUpdate();
  }

  private configureNavigation(): void {
    const nextEl = this.nextButton?.nativeElement;
    const prevEl = this.prevButton?.nativeElement;

    if (!nextEl || !prevEl) {
      return;
    }

    this.swiperManager.updateConfig({
      navigation: {
        enabled: true,
        nextEl,
        prevEl,
      },
    });
  }

  trackByMatch(index: number, match: NextMatch): string | number {
    return match?.id ?? index;
  }

  mapMatchToPlayers(match: NextMatch): MatchCardPlayerSlot[] {
    // Normalized player payload so the shared match card can render avatars and names.
    return [
      {
        displayName: match?.player1?.name || match?.player1_name || '',
        avatarUrl: match?.player1?.img || match?.player1_img || null,
        state: 'player',
      },
      {
        displayName: match?.player2?.name || match?.player2_name || '',
        avatarUrl: match?.player2?.img || match?.player2_img || null,
        state: 'player',
      },
    ];
  }

  buildSchedule(match: NextMatch, fallbackLabel: string, actionLabel: string): MatchCardSchedule {
    const rawDate = (match as any)?.date ?? null;
    const parsedDate = rawDate instanceof Date ? rawDate : (rawDate != null ? new Date(rawDate) : null);
    const normalizedDate = parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate
      : (typeof rawDate === 'string' ? rawDate : null);

    if (normalizedDate) {
      return {
        date: normalizedDate,
        showTime: true,
      };
    }

    const action: MatchCardAction = {
      label: actionLabel,
      icon: '<i class="fa fa-calendar ms-2" aria-hidden="true"></i>',
      cssClass: 'mt-1',
      handler: null,
    };

    return {
      date: null,
      fallbackLabel,
      action,
      showTime: true,
    };
  }
}
