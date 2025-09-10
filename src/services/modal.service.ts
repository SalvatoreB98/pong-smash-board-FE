import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MODALS } from '../app/utils/enum';

@Injectable({ providedIn: 'root' })
export class ModalService {

  private activeModalSubject = new BehaviorSubject<string | null>(null);

  activeModal$ = this.activeModalSubject.asObservable();
  public MODALS = MODALS;
  static MODALS: any;


  openModal(modalName: string): void {
    if (modalName) {
      this.activeModalSubject.next(modalName);
      this.setEffects();
    } else {
      console.error(`Modal name is required to open a modal. Control if the modal name exists in the MODALS enum and if component of the modal is present in the component and that there is the correct name on the click button es. (click)="modalService.openModal(modalService.MODALS['MODAL NAME'])"`);
    }
  }

  closeModal(): void {
    this.activeModalSubject.next(null);
    this.removeEffects();
  }

  isActiveModal(modalName: string): boolean {
    return this.activeModalSubject.value === modalName;
  }

  setEffects() {
    document?.querySelector('html')?.style.setProperty('overflow', 'hidden');
    document?.querySelector('html')?.style.setProperty('margin-right', '0.4375em');
    let wrapper = document.querySelector('.wrapper') as HTMLElement;
    wrapper?.style.setProperty('filter', 'blur(0.625em)');
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