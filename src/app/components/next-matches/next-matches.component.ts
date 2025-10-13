import { Component, Input, ViewChild, ElementRef, AfterViewInit, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { DataService } from '../../../services/data.service';
import { Utils } from '../../utils/Utils';
import { ModalService } from '../../../services/modal.service';
import { Slider } from '../../utils/Slider';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-next-matches',
  standalone: true,
  imports: [CommonModule, DatePipe, ...SHARED_IMPORTS],
  templateUrl: './next-matches.component.html',
  styleUrls: ['./next-matches.component.scss']
})
export class NextMatchesComponent implements AfterViewInit {
  nextMatches: any[] = []; // Array di prossime partite
  @ViewChild('matchesSlider') matchesSlider!: ElementRef<HTMLDivElement>;
  isOverflowing = false;
  slider: Slider | undefined;
  clickedMatch: any;
  @Output() matchEmitter: EventEmitter<IMatch> = new EventEmitter<IMatch>();
  constructor(private dataService: DataService, public modalService: ModalService) { }
  private sliderInitialized = false;
  
  ngOnInit() {
    this.dataService.fetchNextMatches().then(matches => {
      this.nextMatches = matches;
    });
    if (this.matchesSlider)
      this.isOverflowing = this.matchesSlider.nativeElement.scrollWidth > window.innerWidth - 50;
  }

  ngAfterViewInit() {
    this.checkOverflow();
    console.log(environment.production)
    if (this.matchesSlider) {
      this.slider = new Slider('slider', this.matchesSlider.nativeElement);
    }
    this.isOverflowing = this.matchesSlider.nativeElement.scrollWidth > window.innerWidth - 50
  }
  

  ngAfterViewChecked() {
    if (!this.sliderInitialized && this.matchesSlider?.nativeElement.querySelectorAll('.match').length) {
      this.slider = new Slider('slider', this.matchesSlider.nativeElement);
      this.sliderInitialized = true;
    }
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
    (event.target as HTMLImageElement).src = '/default-player.jpg';
  }

  trackByIndex(index: number) {
    return index;
  }

  getUpcomingMatches() {
    const now = new Date().getTime();
    return this.nextMatches;
  }
  onMatchClick(matchId: string): void {
    if (!Utils.isMobile() && this.slider?.justDragged) {
      return;
    }
    const matchData = this.nextMatches.find((m: { id: string; }) => m.id === matchId);
    if (matchData) {
      this.clickedMatch = matchData;
      this.matchEmitter.emit(matchData);
      this.modalService.openModal(this.modalService.MODALS['SHOW_MATCH']);
    } else {
      console.error('Match not found with id: ' + matchId);
      //show error message
    }
  }
}
