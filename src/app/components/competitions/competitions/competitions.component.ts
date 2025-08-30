import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { combineLatest, map, tap } from 'rxjs';
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
import { CompetitionDetailComponent } from '../competition-detail/competition-detail.component';
import { AddPlayersModalComponent } from '../../add-players-modal/add-players-modal.component';

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
    AddCompetitionModalComponent,
    CompetitionDetailComponent,
    AddPlayersModalComponent
  ],
  templateUrl: './competitions.component.html',
  styleUrls: ['./competitions.component.scss']
})
export class CompetitionsComponent {
  PROGRESS_STATE = UserProgressStateEnum;

  // services
  userService = inject(UserService);
  private competitionService = inject(CompetitionService);

  // streams
  userState$ = this.userService.getState();           // observable dallo user
  competitions$ = this.competitionService.list$;      // observable delle competizioni

  /** Stream con la competizione attiva (oppure null) */
  activeCompetition$ = combineLatest([this.userState$, this.competitions$]).pipe(
    map(([state, competitions]) => {
      return competitions.find(c => c.id === state.active_competition_id) ?? null;
    }),
    tap(c => console.log('Active competition:', c))
  );
  competitionDetail: ICompetition = {
    id: 0, name: '', description: '', start_date: '', end_date: '',
    type: '',
    setsType: 0,
    pointsType: 0
  };
  // form
  form = new FormGroup({ name: new FormControl('') });

  constructor(
    public modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.createForm();
  }

  ngOnInit() {
    // triggera il fetch delle competizioni → aggiorna lo store → la UI reagisce
    this.competitionService.load().subscribe((data) => {
      this.competitionDetail = data[0];
      console.log('[Competitions] competitions loaded', data);
    });
  }

  createForm() {
    this.form = this.fb.group({
      name: ['']
    });
  }

  trackById = (_: number, c: ICompetition) => c.id;
}
