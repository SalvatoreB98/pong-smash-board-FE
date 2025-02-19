import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { MODALS } from '../../utils/enum';
import { ModalComponent } from '../../common/modal/modal.component';
import { TranslatePipe } from '../../utils/translate.pipe';

@Component({
  selector: 'app-show-match-modal',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './show-match-modal.component.html',
  styleUrl: './show-match-modal.component.scss'
})
export class ShowMatchModalComponent extends ModalComponent {
  constructor(public override modalService: ModalService) { 
    super(modalService);
  }
  @Input() match: any;

  showModal(match: any): void {
    this.match = match;
  }
}
