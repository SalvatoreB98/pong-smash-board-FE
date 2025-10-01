import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SHARED_IMPORTS } from '../imports/shared.imports';
import { ModalComponent } from '../modal/modal.component';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'are-you-sure',
  imports: [SHARED_IMPORTS],
  templateUrl: './are-you-sure.component.html',
  styleUrl: './are-you-sure.component.scss'
})

export class AreYouSureComponent extends ModalComponent {
  constructor(public override modalService: ModalService) {
    super(modalService);
  }
  @Output() confirmed = new EventEmitter<boolean>();
  @Output() cancelled = new EventEmitter<boolean>();
  @Input() body: string = 'Are you sure you want to proceed?';
}
