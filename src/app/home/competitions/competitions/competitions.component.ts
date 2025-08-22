import { Component } from '@angular/core';
import { NavbarComponent } from '../../../common/navbar/navbar.component';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { ModalService } from '../../../../services/modal.service';
import { ModalComponent } from '../../../common/modal/modal.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { AddCompetitionModalComponent } from '../add-competition-modal/add-competition-modal.component';
import { BottomNavbarComponent } from '../../../common/bottom-navbar/bottom-navbar.component';

@Component({
  selector: 'app-competitions',
  imports: [
    NavbarComponent,
    TranslatePipe,
    ModalComponent,
    CommonModule,
    FormsModule,
    AddCompetitionModalComponent,
    BottomNavbarComponent
  ],
  templateUrl: './competitions.component.html',
  styleUrl: './competitions.component.scss'
})
export class CompetitionsComponent {
  form = new FormGroup({ name: new FormControl('') });
  constructor(public modalService: ModalService, private fb: FormBuilder) {
    this.createForm();
  }

  createForm() {
    this.form = this.fb.group({
      name: ['']
    });
  }
}
