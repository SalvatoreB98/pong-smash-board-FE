import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MSG_TYPE } from '../app/utils/enum';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private isSmallLoadingSubject = new BehaviorSubject<boolean>(false);
  private toastSubject = new BehaviorSubject<{ message: string, type: MSG_TYPE } | null>(null);

  isLoading$ = this.isLoadingSubject.asObservable();
  isSmallLoading$ = this.isSmallLoadingSubject.asObservable();
  toast$ = this.toastSubject.asObservable();

  startLoader() {
    this.isLoadingSubject.next(true);
  }

  stopLoader() {
    this.isLoadingSubject.next(false);
  }

  startLittleLoader() {
    this.isSmallLoadingSubject.next(true);
  }

  stopLittleLoader() {
    this.isSmallLoadingSubject.next(false);
    console.log('[LoaderService] stopLittleLoader');
  }

  showToast(message: string, type: MSG_TYPE, duration: number = 5000) {
    this.toastSubject.next({ message, type });

    setTimeout(() => {
      this.toastSubject.next(null);
    }, duration);
  }
}
