import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  Optional,
  Host,
} from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { ModalComponent } from '../../../common/modal/modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bracket-modal',
  imports: [CommonModule, ...SHARED_IMPORTS],
  templateUrl: './bracket-modal.component.html',
  styleUrl: './bracket-modal.component.scss',
})
export class BracketModalComponent implements AfterViewInit, OnDestroy {
  private _rounds: any[] = [];

  @Input()
  set rounds(value: any[]) {
    this._rounds = value ?? [];
    const firstRound = this._rounds[0];
    if (firstRound?.matches?.length) {
      this.totalRows = firstRound.matches.length * 2 - 1;
    } else {
      this.totalRows = 1;
    }
    this.scheduleLineUpdate();
  }
  get rounds(): any[] {
    return this._rounds;
  }
  @Input() competitionName: string = '';
  @ViewChild('bracketGrid') bracketGrid!: ElementRef<HTMLDivElement>;
  @ViewChild('bracketScale') bracketScale!: ElementRef<HTMLDivElement>;
  @ViewChild('bracketContainer') bracketContainer!: ElementRef<HTMLDivElement>;

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

  private fullscreenSub?: Subscription;
  private updateLineTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private renderer: Renderer2,
    @Optional() @Host() private modalComponent?: ModalComponent,
  ) { }

  ngOnInit() {
    const firstRound = this.rounds[0];
    if (firstRound?.matches?.length) {
      this.totalRows = firstRound.matches.length * 2 - 1;
    }
  }

  ngAfterViewInit() {
    this.centerGrid();
    this.scheduleLineUpdate();

    if (this.modalComponent) {
      this.fullscreenSub = this.modalComponent.fullscreenToggle.subscribe(() => {
        setTimeout(() => {
          this.centerGrid();
          this.scheduleLineUpdate();
        }, 0);
      });
    }
  }

  getGridRow(colIndex: number, matchIndex: number): number {
    const spacing = Math.pow(2, colIndex);
    return matchIndex * spacing * 2 + spacing;
  }

  getGridColumn(roundIndex: number, matchIndex: number, matchesInRound: number): number {
    const totalRounds = this.rounds.length;
    if (!totalRounds) {
      return 1;
    }

    const totalColumns = totalRounds * 2 - 1;
    const isFinalRound = roundIndex === totalRounds - 1;

    if (isFinalRound) {
      return totalRounds;
    }

    const half = Math.ceil(matchesInRound / 2);
    if (matchIndex < half) {
      return roundIndex + 1;
    }

    return totalColumns - roundIndex;
  }

  getMatchClasses(roundIndex: number, matchIndex: number, matchesInRound: number) {
    const orientation = this.getMatchOrientation(roundIndex, matchIndex, matchesInRound);
    return {
      'match--left': orientation === 'left',
      'match--right': orientation === 'right',
      'match--final': orientation === 'final',
    };
  }

  shouldShowLeftConnector(roundIndex: number, matchIndex: number, matchesInRound: number): boolean {
    const orientation = this.getMatchOrientation(roundIndex, matchIndex, matchesInRound);
    if (orientation === 'left') {
      return roundIndex > 0;
    }

    if (orientation === 'final') {
      return roundIndex > 0;
    }

    return false;
  }

  shouldShowRightConnector(roundIndex: number, matchIndex: number, matchesInRound: number): boolean {
    const orientation = this.getMatchOrientation(roundIndex, matchIndex, matchesInRound);

    if (orientation === 'right') {
      return roundIndex > 0;
    }

    if (orientation === 'final') {
      if (roundIndex === 0) {
        return false;
      }

      const previousRound = this.rounds[roundIndex - 1];
      const matches = previousRound?.matches ?? [];
      const half = Math.floor(matches.length / 2);
      return matches.length - half > 0;
    }

    return false;
  }

  private getMatchOrientation(roundIndex: number, matchIndex: number, matchesInRound: number): 'left' | 'right' | 'final' {
    const totalRounds = this.rounds.length;
    if (!totalRounds) {
      return 'left';
    }

    const isFinalRound = roundIndex === totalRounds - 1;
    if (isFinalRound) {
      return 'final';
    }

    const half = Math.ceil(matchesInRound / 2);
    return matchIndex < half ? 'left' : 'right';
  }

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

  /** --- DRAG START --- */
  onDragStart(event: MouseEvent | TouchEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;

    this.isDragging = true;
    this.hasMoved = false;

    this.pendingDX = 0;
    this.pendingDY = 0; // ✅ reset totale

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.lastOffsetX = this.offsetX;
    this.lastOffsetY = this.offsetY;

    this.renderer.addClass(this.bracketContainer.nativeElement, 'dragging');

    if (!this.rafId) this.startAnimationLoop();
  }


  onDragMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const dx = clientX - this.dragStartX;
    const dy = clientY - this.dragStartY;

    if (!this.hasMoved && Math.hypot(dx, dy) < this.dragThreshold) return;
    this.hasMoved = true;

    this.pendingDX = dx;
    this.pendingDY = dy;
  }

  onDragEnd() {
    if (!this.hasMoved) {
      this.pendingDX = 0;
      this.pendingDY = 0;
    }

    this.isDragging = false;
    this.bracketGrid.nativeElement.style.transition = 'transform 0.25s ease-out';
    this.renderer.removeClass(this.bracketContainer.nativeElement, 'dragging');

    cancelAnimationFrame(this.rafId!);
    this.rafId = null;
  }

  /** --- ANIMATION FRAME LOOP --- */
  private startAnimationLoop() {
    const grid = this.bracketGrid.nativeElement;

    const loop = () => {
      if (this.isDragging) {
        // Evita di aggiornare se non c’è stato vero movimento
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
    // 🔹 Muove solo la griglia
    const grid = this.bracketGrid.nativeElement;
    grid.style.transform = `translate3d(${this.offsetX}px, ${this.offsetY}px, 0)`;

    // 🔹 Scala solo il wrapper
    const scaleLayer = this.bracketScale.nativeElement;
    scaleLayer.style.transform = `scale(${this.zoomLevel})`;
    scaleLayer.style.transformOrigin = 'center center';
  }

  centerGrid() {
    const container = this.bracketContainer.nativeElement;
    const grid = this.bracketGrid.nativeElement;

    const cWidth = container.clientWidth;
    const cHeight = container.clientHeight;
    const gWidth = grid.scrollWidth;
    const gHeight = grid.scrollHeight;

    this.offsetX = (cWidth - gWidth) / 2;
    this.offsetY = (cHeight - gHeight) / 2;
    this.applyTransform();
  }

  ngOnDestroy(): void {
    if (this.fullscreenSub) {
      this.fullscreenSub.unsubscribe();
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.updateLineTimeoutId) {
      clearTimeout(this.updateLineTimeoutId);
      this.updateLineTimeoutId = null;
    }
  }

  private scheduleLineUpdate() {
    if (this.updateLineTimeoutId) {
      clearTimeout(this.updateLineTimeoutId);
    }

    this.updateLineTimeoutId = setTimeout(() => {
      this.updateLine();
      this.updateLineTimeoutId = null;
    }, 0);
  }

  updateLine() {
    if (!this.bracketGrid) {
      return;
    }

    const gridEl = this.bracketGrid.nativeElement;
    const allMatches = Array.from(gridEl.querySelectorAll('.match')) as HTMLElement[];
    gridEl.querySelectorAll('.ver').forEach((verEl) => {
      const ver = verEl as HTMLElement;
      const parent = ver.parentElement as HTMLElement;
      if (!parent) return;

      const parentStyle = getComputedStyle(parent);
      const colStart = parseInt(parentStyle.getPropertyValue('grid-column-start')) || 0;
      const parentRect = parent.getBoundingClientRect();
      const parentCenterY = parentRect.top + parentRect.height / 2;

      const direction = ver.dataset['direction'] ?? 'left';
      const targetColumn = direction === 'right' ? colStart + 1 : colStart - 1;

      if (targetColumn <= 0) {
        ver.style.height = `${parentRect.height}px`;
        return;
      }

      const adjacentMatches = allMatches
        .filter((m) => {
          const cs = parseInt(getComputedStyle(m).getPropertyValue('grid-column-start')) || 0;
          return cs === targetColumn;
        })
        .map((matchEl) => {
          const rect = matchEl.getBoundingClientRect();
          return { top: rect.top, center: rect.top + rect.height / 2 };
        })
        .sort((a, b) => a.center - b.center);

      let above: { center: number } | null = null;
      let below: { center: number } | null = null;
      for (const item of adjacentMatches) {
        if (item.center < parentCenterY) above = item;
        else if (item.center >= parentCenterY && !below) below = item;
      }

      if (above && below) {
        const distance = Math.max(0, below.center - above.center);
        ver.style.height = `${distance}px`;
      } else {
        ver.style.height = `${parentRect.height}px`;
      }
    });
  }
}
