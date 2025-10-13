import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { DataService } from '../../../services/data.service';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { Utils } from '../../utils/Utils';

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
export class NextMatchesComponent implements OnInit, AfterViewInit {
  nextMatches: NextMatch[] = [];

  @ViewChild('matchesSlider')
  matchesSlider?: ElementRef<HTMLDivElement>;

  showNavButtons = false;
  canScrollLeft = false;
  canScrollRight = false;

  constructor(private readonly dataService: DataService) { }

  ngOnInit(): void {
    this.loadMatches();
  }

  async loadMatches(): Promise<void> {
    const matches = await this.dataService.fetchNextMatches();
    this.nextMatches = Array.isArray(matches) ? (matches as NextMatch[]) : [];
    queueMicrotask(() => this.updateOverflowState());
  }

  ngAfterViewInit(): void {
    this.updateOverflowState();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateOverflowState();
  }

  onScroll(): void {
    this.updateOverflowState();
  }

  scrollLeft(): void {
    const slider = this.matchesSlider?.nativeElement;
    if (!slider) {
      return;
    }

    slider.scrollBy({ left: -slider.clientWidth * 0.8, behavior: 'smooth' });
    setTimeout(() => this.updateOverflowState(), 300);
  }

  scrollRight(): void {
    const slider = this.matchesSlider?.nativeElement;
    if (!slider) {
      return;
    }

    slider.scrollBy({ left: slider.clientWidth * 0.8, behavior: 'smooth' });
    setTimeout(() => this.updateOverflowState(), 300);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/default-player.jpg';
  }

  trackByMatch(index: number, match: NextMatch): string | number {
    return match?.id ?? index;
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
