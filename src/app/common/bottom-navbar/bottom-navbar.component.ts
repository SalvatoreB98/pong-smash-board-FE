import { Component } from '@angular/core';
import { TranslatePipe } from '../../utils/translate.pipe';
import { ModalService } from '../../../services/modal.service';
import { SHARED_IMPORTS } from '../imports/shared.imports';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-bottom-navbar',
  imports: [...SHARED_IMPORTS],
  templateUrl: './bottom-navbar.component.html',
  styleUrl: './bottom-navbar.component.scss'
})
export class BottomNavbarComponent {

  activeModal: boolean | undefined;

  constructor(public modalService: ModalService) {

  }

  ngOnInit() {
    this.modalService.activeModal$.subscribe(modalName => {
      this.activeModal = modalName ? true : false;
    });
  }

  addMatchModal() {
    this.modalService.openModal(this.modalService.MODALS['ADD_MATCH'])
  }
  isActive(route: string): boolean {
    return window.location.href.includes(route);
  }
}
