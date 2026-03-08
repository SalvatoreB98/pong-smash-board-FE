import { Component, OnInit, inject, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { ICompetition } from '../../../api/competition.api';
import { CompetitionService } from '../../../services/competitions.service';
import { LoaderService } from '../../../services/loader.service';
import { TranslationService } from '../../../services/translation.service';
import { MSG_TYPE } from '../../utils/enum';
import { MatchService } from '../../../services/match.service';

interface MiniCell {
  date: Date;
  thisMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private competitionService = inject(CompetitionService);
  private loader = inject(LoaderService);
  private matchService = inject(MatchService);
  private translateService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('calScroll') calScroll!: ElementRef<HTMLElement>;

  competition: ICompetition | null = null;
  unscheduledMatches: IMatch[] = [];
  alldayMatches: IMatch[] = [];
  allScheduledMatches: IMatch[] = [];

  selectedDay: Date = new Date();
  miniViewMonth: Date = new Date();
  miniCells: MiniCell[] = [];
  dayNames = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  hours = Array.from({ length: 24 }, (_, i) => i);

  readonly HOUR_PX = 60; // 60px per hour
  readonly EVENT_MARGIN = 2;
  estimatedMatchDurationMinutes = 10;
  defaultStartTimeHours = 18;
  alldayDropId = 'allday-drop';

  get eventHeight(): number {
    return Math.round((this.estimatedMatchDurationMinutes / 60) * this.HOUR_PX) - this.EVENT_MARGIN * 2;
  }

  get nowLineTop(): number {
    const now = new Date();
    return now.getHours() * this.HOUR_PX + (now.getMinutes() / 60) * this.HOUR_PX;
  }

  get selectedDayLabel(): string {
    return this.selectedDay.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  get miniMonthLabel(): string {
    return this.miniViewMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  get connectedHourIds(): string[] {
    return [
      'unscheduled-list',
      'allday-drop',
      ...this.hours.map((_, i) => `hour-drop-${i}`),
    ];
  }

  ngOnInit() {
    this.buildMiniCells();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCompetitionData(id);
      }
    });
    // Update now-line every minute
    setInterval(() => this.cdr.markForCheck(), 60_000);
  }

  ngAfterViewInit() {
    // Scroll to 7 AM by default
    setTimeout(() => {
      if (this.calScroll?.nativeElement) {
        this.calScroll.nativeElement.scrollTop = 7 * this.HOUR_PX;
      }
    }, 200);
  }

  // ── Navigation ──
  goBack() {
    if (this.competition) {
      this.router.navigate(['/competition', this.competition.id]);
    } else {
      this.router.navigate(['/home-page']);
    }
  }

  goToToday() {
    this.selectedDay = new Date();
    this.miniViewMonth = new Date();
    this.buildMiniCells();
  }

  prevDay() {
    const d = new Date(this.selectedDay);
    d.setDate(d.getDate() - 1);
    this.selectDay(d);
  }

  nextDay() {
    const d = new Date(this.selectedDay);
    d.setDate(d.getDate() + 1);
    this.selectDay(d);
  }

  selectDay(date: Date) {
    this.selectedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    this.buildMiniCells();
  }

  miniPrev() {
    this.miniViewMonth = new Date(this.miniViewMonth.getFullYear(), this.miniViewMonth.getMonth() - 1, 1);
    this.buildMiniCells();
  }

  miniNext() {
    this.miniViewMonth = new Date(this.miniViewMonth.getFullYear(), this.miniViewMonth.getMonth() + 1, 1);
    this.buildMiniCells();
  }

  // ── Mini calendar ──
  buildMiniCells() {
    const year = this.miniViewMonth.getFullYear();
    const month = this.miniViewMonth.getMonth();
    const first = new Date(year, month, 1);
    // Start week on Monday: getDay() 0=Sun -> shift
    let startDow = (first.getDay() + 6) % 7; // 0=Mon
    const cells: MiniCell[] = [];
    const today = new Date(); today.setHours(0,0,0,0);
    const sel = new Date(this.selectedDay); sel.setHours(0,0,0,0);

    // Fill cells from previous month
    for (let i = 0; i < startDow; i++) {
      const d = new Date(year, month, 1 - (startDow - i));
      cells.push({ date: d, thisMonth: false, isToday: d.getTime() === today.getTime(), isSelected: d.getTime() === sel.getTime() });
    }
    // Current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, thisMonth: true, isToday: date.getTime() === today.getTime(), isSelected: date.getTime() === sel.getTime() });
    }
    // Pad to complete rows
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last); next.setDate(next.getDate() + 1);
      cells.push({ date: next, thisMonth: false, isToday: next.getTime() === today.getTime(), isSelected: next.getTime() === sel.getTime() });
    }
    this.miniCells = cells;
  }

  // ── Helpers ──
  isToday(d: Date): boolean {
    const n = new Date();
    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }

  getDayName(d: Date): string {
    return d.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
  }

  formatDate(dateObj: Date | string | number): string {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  getMatchesForHour(hour: number): IMatch[] {
    return this.allScheduledMatches.filter(m => {
      if (!m.date) return false;
      const d = new Date(m.date);
      return d.getHours() === hour &&
             d.getDate() === this.selectedDay.getDate() &&
             d.getMonth() === this.selectedDay.getMonth() &&
             d.getFullYear() === this.selectedDay.getFullYear();
    });
  }

  // ── Load data ──
  private loadCompetitionData(id: string) {
    this.loader.startLittleLoader();
    this.competitionService.updateActiveCompetition(id).subscribe({
      next: (reqInfo: any) => {
        this.competitionService.activeCompetition$.subscribe(comp => {
          if (comp) {
            this.competition = comp;
            this.computeEstimatedDuration();
            this.populateMatches(reqInfo?.userState?.matches ?? []);
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        this.loader.stopLittleLoader();
        this.loader.showToast('Error loading competition', MSG_TYPE.ERROR);
        this.goBack();
      },
      complete: () => this.loader.stopLittleLoader()
    });
  }

  private computeEstimatedDuration() {
    if (!this.competition) return;
    const sets = this.competition.setsType || 3;
    const points = this.competition.pointsType || 11;
    const minPerSet = points === 21 ? 4.5 : 2.5;
    const rawEst = sets * minPerSet;
    this.estimatedMatchDurationMinutes = Math.max(5, Math.round(rawEst / 5) * 5);
  }

  private populateMatches(allMatches: IMatch[]) {
    this.unscheduledMatches = [];
    this.alldayMatches = [];
    this.allScheduledMatches = [];

    for (const m of allMatches) {
      if (!m.date) {
        this.unscheduledMatches.push(m);
        continue;
      }
      const d = new Date(m.date);
      if (isNaN(d.getTime())) {
        this.unscheduledMatches.push(m);
        continue;
      }
      this.allScheduledMatches.push(m);
    }

    // Jump to first scheduled match date if today has none
    const todayHasMatch = this.allScheduledMatches.some(m => {
      const d = new Date(m.date);
      return this.isToday(d);
    });
    if (!todayHasMatch && this.allScheduledMatches.length > 0) {
      const sorted = [...this.allScheduledMatches].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      this.selectDay(new Date(sorted[0].date));
    }
  }

  // ── Drop handlers ──
  drop(event: CdkDragDrop<IMatch[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      const match = event.container.data[event.currentIndex];
      if (event.container.id === 'unscheduled-list') {
        this.clearMatchDate(match);
      }
    }
  }

  dropOnHour(event: CdkDragDrop<IMatch[]>, hour: number) {
    const match = event.previousContainer.data[event.previousIndex];
    if (!match) return;

    // Remove from wherever it was
    event.previousContainer.data.splice(event.previousIndex, 1);

    // Compute new date
    const newDate = new Date(this.selectedDay);
    newDate.setHours(hour, 0, 0, 0);

    // Cascade: push subsequent matches on same hour forward
    const existingInHour = this.getMatchesForHour(hour);
    existingInHour.push(match); // add temporarily
    existingInHour.sort((a,b) => new Date(a.date as any || 0).getTime() - new Date(b.date as any || 0).getTime());

    let slotTime = new Date(newDate);
    for (const m of existingInHour) {
      m.date = new Date(slotTime);
      slotTime = new Date(slotTime.getTime() + this.estimatedMatchDurationMinutes * 60_000);
    }

    // Ensure it's in allScheduledMatches
    if (!this.allScheduledMatches.includes(match)) {
      this.allScheduledMatches.push(match);
    }

    this.saveUpdates([match, ...existingInHour]);
    this.cdr.markForCheck();
  }

  onEventClick(m: IMatch) {
    // Future: open match detail modal
  }

  private async saveUpdates(matches: IMatch[]) {
    try {
      for (const m of matches) {
        await this.matchService.setMatchDate(m.id, m.date);
      }
      this.loader.showToast('Calendario aggiornato!', MSG_TYPE.SUCCESS);
    } catch (e) {
      this.loader.showToast('Errore nel salvare le date', MSG_TYPE.ERROR);
    }
  }

  private async clearMatchDate(match: IMatch) {
    match.date = '';
    try {
      await this.matchService.setMatchDate(match.id, null);
    } catch (e) {
      console.error('Error clearing match date', e);
    }
  }
}
