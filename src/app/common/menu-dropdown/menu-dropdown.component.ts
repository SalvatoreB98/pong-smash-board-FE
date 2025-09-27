import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, signal, ViewChildren, QueryList } from '@angular/core';
import { Subscription, fromEvent, merge } from 'rxjs';
import { DropdownAction, DropdownService } from '../../../services/dropdown.service';

interface PanelStyles {
  top: string;
  left: string;
  transformOrigin: string;
}

@Component({
  selector: 'app-menu-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-dropdown.component.html',
  styleUrl: './menu-dropdown.component.scss'
})
export class MenuDropdownComponent implements OnDestroy {
  actions = signal<DropdownAction[]>([]);
  isOpen = signal(false);
  panelStyles = signal<PanelStyles>({ top: '0px', left: '0px', transformOrigin: 'top right' });

  @ViewChildren('menuItem') menuItems!: QueryList<ElementRef<HTMLButtonElement>>;

  private anchor?: HTMLElement;
  private subscriptions = new Subscription();

  constructor(private dropdownService: DropdownService, private host: ElementRef<HTMLElement>) {
    this.subscriptions.add(
      this.dropdownService.state$.subscribe((state) => {
        if (state) {
          this.actions.set(state.actions);
          this.anchor = state.anchor;
          this.isOpen.set(true);
          setTimeout(() => {
            this.updatePosition();
            this.focusFirstItem();
          });
        } else {
          this.isOpen.set(false);
          this.actions.set([]);
          this.anchor = undefined;
        }
      })
    );

    const resize$ = fromEvent(window, 'resize');
    const scroll$ = fromEvent(window, 'scroll', { capture: true });

    this.subscriptions.add(
      merge(resize$, scroll$).subscribe(() => this.updatePosition())
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.isOpen()) {
      return;
    }

    const target = event.target as HTMLElement;
    if (this.host.nativeElement.contains(target) || this.anchor?.contains(target)) {
      return;
    }

    this.dropdownService.close();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (!this.isOpen()) {
      return;
    }

    if (event.key === 'Escape') {
      this.dropdownService.close();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocus(event.key === 'ArrowDown' ? 1 : -1);
    }
  }

  onActionSelected(value: string) {
    this.dropdownService.emit(value);
  }

  trackByValue = (_: number, action: DropdownAction) => action.value;

  private focusFirstItem() {
    const first = this.menuItems?.first?.nativeElement;
    first?.focus();
  }

  private moveFocus(direction: 1 | -1) {
    const items = this.menuItems?.toArray().map(item => item.nativeElement) ?? [];
    if (!items.length) {
      return;
    }

    const activeIndex = items.findIndex((item) => item === document.activeElement);
    const nextIndex = activeIndex === -1
      ? (direction === 1 ? 0 : items.length - 1)
      : (activeIndex + direction + items.length) % items.length;

    items[nextIndex].focus();
  }

  private updatePosition() {
    if (!this.isOpen() || !this.anchor) {
      return;
    }

    const panel = this.host.nativeElement.querySelector('.menu-dropdown__panel') as HTMLElement | null;
    if (!panel) {
      return;
    }

    const anchorRect = this.anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    let top = anchorRect.bottom + 8;
    let left = anchorRect.right - panelRect.width;
    let transformOrigin: PanelStyles['transformOrigin'] = 'top right';

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 16) {
      left = Math.max(16, anchorRect.left);
      transformOrigin = 'top left';
    } else if (left + panelRect.width > viewportWidth - 16) {
      left = viewportWidth - panelRect.width - 16;
      transformOrigin = 'top right';
    }

    if (top + panelRect.height > viewportHeight - 16) {
      const abovePosition = anchorRect.top - panelRect.height - 8;
      if (abovePosition >= 16) {
        top = abovePosition;
        transformOrigin = transformOrigin.replace('top', 'bottom') as PanelStyles['transformOrigin'];
      }
    }

    top = Math.max(16, top);

    this.panelStyles.set({
      top: `${top}px`,
      left: `${left}px`,
      transformOrigin
    });
  }
}
