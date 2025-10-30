import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';

@Component({
  selector: 'app-bracket-modal',
  imports: [CommonModule, ...SHARED_IMPORTS],
  templateUrl: './bracket-modal.component.html',
  styleUrl: './bracket-modal.component.scss',
})
export class BracketModalComponent implements AfterViewInit, OnDestroy {
  private _rounds: any[] = [];

  // ➜ Stato per layout a due lati
  isTwoSides = false;
  leftRounds: any[] = [];
  rightRounds: any[] = [];
  totalRounds = 0; // numero di colonne (rounds.length)
  centerRounds: any[] = []; // round centrali (finale/terzo posto, ecc.)
  @Input()
  set rounds(value: any[]) {
    this._rounds = value ?? [];

    // calcolo righe totali per lo spacing della grid "classica"
    const firstRound = this._rounds[0];
    if (firstRound?.matches?.length) {
      this.totalRows = firstRound.matches.length * 2 - 1;
    } else {
      this.totalRows = 1;
    }

    // calcolo split sinistra/destra
    this.computeSides();

    // dopo aver aggiornato i dati, aggiorno le linee e ricentro nella prossima tick
    queueMicrotask(() => {
      this.updateLine();
      this.centerGrid();
    });
  }
  get rounds(): any[] {
    return this._rounds;
  }

  @Input() competitionName: string = '';
  @ViewChild('bracketGrid') bracketGrid?: ElementRef<HTMLDivElement>;
  @ViewChild('bracketScale') bracketScale?: ElementRef<HTMLDivElement>;
  @ViewChild('bracketContainer') bracketContainer?: ElementRef<HTMLDivElement>;

