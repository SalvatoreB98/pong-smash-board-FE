import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
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
  @Input() isSmall: boolean = false;
  @Input() fullscreen: boolean = false;
  @Input() transparent = false;
  @Output() closeModalEvent = new EventEmitter<void>();

  constructor(public modalService: ModalService) { }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '/default-player.jpg';
  }

  closeModal(): void {
    this.modalService.closeModal();
    this.closeModalEvent.emit();
  }
  toggleFullscreen(): void {
    this.fullscreen = !this.fullscreen;
  }
}