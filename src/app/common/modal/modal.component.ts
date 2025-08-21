import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { TranslatePipe } from '../../utils/translate.pipe';

@Component({
  selector: 'app-modal',
  imports: [TranslatePipe, CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Input() label: string = '';
  constructor(public modalService: ModalService) { }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '/default-player.jpg';
  }
  closeModal(): void {
    this.modalService.closeModal();
  }
}