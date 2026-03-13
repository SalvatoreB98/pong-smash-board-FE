import {
  Component, OnInit, inject, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { IMatch } from '../../interfaces/matchesInterfaces';
import { ICompetition } from '../../../api/competition.api';
import { CompetitionStore } from '../../../stores/competition.store';
import { DataService } from '../../../services/data.service';
import { LoaderService } from '../../../services/loader.service';
import { MatchService } from '../../../services/match.service';
import { MSG_TYPE } from '../../utils/enum';
import { API_PATHS } from '../../../api/api.config';


interface MiniCell {
  date: Date;
  thisMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface CalendarResponse {
  competition?: ICompetition;
  matches?: IMatch[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit, AfterViewInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private http         = inject(HttpClient);
  private store        = inject(CompetitionStore);
  private dataService  = inject(DataService);
  private loader       = inject(LoaderService);
  private matchService = inject(MatchService);
  private cdr          = inject(ChangeDetectorRef);

  @ViewChild('calScroll') calScroll!: ElementRef<HTMLElement>;

  competition: ICompetition | null = null;
  unscheduledMatches: IMatch[] = [];
  alldayMatches: IMatch[] = [];
  allScheduledMatches: IMatch[] = [];

  selectedDay: Date = new Date();
  miniViewMonth: Date = new Date();
  miniCells: MiniCell[] = [];
  showSidebar = false;
  dayNames = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  hours = Array.from({ length: 24 }, (_, i) => i);

  hourHeightPx = 200;
  readonly MIN_HOUR_PX = 40;
  readonly MAX_HOUR_PX = 300;
  
  readonly EVENT_MARGIN = 2;
  estimatedMatchDurationMinutes = 10;
  defaultStartTimeHours = 18;
  alldayDropId = 'allday-drop';

  quarters = [0, 15, 30, 45]; // Mins per quarter

  get quarterHeightPx(): number {
    return this.hourHeightPx / 4;
  }

  get eventHeight(): number {
    return Math.max(16, Math.round((this.estimatedMatchDurationMinutes / 60) * this.hourHeightPx) - this.EVENT_MARGIN * 2);
  }

  get nowLineTop(): number {
    const now = new Date();
    return now.getHours() * this.hourHeightPx + (now.getMinutes() / 60) * this.hourHeightPx;
  }

  get selectedDayLabel(): string {
    return this.selectedDay.toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  get miniMonthLabel(): string {
    return this.miniViewMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  get connectedHourIds(): string[] {
    const drops = ['unscheduled-list', 'allday-drop'];
    for (const h of this.hours) {
      for (const q of this.quarters) {
        drops.push(`quarter-drop-${h}-${q}`);
      }
    }
    return drops;
  }

  ngOnInit() {
    this.buildMiniCells();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.loadCalendarData(id);
    });
    setInterval(() => this.cdr.markForCheck(), 60_000);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.calScroll?.nativeElement) {
        this.calScroll.nativeElement.scrollTop = 7 * this.hourHeightPx;
      }
    }, 200);
  }

  onScrollZoom(event: WheelEvent) {
    // Solo se l'utente preme Ctrl (zoom standard) - blocca lo scroll e fa lo zoom
    if (event.ctrlKey) {
      event.preventDefault();

      const scrollArea = this.calScroll.nativeElement;
      const oldPx = this.hourHeightPx;
      const oldScroll = scrollArea.scrollTop;
      
      this.hourHeightPx += event.deltaY > 0 ? -10 : 10; // Giù = allontana/riduci, Su = avvicina/ingrandisci
      this.hourHeightPx = Math.max(this.MIN_HOUR_PX, Math.min(this.MAX_HOUR_PX, this.hourHeightPx));
      
      // Mantieni la proporzione dello scroll rispetto alla nuova altezza
      if (oldPx !== this.hourHeightPx) {
        scrollArea.scrollTop = oldScroll * (this.hourHeightPx / oldPx);
      }
    }
  }

  // ── Load Data (store-first) ──────────────────────────────────────────────

  private async loadCalendarData(id: string) {
    this.loader.startLittleLoader();
    try {
      // 1. Try to get competition from the store
      const storeComp = this.store.snapshotById(id);

      // 2. Try to get matches already loaded in DataService for this competition
      const storeMatches = this.dataService.matches.filter(
        m => m.competition_id != null && String(m.competition_id) === String(id)
      );

      if (storeComp && storeMatches.length > 0) {
        // ✅ Store hit — use cached data directly
        this.competition = storeComp;
        this.computeEstimatedDuration();
        this.populateMatches(storeMatches);
        this.cdr.markForCheck();
        return;
      }

      // 3. Fallback — call /api/get-calendar
      await this.fetchFromCalendarEndpoint(id);

    } catch (err) {
      console.error('[Calendar] loadCalendarData error', err);
      this.loader.showToast('Errore nel caricamento del calendario', MSG_TYPE.ERROR);
      this.goBack();
    } finally {
      this.loader.stopLittleLoader();
    }
  }

  private async fetchFromCalendarEndpoint(id: string) {
    const res = await firstValueFrom(
      this.http.get<CalendarResponse>(API_PATHS.getCalendar, {
        params: { competitionId: id }
      })
    );
    this.competition = res.competition ?? null;
    this.computeEstimatedDuration();
    this.populateMatches(res.matches ?? []);
    this.cdr.markForCheck();
  }

  // ── Navigation ───────────────────────────────────────────────────────────

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

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

  // ── Mini Calendar ────────────────────────────────────────────────────────

  buildMiniCells() {
    const year = this.miniViewMonth.getFullYear();
    const month = this.miniViewMonth.getMonth();
    const first = new Date(year, month, 1);
    let startDow = (first.getDay() + 6) % 7;
    const cells: MiniCell[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sel = new Date(this.selectedDay); sel.setHours(0, 0, 0, 0);

    for (let i = 0; i < startDow; i++) {
      const d = new Date(year, month, 1 - (startDow - i));
      cells.push({ date: d, thisMonth: false, isToday: d.getTime() === today.getTime(), isSelected: d.getTime() === sel.getTime() });
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, thisMonth: true, isToday: date.getTime() === today.getTime(), isSelected: date.getTime() === sel.getTime() });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last); next.setDate(next.getDate() + 1);
      cells.push({ date: next, thisMonth: false, isToday: next.getTime() === today.getTime(), isSelected: next.getTime() === sel.getTime() });
    }
    this.miniCells = cells;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  isToday(d: Date): boolean {
    const n = new Date();
    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }

  hasMatchOnDay(d: Date): boolean {
    return this.allScheduledMatches.some(m => {
      if (!m.date) return false;
      const md = new Date(m.date);
      return md.getDate() === d.getDate() && md.getMonth() === d.getMonth() && md.getFullYear() === d.getFullYear();
    });
  }

  getDayName(d: Date): string {
    return d.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
  }

  formatDate(dateObj: Date | string | number): string {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  getMatchesForQuarter(hour: number, minute: number): IMatch[] {
    const slotStart = hour * 60 + minute;
    const slotEnd = slotStart + 15;

    return this.allScheduledMatches.filter(m => {
      if (!m.date) return false;
      const d = new Date(m.date);
      const matchMinutes = d.getHours() * 60 + d.getMinutes();
      
      return matchMinutes >= slotStart && 
             matchMinutes < slotEnd &&
             d.getDate() === this.selectedDay.getDate() &&
             d.getMonth() === this.selectedDay.getMonth() &&
             d.getFullYear() === this.selectedDay.getFullYear();
    });
  }

  // ── Populate ─────────────────────────────────────────────────────────────

  private computeEstimatedDuration() {
    if (!this.competition) return;
    const sets   = this.competition.setsType || 3;
    const points = this.competition.pointsType || 11;
    const minPerSet = points === 21 ? 4.5 : 2.5;
    const rawEst = sets * minPerSet;
    this.estimatedMatchDurationMinutes = Math.max(5, Math.round(rawEst / 5) * 5);
  }

  private populateMatches(allMatches: IMatch[]) {
    this.unscheduledMatches  = [];
    this.alldayMatches       = [];
    this.allScheduledMatches = [];

    for (const m of allMatches) {
      if (!m.date) { this.unscheduledMatches.push(m); continue; }
      const d = new Date(m.date as any);
      if (isNaN(d.getTime())) { this.unscheduledMatches.push(m); continue; }
      this.allScheduledMatches.push(m);
    }

    // Jump to first match date if today has none
    const todayHasMatch = this.allScheduledMatches.some(m => this.isToday(new Date(m.date)));
    if (!todayHasMatch && this.allScheduledMatches.length > 0) {
      const sorted = [...this.allScheduledMatches].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      this.selectDay(new Date(sorted[0].date));
    }
  }

  // ── Drop Handlers ─────────────────────────────────────────────────────────

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

  dropOnQuarter(event: CdkDragDrop<IMatch[]>, hour: number, minute: number) {
    const match = event.previousContainer.data[event.previousIndex];
    if (!match) return;

    event.previousContainer.data.splice(event.previousIndex, 1);
    const newDate = new Date(this.selectedDay);
    newDate.setHours(hour, minute, 0, 0);

    const existingInQuarter = this.getMatchesForQuarter(hour, minute);
    existingInQuarter.push(match);
    existingInQuarter.sort((a, b) => new Date(a.date as any || 0).getTime() - new Date(b.date as any || 0).getTime());

    let slotTime = new Date(newDate);
    for (const m of existingInQuarter) {
      m.date = new Date(slotTime);
      slotTime = new Date(slotTime.getTime() + this.estimatedMatchDurationMinutes * 60_000);
    }

    if (!this.allScheduledMatches.includes(match)) {
      this.allScheduledMatches.push(match);
    }

    this.saveUpdates([match, ...existingInQuarter]);
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
