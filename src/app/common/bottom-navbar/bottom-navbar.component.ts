import { Component } from '@angular/core';
import { TranslatePipe } from '../../utils/translate.pipe';
import { ModalService } from '../../../services/modal.service';
import { SHARED_IMPORTS } from '../imports/shared.imports';

@Component({
  selector: 'app-bottom-navbar',
  imports: [...SHARED_IMPORTS],
  templateUrl: './bottom-navbar.component.html',
  styleUrl: './bottom-navbar.component.scss'
})
export class BottomNavbarComponent {
  constructor(private modalService: ModalService) {}  

  addMatchModal() {
    this.modalService.openModal(this.modalService.MODALS['ADD_MATCH'])
  }
}
