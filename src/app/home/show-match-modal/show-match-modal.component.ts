import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { MODALS } from '../../utils/enum';

@Component({
  selector: 'app-show-match-modal',
  imports: [CommonModule],
  templateUrl: './show-match-modal.component.html',
  styleUrl: './show-match-modal.component.scss'
})
export class ShowMatchModalComponent {
  constructor(public modalService: ModalService) { }
  @Input() match: any;

  showModal(match: any): void {
    this.match = match;
  }

  closeModal(): void {
    this.modalService.closeModal();
  }
}
