import { Component } from '@angular/core';
import { TranslatePipe } from '../../utils/translate.pipe';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-bottom-navbar',
  imports: [TranslatePipe],
  templateUrl: './bottom-navbar.component.html',
  styleUrl: './bottom-navbar.component.scss'
})
export class BottomNavbarComponent {
  constructor(private modalService: ModalService) {}  

  addMatchModal() {
    console.log('add match modal');
    this.modalService.openModal(this.modalService.MODALS['ADD_MATCH'])
  
  }
}
