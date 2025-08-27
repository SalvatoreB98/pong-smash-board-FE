import { Component, inject } from '@angular/core';
import { NavbarComponent } from '../../../common/navbar/navbar.component';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { ModalService } from '../../../../services/modal.service';
import { ModalComponent } from '../../../common/modal/modal.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { AddCompetitionModalComponent } from '../add-competition-modal/add-competition-modal.component';
import { BottomNavbarComponent } from '../../../common/bottom-navbar/bottom-navbar.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserProgressStateEnum } from '../../../utils/enum';
import { CompetitionStartComponent } from '../../profile/complete-profile/competition-start/competition-start.component';
import { CompetitionService } from '../../../../services/competitions.service';
import { ICompetition } from '../../../../api/competition.api';
import { UserService } from '../../../../services/user.service';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';

@Component({
  selector: 'app-competitions',
  imports: [
    ...SHARED_IMPORTS,
    NavbarComponent,
    ModalComponent,
    FormsModule,
    BottomNavbarComponent,
    CompetitionStartComponent,
    AddCompetitionModalComponent
  ],
  templateUrl: './competitions.component.html',
  styleUrl: './competitions.component.scss'
})
export class CompetitionsComponent {

  PROGRESS_STATE = UserProgressStateEnum;
  
  loading = true;
  error: string | null = null;
  competitions: ICompetition[] = [];
  form = new FormGroup({ name: new FormControl('') });
  
  userService = inject(UserService);
  userState$ = this.userService.getState();

  constructor(public modalService: ModalService, private fb: FormBuilder, private competitionsService: CompetitionService) {
    this.createForm();
    this.competitionsService.getCompetitions().then((res) => {
      console.log('Competitions fetched:', res);
      this.competitions = res;
      this.loading = false;
    });

  }

  ngOnInit() {
  }

  createForm() {
    this.form = this.fb.group({
      name: ['']
    });
  }

  trackById = (_: number, c: ICompetition) => c.id;

}
