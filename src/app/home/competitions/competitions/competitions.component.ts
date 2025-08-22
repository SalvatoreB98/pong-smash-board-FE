import { Component } from '@angular/core';
import { NavbarComponent } from '../../../common/navbar/navbar.component';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { ModalService } from '../../../../services/modal.service';
import { ModalComponent } from '../../../common/modal/modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-competitions',
  imports: [NavbarComponent, TranslatePipe, ModalComponent, CommonModule],
  templateUrl: './competitions.component.html',
  styleUrl: './competitions.component.scss'
})
export class CompetitionsComponent {
  constructor(public modalService: ModalService) { }
}
