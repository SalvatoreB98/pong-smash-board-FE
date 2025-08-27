import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { NavbarComponent } from '../../../common/navbar/navbar.component';
import { ModalComponent } from '../../../common/modal/modal.component';
import { BottomNavbarComponent } from '../../../common/bottom-navbar/bottom-navbar.component';
import { AddCompetitionModalComponent } from '../add-competition-modal/add-competition-modal.component';
import { CompetitionStartComponent } from '../../profile/complete-profile/competition-start/competition-start.component';
import { UserProgressStateEnum } from '../../../utils/enum';
import { CompetitionService } from '../../../../services/competitions.service';
import { ICompetition } from '../../../../api/competition.api';
import { UserService } from '../../../../services/user.service';
import { ModalService } from '../../../../services/modal.service';

@Component({
  selector: 'app-competitions',
  standalone: true,
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
  styleUrls: ['./competitions.component.scss']
})
export class CompetitionsComponent {
  PROGRESS_STATE = UserProgressStateEnum;

  // streams
  userService = inject(UserService);
  userState$ = this.userService.getState();           // observable dallo user
  competitions$ = inject(CompetitionService).list$;   // observable delle competizioni

  // form
  form = new FormGroup({ name: new FormControl('') });

  constructor(
    public modalService: ModalService,
    private fb: FormBuilder,
    private competitionService: CompetitionService
  ) {
    this.createForm();
  }

  ngOnInit() {
    // triggera il fetch delle competizioni → aggiorna lo store → la UI reagisce
    this.competitionService.load().subscribe();
  }

  createForm() {
    this.form = this.fb.group({
      name: ['']
    });
  }

  trackById = (_: number, c: ICompetition) => c.id;
}
