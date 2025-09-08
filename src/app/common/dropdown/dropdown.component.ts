import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
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
  @Input() actions: DropdownAction[] = [];
  @Output() actionSelected = new EventEmitter<string>();

  isOpen = false;

  toggle() {
    this.isOpen = !this.isOpen;
  }

  select(action: string) {
    this.actionSelected.emit(action);
    this.isOpen = false;
  }

  // Close dropdown when clicking outside
  constructor() { }

  ngOnInit() { }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleDocumentClick, true);
  }

  ngAfterViewInit() {
    document.addEventListener('click', this.handleDocumentClick, true);
  }

  handleDocumentClick = (event: MouseEvent) => {
    const dropdownElement = (event.target as HTMLElement).closest('app-dropdown');
    if (!dropdownElement) {
      this.isOpen = false;
    }
  }
}
