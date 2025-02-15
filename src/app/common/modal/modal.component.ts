import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  constructor(public modalService: ModalService) { }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '/default-player.jpg';
  }
  closeModal(): void {
    this.modalService.closeModal();
  }
}