import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, QueryList, ViewChildren, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { DropdownAction, DropdownService } from '../../../services/dropdown.service';

interface PanelStyles {
  top: string;
  left: string;
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
  panelStyles = signal<PanelStyles>({
    top: '0px',
    left: '0px'
  });

  @ViewChildren('menuItem') menuItems!: QueryList<ElementRef<HTMLButtonElement>>;

  private subscriptions = new Subscription();
  private triggerElement: HTMLElement | null = null;

  constructor(private dropdownService: DropdownService, private host: ElementRef<HTMLElement>) {
    this.subscriptions.add(
      this.dropdownService.state$.subscribe((state) => {
        if (!state) {
          this.closeMenu();
          return;
        }

        const top = state.event.clientY + 8;
        const left = state.event.clientX;
        this.triggerElement = state.trigger;

        this.actions.set(state.actions);
        this.panelStyles.set({
          top: `${top}px`,
          left: `${left}px`
        });
        this.isOpen.set(true);

        setTimeout(() => this.focusFirstItem());
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen()) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (this.host.nativeElement.contains(target)) {
      return;
    }

    if (this.triggerElement && this.triggerElement.contains(target)) {
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
    if (!this.isOpen()) {
      return;
    }
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

  private closeMenu() {
    this.isOpen.set(false);
    this.actions.set([]);
    this.panelStyles.set({ top: '0px', left: '0px' });
    this.triggerElement = null;
  }
}