  zoomLevel = 1;
  totalRows = 1;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private offsetX = 0;
  private offsetY = 0;
  private lastOffsetX = 0;
  private lastOffsetY = 0;
  private rafId: number | null = null;
  private pendingDX = 0;
  private pendingDY = 0;
  private dragThreshold = 5;
  private hasMoved = false;
  private activePointerId: number | null = null;
  private modalElement: HTMLElement | null = null;

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    const firstRound = this.rounds[0];
    if (firstRound?.matches?.length) {
      this.totalRows = firstRound.matches.length * 2 - 1;
    }
    this.computeSides();
    queueMicrotask(() => this.centerGrid());
  }

  ngAfterViewInit() {
    const containerEl = this.bracketContainer?.nativeElement;
    if (!containerEl) {
      return;
    }

    this.modalElement = containerEl.closest('.my-modal');
    if (this.modalElement) {
      this.renderer.addClass(this.modalElement, 'no-scroll');
    }

    this.centerGrid();
    this.updateLine();
    const bracketRight = document.querySelector('.side.right .bracket-grid') as HTMLElement | null;
    const bracketLeft = document.querySelector('.side.left .bracket-grid') as HTMLElement | null;
    const matchElement = bracketLeft?.querySelector('.match') as HTMLElement | null;
    const rowHeight = matchElement ? getComputedStyle(matchElement).getPropertyValue('height') : '90px';
    if (!bracketLeft) return;
    const bracketLeftGridRowsNumber = getComputedStyle(bracketLeft).getPropertyValue('grid-template-rows').split(/\s+/).filter(Boolean).length;
    if (bracketRight) {
      bracketRight.style.setProperty('grid-template-rows', `repeat(${bracketLeftGridRowsNumber}, ${rowHeight})`);
    }
  }

  /** -----------------------
   *  LOGICA LAYOUT DUE LATI
   *  ---------------------- */
  private computeSides() {
    const firstRoundMatches = this._rounds?.[0]?.matches?.length ?? 0;
    this.isTwoSides = firstRoundMatches >= 8; // ottavi+ (altrimenti single-side)
    this.totalRounds = this._rounds?.length ?? 0;

    this.leftRounds = [];
    this.rightRounds = [];
    this.centerRounds = [];

    if (!this.isTwoSides) return;

    this._rounds.forEach((r) => {
      const m = r.matches || [];
      if (m.length === 1) {
        // ➜ finale (o round centrale): lo mettiamo in centro, non nei lati
        this.centerRounds.push({ ...r, matches: m.slice(0) });
      } else {
        const half = Math.floor(m.length / 2);
        // ➜ split pulito: sinistra = prima metà, destra = seconda metà
        this.leftRounds.push({ ...r, matches: m.slice(0, half) });
        this.rightRounds.push({ ...r, matches: m.slice(half) });
      }
    });
  }

  /** -----------------------
   *  POSIZIONAMENTO CELLE
   *  ---------------------- */
  getGridRow(colIndex: number, matchIndex: number): number {
    const spacing = Math.pow(2, colIndex);
    return matchIndex * spacing * 2 + spacing;
  }

  getRightGridColumn(colIndexFromZero: number): number {
    const splitRoundsCount = this.leftRounds.length; // == rightRounds.length
    return splitRoundsCount - colIndexFromZero;
  }

  /** -----------------------
   *  ZOOM
   *  ---------------------- */
  zoomIn(step: number = 0.1, max: number = 2) {
    this.zoomLevel = Math.min(max, this.zoomLevel + step);
    this.applyTransform();
  }

  zoomOut(step: number = 0.1, min: number = 0.5) {
    this.zoomLevel = Math.max(min, this.zoomLevel - step);
    this.applyTransform();
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const ZOOM_STEP = 0.1;
    if (event.deltaY < 0) this.zoomIn(ZOOM_STEP);
    else this.zoomOut(ZOOM_STEP);
  }

  /** -----------------------
   *  DRAG
   *  ---------------------- */
  onPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;

    if (!this.bracketContainer) return;

    this.activePointerId = event.pointerId;
    this.bracketContainer.nativeElement.setPointerCapture(event.pointerId);

    this.isDragging = true;
    this.hasMoved = false;

    this.pendingDX = 0;
    this.pendingDY = 0;

    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.lastOffsetX = this.offsetX;
    this.lastOffsetY = this.offsetY;

    this.renderer.addClass(this.bracketContainer.nativeElement, 'dragging');

    if (!this.rafId) this.startAnimationLoop();
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isDragging) return;
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) return;

    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;

    if (!this.hasMoved && Math.hypot(dx, dy) < this.dragThreshold) return;
    this.hasMoved = true;

    this.pendingDX = dx;
    this.pendingDY = dy;
  }

  onPointerUp(event?: PointerEvent) {
    if (!this.hasMoved) {
      this.pendingDX = 0;
      this.pendingDY = 0;
    }

    this.isDragging = false;
    if (this.bracketGrid) {
      this.bracketGrid.nativeElement.style.transition = 'transform 0.25s ease-out';
    }
    if (this.bracketContainer) {
      this.renderer.removeClass(this.bracketContainer.nativeElement, 'dragging');
    }

    if (event && this.activePointerId !== null && event.pointerId === this.activePointerId && this.bracketContainer) {
      this.bracketContainer.nativeElement.releasePointerCapture(this.activePointerId);
    }
    this.activePointerId = null;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** --- ANIMATION FRAME LOOP --- */
  private startAnimationLoop() {
    if (!this.bracketGrid) return;
    const grid = this.bracketGrid.nativeElement;

    const loop = () => {
      if (this.isDragging) {
        if (this.hasMoved) {
          this.offsetX = this.lastOffsetX + this.pendingDX;
          this.offsetY = this.lastOffsetY + this.pendingDY;
          grid.style.transform = `translate3d(${this.offsetX}px, ${this.offsetY}px, 0)`;
        }
        this.rafId = requestAnimationFrame(loop);
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }

  applyTransform() {
    if (!this.bracketGrid || !this.bracketScale) return;

    // Muove solo la griglia
    const grid = this.bracketGrid.nativeElement;
    grid.style.transform = `translate3d(${this.offsetX}px, ${this.offsetY}px, 0)`;

    // Scala solo il wrapper
    const scaleLayer = this.bracketScale.nativeElement;
    scaleLayer.style.transform = `scale(${this.zoomLevel})`;
    scaleLayer.style.transformOrigin = 'center center';
  }

  centerGrid() {
    if (!this.bracketContainer || !this.bracketGrid) return;
    const container = this.bracketContainer.nativeElement;
    const grid = this.bracketGrid.nativeElement;

    const cWidth = container.clientWidth;
    const cHeight = container.clientHeight;
    const gWidth = grid.scrollWidth;
    const gHeight = grid.scrollHeight;

    this.offsetX = (cWidth - gWidth) / 2;
    this.offsetY = 0;
    this.applyTransform();
  }

  /** -----------------------
   *  LINEE VERTICALI
   *  ---------------------- */
  updateLine() {
    const verEls = Array.from(document.querySelectorAll('.ver')) as HTMLElement[];

    verEls.forEach((ver, index) => {
      const matchEl = ver.parentElement as HTMLElement;
      if (!matchEl) return;

      // ✅ limita la ricerca alla griglia corrente
      const grid = ver.closest('.bracket-grid') as HTMLElement;
      if (!grid) return;
      const isRightSide = !!grid.closest('.side.right');
      const allMatches = Array.from(grid.querySelectorAll('.match')) as HTMLElement[];

      const parentStyle = getComputedStyle(matchEl);
      const colStart = parseInt(parentStyle.getPropertyValue('grid-column-start')) || 0;
      const parentRect = matchEl.getBoundingClientRect();
      const parentCenterY = parentRect.top + parentRect.height / 2;

      // calcola la "colonna precedente" in base al lato
      const prevCol = isRightSide ? colStart + 1 : colStart - 1;

      if ((isRightSide && prevCol > getMaxCol(allMatches)) || (!isRightSide && prevCol < 1)) {
        ver.style.height = `${parentRect.height}px`;
        return;
      }

      // raccogli .ver della colonna precedente SOLO in questa griglia
      const prevVers = allMatches
        .filter((m) => {
          const cs = parseInt(getComputedStyle(m).getPropertyValue('grid-column-start')) || 0;
          return cs === prevCol;
        })
        .map((m) => m.querySelector('.ver') as HTMLElement)
        .filter(Boolean)
        .map((v) => {
          const r = v.getBoundingClientRect();
          return { el: v, top: r.top, center: r.top + r.height / 2, rect: r };
        })
        .sort((a, b) => a.center - b.center);

      let above: { center: number } | null = null;
      let below: { center: number } | null = null;
      for (const item of prevVers) {
        if (item.center < parentCenterY) above = item;
        else if (item.center >= parentCenterY && !below) below = item;
      }

      if (above && below) {
        const distance = Math.max(0, below.center - above.center);
        ver.style.height = `${distance}px`;
      }
    });

    function getMaxCol(matches: HTMLElement[]) {
      return matches.reduce((max, m) => {
        const cs = parseInt(getComputedStyle(m).getPropertyValue('grid-column-start')) || 0;
        return Math.max(max, cs);
      }, 1);
    }
  }

  ngOnDestroy() {
    if (this.modalElement) {
      this.renderer.removeClass(this.modalElement, 'no-scroll');
    }
  }
}
