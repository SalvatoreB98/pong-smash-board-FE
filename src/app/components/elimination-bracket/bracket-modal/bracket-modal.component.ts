import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  Renderer2,
  AfterViewInit,
} from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';

@Component({
  selector: 'app-bracket-modal',
  imports: [CommonModule, ...SHARED_IMPORTS],
  templateUrl: './bracket-modal.component.html',
  styleUrl: './bracket-modal.component.scss',
})
export class BracketModalComponent implements AfterViewInit {
  private _rounds: any[] = [];

  @Input()
  set rounds(value: any[]) {
    this.updateLine();
    this._rounds = value ?? [];
    const firstRound = this._rounds[0];
    if (firstRound?.matches?.length) {
      this.totalRows = firstRound.matches.length * 2 - 1;
    } else {
      this.totalRows = 1;
    }
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

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    const firstRound = this.rounds[0];
    if (firstRound?.matches?.length) {
      this.totalRows = firstRound.matches.length * 2 - 1;
    }
  }

  ngAfterViewInit() {
    this.centerGrid();
    this.updateLine();
  }

  getGridRow(colIndex: number, matchIndex: number): number {
    const spacing = Math.pow(2, colIndex);
    return matchIndex * spacing * 2 + spacing;
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
  updateLine() {
    const allMatches = Array.from(document.querySelectorAll('.match')) as HTMLElement[];
    document.querySelectorAll('.ver').forEach((verEl) => {
      const ver = verEl as HTMLElement;
      const parent = ver.parentElement as HTMLElement;
      if (!parent) return;

      const parentStyle = getComputedStyle(parent);
      const colStart = parseInt(parentStyle.getPropertyValue('grid-column-start')) || 0;
      const parentRect = parent.getBoundingClientRect();
      const parentCenterY = parentRect.top + parentRect.height / 2;

      // if there is no previous column, fallback to parent's height
      if (colStart <= 1) {
        ver.style.height = `${parentRect.height}px`;
        return;
      }

      // gather .ver elements from the previous column and compute their centers
      const prevVers = allMatches
        .filter((m) => {
          const cs = parseInt(getComputedStyle(m).getPropertyValue('grid-column-start')) || 0;
          return cs === colStart - 1;
        })
        .map((m) => m.querySelector('.ver') as HTMLElement)
        .filter(Boolean)
        .map((v) => {
          const r = v.getBoundingClientRect();
          return { el: v, top: r.top, center: r.top + r.height / 2, rect: r };
        })
        .sort((a, b) => a.center - b.center);

      // find the nearest previous .ver above and below the current match center
      let above: { center: number } | null = null;
      let below: { center: number } | null = null;
      for (const item of prevVers) {
        if (item.center < parentCenterY) above = item;
        else if (item.center >= parentCenterY && !below) below = item;
      }

      if (above && below) {
        const distance = Math.max(0, below.center - above.center);
        ver.style.height = `${distance}px`;
      } else {
        // fallback: use parent height if we cannot determine two connectors
      }
    });
  }
}
