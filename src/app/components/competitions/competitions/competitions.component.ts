import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { combineLatest, map } from 'rxjs';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { ModalComponent } from '../../../common/modal/modal.component';
import { BottomNavbarComponent } from '../../../common/bottom-navbar/bottom-navbar.component';
import { AddCompetitionModalComponent } from '../add-competition-modal/add-competition-modal.component';
import { CompetitionStartComponent } from '../../profile/complete-profile/competition-start/competition-start.component';
import { UserProgressStateEnum } from '../../../utils/enum';
import { CompetitionService } from '../../../../services/competitions.service';
import { CompetitionType, ICompetition } from '../../../../api/competition.api';
import { UserService } from '../../../../services/user.service';
import { ModalService } from '../../../../services/modal.service';
import { CompetitionDetailComponent } from '../competition-detail/competition-detail.component';
import { AddPlayersModalComponent } from '../../add-players-modal/add-players-modal.component';
import { Utils } from '../../../utils/Utils';
import { JoinCompetitionModalComponent } from '../../join-competition-modal/join-competition-modal.component';
import { ViewCompetitionModalComponent } from './view-competition-modal/view-competition-modal.component';
import { EditCompetitionModalComponent } from './edit-competition-modal/edit-competition-modal.component';
@Component({
  selector: 'app-competitions',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    ModalComponent,
    FormsModule,
    BottomNavbarComponent,
    CompetitionStartComponent,
    AddCompetitionModalComponent,
    CompetitionDetailComponent,
    AddPlayersModalComponent,
    JoinCompetitionModalComponent,
    ViewCompetitionModalComponent,
    EditCompetitionModalComponent
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
  activeCompetition$ = this.competitionService.activeCompetition$;

  competitionDetail: ICompetition = {
    id: 0, name: '', description: '', start_date: '', end_date: '',
    type: 'league' as CompetitionType,
    setsType: 0,
    pointsType: 0,
    management: 'self'
  };
  form = new FormGroup({ name: new FormControl('') });

  constructor(
    public modalService: ModalService,
    private fb: FormBuilder,
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.competitionService.getCompetitions().then((data) => {
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

  normalizeDate(date: string = ''): string {
    return Utils.normalizeDate(date) || '';
  }
  hasCompetitions(competitions: ICompetition[] = []): boolean {
    return competitions.length > 0;
  }
  hasPlayers(players: any[] = []): boolean {
    return players.length > 0;
  }
  onDropdownAction(action: string, competition: ICompetition) {
    if (!competition?.id) {
      return;
    }

    switch (action) {
      case 'edit':
        this.modalService.openModal('editCompetitionModal');
        this.competitionDetail = competition;
        break;
      case 'favorite':
        this.competitionService.updateActiveCompetition(competition.id).subscribe();
        break;
      case 'delete':
        this.competitionService.remove(competition.id).subscribe(() => {
          this.competitionService.getCompetitions(true);
        });
        break;
      case 'details':
        this.modalService.openModal('viewCompetitionModal');
        this.competitionDetail = competition;
        break;
    }
  }

  competitionsWithoutActive$ = combineLatest([
    this.competitionService.list$,
    this.competitionService.activeCompetition$
  ]).pipe(
    map(([competitions, active]) =>
      competitions.filter(c => c.id !== active?.id)
    )
  );

}
