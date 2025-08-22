import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MODALS } from '../app/utils/enum';
import { ModalComponent } from '../app/common/modal/modal.component';

@Injectable({ providedIn: 'root' })
export class ModalService {
  
  private activeModalSubject = new BehaviorSubject<string | null>(null);
  activeModal$ = this.activeModalSubject.asObservable();
  public MODALS = MODALS;
  static MODALS: any;


  openModal(modalName: string): void {
    this.activeModalSubject.next(modalName);
    this.setEffects();
  }

  closeModal(): void {
    this.activeModalSubject.next(null);
    this.removeEffects();
  }

  isActiveModal(modalName: string) {
    let isActive = false;
    this.activeModal$.subscribe(activeModal => {
      isActive = activeModal === modalName;
    });
    return isActive;
  }

  setEffects() {
    document?.querySelector('html')?.style.setProperty('overflow', 'hidden');
    document?.querySelector('html')?.style.setProperty('margin-right', '7px');
    let wrapper = document.querySelector('.wrapper') as HTMLElement;
    wrapper?.style.setProperty('filter', 'blur(10px)');
    wrapper?.style.setProperty('pointer-events', 'none');
    wrapper?.style.setProperty('user-select', 'none');
  }
  removeEffects() {
    document?.querySelector('html')?.style.removeProperty('overflow');
    document?.querySelector('html')?.style.setProperty('margin-right', '0');
    let wrapper = document.querySelector('.wrapper') as HTMLElement;
    wrapper.style.removeProperty('filter');
    wrapper.style.removeProperty('pointer-events');
    wrapper.style.removeProperty('user-select');
  }
}