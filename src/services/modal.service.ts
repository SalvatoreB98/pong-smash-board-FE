import { Injectable, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MODALS } from '../app/utils/enum';

type ModalComponentType = Type<unknown> & { modalName?: string; MODAL_NAME?: string };

@Injectable({ providedIn: 'root' })
export class ModalService {
  [x: string]: any;

  private activeModalSubject = new BehaviorSubject<string | null>(null);
  private modalContextSubject = new BehaviorSubject<unknown>(null);

  activeModal$ = this.activeModalSubject.asObservable();
  modalContext$ = this.modalContextSubject.asObservable();
  public MODALS = MODALS;
  static MODALS: any;

  openModal(modal: string | ModalComponentType, context?: unknown): void {
    if (typeof modal === 'string') {
      this.setActiveModal(modal, context);
      return;
    }

    const componentModalName = modal?.modalName ?? modal?.MODAL_NAME ?? null;
    if (componentModalName) {
      this.setActiveModal(componentModalName, context);
    } else {
      console.error(`Modal name is required to open a modal. Control if the modal name exists in the MODALS enum and if component of the modal is present in the component and that there is the correct name on the click button es. (click)="modalService.openModal(modalService.MODALS['MODAL NAME'])"`);
    }
  }

  closeModal(): void {
    this.activeModalSubject.next(null);
    this.modalContextSubject.next(null);
    this.removeEffects();
  }

  isActiveModal(modalName: string): boolean {
    return this.activeModalSubject.value === modalName;
  }

  getContext<T = unknown>(): T | null {
    return (this.modalContextSubject.value as T | null) ?? null;
  }

  private setActiveModal(modalName: string, context?: unknown): void {
    if (modalName) {
      this.modalContextSubject.next(context ?? null);
      this.activeModalSubject.next(modalName);
      this.setEffects();
    } else {
      console.error(`Modal name is required to open a modal. Control if the modal name exists in the MODALS enum and if component of the modal is present in the component and that there is the correct name on the click button es. (click)="modalService.openModal(modalService.MODALS['MODAL NAME'])"`);
    }
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
    if (wrapper) {
      wrapper.style.removeProperty('filter');
      wrapper.style.removeProperty('pointer-events');
      wrapper.style.removeProperty('user-select');
    }
  }
}