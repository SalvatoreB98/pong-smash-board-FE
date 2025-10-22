import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Navigation } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';
import { ModalService } from '../../../services/modal.service';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { BASE_SLIDER_CONFIG } from '../../config/slider.config';
import { MatchCardComponent, MatchCardPlayerSlot } from '../match-card/match-card.component';
import { SwiperManager } from '../../utils/helpers/swiper.manager';

@Component({
  selector: 'app-matches',
  imports: [...SHARED_IMPORTS, MatchCardComponent],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss'
})
export class MatchesComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() matches: any;
  @Input() readonly = false;
  @Output() matchEmitter: EventEmitter<IMatch> = new EventEmitter<IMatch>();
  maxMatchesToShow = 25;
  isOverflowing: boolean = false;
  clickedMatch: IMatch | null = null;
  swiperConfig: SwiperOptions = {
    ...BASE_SLIDER_CONFIG,
    modules: [Navigation],
    navigation: true
  };
  @ViewChild('swiperEl') swiperEl?: ElementRef<HTMLElement>;
  // Shared Swiper manager keeps slider lifecycle logic consistent after refactor.
  private swiperManager = new SwiperManager(() => this.swiperEl?.nativeElement ?? null, this.swiperConfig);

  constructor(public modalService: ModalService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matches']) {
      this.swiperManager.queueUpdate();
    }
  }

  ngAfterViewInit(): void {
    this.swiperManager.init();
  }

  ngOnDestroy(): void {
    this.swiperManager.destroy();
  }

  onMatchClick(matchId: string): void {
    if (this.readonly) {
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

  mapMatchToPlayers(match: IMatch): MatchCardPlayerSlot[] {
    // Normalizes the match result so the shared match-card can render scores consistently.
    const player1Score = Number(match.player1_score ?? 0);
    const player2Score = Number(match.player2_score ?? 0);
    return [
      {
        displayName: match.player1_name ?? '',
        avatarUrl: match.player1_img ?? null,
        score: match.player1_score ?? '-',
        isWinner: player1Score > player2Score,
      },
      {
        displayName: match.player2_name ?? '',
        avatarUrl: match.player2_img ?? null,
        score: match.player2_score ?? '-',
        isWinner: player2Score > player1Score,
      },
    ];
  }
}