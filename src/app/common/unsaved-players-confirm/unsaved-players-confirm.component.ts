import { Component, EventEmitter, Output, inject } from '@angular/core';
import { SHARED_IMPORTS } from '../imports/shared.imports';
import { ModalComponent } from '../modal/modal.component';
import { ModalService } from '../../../services/modal.service';
import { playersToAddStore } from '../../components/add-players-modal/add-players-modal.component';

@Component({
  selector: 'unsaved-players-confirm',
  imports: [SHARED_IMPORTS],
  templateUrl: './unsaved-players-confirm.component.html',
  styleUrl: './unsaved-players-confirm.component.scss'
})
export class UnsavedPlayersConfirmComponent extends ModalComponent {
  constructor(public override modalService: ModalService) {
    super(modalService);
  }
  @Output() confirmed = new EventEmitter<boolean>();
  @Output() cancelled = new EventEmitter<boolean>();

  get players() {
    return playersToAddStore();
  }
}
