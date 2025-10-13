import { Component, Input, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';

@Component({
  selector: 'app-next-matches',
  standalone: true,
  imports: [CommonModule, DatePipe, ...SHARED_IMPORTS],
  templateUrl: './next-matches.component.html',
  styleUrls: ['./next-matches.component.scss']
})
export class NextMatchesComponent implements AfterViewInit {
  @Input() matches: any[] = []; // Array di prossime partite
  @ViewChild('matchesSlider') matchesSlider!: ElementRef<HTMLDivElement>;
  isOverflowing = false;

  ngAfterViewInit(): void {
    this.checkOverflow();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkOverflow();
  }

  checkOverflow(): void {
    if (!this.matchesSlider) return;
    const el = this.matchesSlider.nativeElement;
    this.isOverflowing = el.scrollWidth > el.clientWidth;
  }

  scrollLeft(): void {
    this.matchesSlider.nativeElement.scrollBy({ left: -250, behavior: 'smooth' });
  }

  scrollRight(): void {
    this.matchesSlider.nativeElement.scrollBy({ left: 250, behavior: 'smooth' });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/img/default-avatar.png';
  }

  trackByIndex(index: number) {
    return index;
  }

  getUpcomingMatches() {
    const now = new Date().getTime();
    return this.matches.filter(m => new Date(m.date).getTime() > now);
  }
}
