import { Component } from '@angular/core';
import { MSG_TYPE } from '../../enum';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent {
  isLoading = false;
  isSmallLoading = false;
  toastMessage: string | null = null;
  toastClass: string = '';
  toastIcon: string = '';

  startLoader() {
    this.isLoading = true;
  }

  stopLoader() {
    this.isLoading = false;
  }

  startLittleLoader() {
    this.isSmallLoading = true;
  }

  stopLittleLoader() {
    this.isSmallLoading = false;
  }

  showToast(message: string, duration: number = 5000, type: MSG_TYPE) {
    this.toastMessage = message;
    this.toastClass = type.toLowerCase();
    this.toastIcon = type === MSG_TYPE.SUCCESS ? 'fa-circle-check' : 'fa-circle-xmark';

    setTimeout(() => this.closeToast(), duration);
  }

  closeToast() {
    this.toastMessage = null;
  }
}