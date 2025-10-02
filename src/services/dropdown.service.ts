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
  private actionSubject = new Subject<string>();
  readonly action$ = this.actionSubject.asObservable();

  open(actions: DropdownAction[], anchor: HTMLElement) {
    if (!anchor) {
      return;
    }
    const currentState = this.stateSubject.getValue();
    if (currentState && currentState.anchor === anchor) {
      this.close();
      return;
    }

    this.stateSubject.next({ actions, anchor });
  }

  close() {
    this.stateSubject.next(null);
  }

  emit(value: string) {
    this.actionSubject.next(value);
    this.close();
  }
}
