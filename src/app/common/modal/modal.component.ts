import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { TranslatePipe } from '../../utils/translate.pipe';

@Component({
  selector: 'app-modal',
  imports: [TranslatePipe, CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {

  @Input() modalName!: string;
  @ViewChild('modalRef') modalRef!: ElementRef;
  @Input() label: string = '';

  constructor(public modalService: ModalService) { }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '/default-player.jpg';
  }
  closeModal(): void {
    this.modalService.closeModal();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    console.log('Document clicked:', event);
    const target = event.target as HTMLElement;

    if (this.modalService.isActiveModal(this.modalName)) {
      if (this.modalRef && !this.modalRef.nativeElement.contains(target)) {
        this.closeModal();
      }
    }
  }
}