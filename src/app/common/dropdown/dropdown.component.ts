import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { SHARED_IMPORTS } from '../imports/shared.imports';

export interface DropdownAction {
  label: string;
  icon?: string;   // opzionale (puoi usare un'icona svg o un'emoji)
  value: string;   // es. 'edit' | 'delete' | 'details'
}

@Component({
  selector: 'app-dropdown',
  imports: [SHARED_IMPORTS],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
})

export class DropdownComponent {
  private static nextId = 0;

  @Input() actions: DropdownAction[] = [];
  @Output() actionSelected = new EventEmitter<string>();

  isOpen = false;
  readonly menuId = `app-dropdown-menu-${DropdownComponent.nextId++}`;

  @ViewChild('triggerButton') triggerButton?: ElementRef<HTMLButtonElement>;
  @ViewChildren('menuButton') menuButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  constructor(private readonly hostElement: ElementRef<HTMLElement>) {}

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.focusFirstItem();
    } else {
      this.focusTrigger();
    }
  }

  open() {
    if (!this.isOpen) {
      this.isOpen = true;
      this.focusFirstItem();
    }
  }

  close(focusTrigger = false) {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    if (focusTrigger) {
      this.focusTrigger();
    }
  }

  onToggleClick() {
    this.toggle();
  }

  onTriggerKeydown(event: KeyboardEvent) {
    const { key } = event;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.toggle();
      return;
    }

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen) {
        this.open();
      }
      this.focusFirstItem();
    }

    if (key === 'Escape' && this.isOpen) {
      event.preventDefault();
      this.close(true);
    }
  }

  select(action: string) {
    this.actionSelected.emit(action);
    this.close(true);
  }

  onItemKeydown(event: KeyboardEvent, value: string) {
    const { key } = event;
    const buttons = this.menuButtons?.toArray() ?? [];
    const currentIndex = buttons.findIndex(
      (btn) => btn.nativeElement === event.currentTarget
    );

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.select(value);
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      this.close(true);
      return;
    }

    if (key === 'ArrowDown' && buttons.length > 0) {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % buttons.length;
      buttons[nextIndex]?.nativeElement.focus({ preventScroll: true });
      return;
    }

    if (key === 'ArrowUp' && buttons.length > 0) {
      event.preventDefault();
      const prevIndex =
        (currentIndex - 1 + buttons.length) % buttons.length;
      buttons[prevIndex]?.nativeElement.focus({ preventScroll: true });
    }
  }

  trackByValue = (_: number, action: DropdownAction) => action.value;

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: Event) {
    this.closeIfClickOutside(event);
  }

  @HostListener('document:touchstart', ['$event'])
  handleDocumentTouch(event: Event) {
    this.closeIfClickOutside(event);
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleDocumentEscape(event: KeyboardEvent) {
    if (this.isOpen) {
      event.preventDefault();
      this.close(true);
    }
  }

  private closeIfClickOutside(event: Event) {
    if (!this.isOpen) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target && !this.hostElement.nativeElement.contains(target)) {
      this.close();
    }
  }

  private focusFirstItem() {
    if (!this.menuButtons?.length) {
      return;
    }

    queueMicrotask(() => {
      this.menuButtons?.first?.nativeElement.focus({ preventScroll: true });
    });
  }

  private focusTrigger() {
    if (!this.triggerButton) {
      return;
    }

    queueMicrotask(() => {
      this.triggerButton?.nativeElement.focus({ preventScroll: true });
    });
  }
}
