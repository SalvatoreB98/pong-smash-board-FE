import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MSG_TYPE } from '../app/utils/enum';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private isSmallLoadingSubject = new BehaviorSubject<boolean>(false);
  private toastSubject = new BehaviorSubject<{ message: string, type: MSG_TYPE } | null>(null);

  constructor(private translateService: TranslationService) { }

  isLoading$ = this.isLoadingSubject.asObservable();
  isSmallLoading$ = this.isSmallLoadingSubject.asObservable();
  toast$ = this.toastSubject.asObservable();

  startLoader() {
    this.isLoadingSubject.next(true);
  }

  addSpinnerToButton(buttonRef: HTMLElement) {
    if (buttonRef) {
      const spinner = document.createElement('span');
      spinner.className = 'loader-spinner';
      spinner.style.marginLeft = '8px';
      spinner.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.415, 31.415" transform="rotate(72 25 25)">
          <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
        </circle>
      </svg>
    `;
      buttonRef.appendChild(spinner);
    }
  }

  removeSpinnerFromButton(buttonRef: HTMLElement) {
    const spinner = buttonRef.querySelector('.loader-spinner');
    if (buttonRef && spinner) {
      buttonRef.removeChild(spinner);
    }
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
    this.toastSubject.next({ message: this.translateService.translate(message), type });

    setTimeout(() => {
      this.toastSubject.next(null);
    }, duration);

    setTimeout(() => {
      if (message.includes('not_enough_players')) {
        const button = document.getElementById('add-players-button');
        if (button) {
          button.classList.add('highlight');
        }
      }
    }, 1000);
  }
}
