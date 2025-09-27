import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface DropdownAction {
  value: string;
  label: string;
  icon?: string;
  danger?: boolean;
}

interface DropdownState {
  actions: DropdownAction[];
  anchor: HTMLElement;
}

@Injectable({ providedIn: 'root' })
export class DropdownService {
  private stateSubject = new BehaviorSubject<DropdownState | null>(null);
  readonly state$ = this.stateSubject.asObservable();
  static isOpen = false;
  private actionSubject = new Subject<string>();
  readonly action$ = this.actionSubject.asObservable();

  open(actions: DropdownAction[], anchor: HTMLElement) {
    const currentState = this.stateSubject.getValue();
    if (DropdownService.isOpen) {
      // Se l'anchor è diverso, apri semplicemente il nuovo menu senza chiudere prima
      if (currentState && currentState.anchor !== anchor) {
        this.stateSubject.next({ actions, anchor });
        return;
      }
      this.close();
      return;
    }
    if (!anchor) {
      return;
    }
    this.stateSubject.next({ actions, anchor });
    DropdownService.isOpen = true;
  }

  close() {
    this.stateSubject.next(null);
    DropdownService.isOpen = false;
  }

  emit(value: string) {
    this.actionSubject.next(value);
    this.close();
  }
}
