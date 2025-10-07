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
  event: MouseEvent;
  trigger: HTMLElement;
}

@Injectable({ providedIn: 'root' })
export class DropdownService {
  private stateSubject = new BehaviorSubject<DropdownState | null>(null);
  readonly state$ = this.stateSubject.asObservable();
  static isOpen = false;
  private actionSubject = new Subject<string>();
  readonly action$ = this.actionSubject.asObservable();

  open(actions: DropdownAction[], event: MouseEvent) {
    const trigger = event.currentTarget as HTMLElement | null;
    if (!trigger) {
      return;
    }
    const currentState = this.stateSubject.getValue();
    if (DropdownService.isOpen) {
      const previousTrigger = currentState?.trigger;
      if (previousTrigger && previousTrigger !== trigger) {
        this.stateSubject.next({ actions, event, trigger });
        DropdownService.isOpen = true;
        return;
      }
      this.close();
      return;
    }
    this.stateSubject.next({ actions, event, trigger });
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
