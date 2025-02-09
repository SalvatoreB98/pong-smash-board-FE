import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

Injectable({ providedIn: 'root' })
export class ModalService {
  private activeModalSubject = new BehaviorSubject<string | null>(null);
  activeModal$ = this.activeModalSubject.asObservable();

  openModal(modalName: string): void {
    this.activeModalSubject.next(modalName);
  }

  closeModal(): void {
    this.activeModalSubject.next(null);
  }
}