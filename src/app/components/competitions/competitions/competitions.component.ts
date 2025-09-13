import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { combineLatest, map, tap } from 'rxjs';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { NavbarComponent } from '../../../common/navbar/navbar.component';
import { ModalComponent } from '../../../common/modal/modal.component';
import { BottomNavbarComponent } from '../../../common/bottom-navbar/bottom-navbar.component';
import { AddCompetitionModalComponent } from '../add-competition-modal/add-competition-modal.component';
import { CompetitionStartComponent } from '../../profile/complete-profile/competition-start/competition-start.component';
import { MSG_TYPE, UserProgressStateEnum } from '../../../utils/enum';
import { CompetitionService } from '../../../../services/competitions.service';
import { ICompetition } from '../../../../api/competition.api';
import { UserService } from '../../../../services/user.service';
import { ModalService } from '../../../../services/modal.service';
import { CompetitionDetailComponent } from '../competition-detail/competition-detail.component';
import { AddPlayersModalComponent } from '../../add-players-modal/add-players-modal.component';
import { Utils } from '../../../utils/Utils';
import { JoinCompetitionModalComponent } from '../../join-competition-modal/join-competition-modal.component';
import { HttpClient } from '@angular/common/http';
import { API_PATHS } from '../../../../api/api.config';
import { LoaderService } from '../../../../services/loader.service';
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
    AddPlayersModalComponent,
    JoinCompetitionModalComponent
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
    type: '',
    setsType: 0,
    pointsType: 0,
    management: 'self'
  };
  form = new FormGroup({ name: new FormControl('') });

  constructor(
    public modalService: ModalService,
    private fb: FormBuilder,
    private http: HttpClient,
    private loaderService: LoaderService
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
  onDropdownAction(action: string, competition: any) {
    switch (action) {
      case 'edit':
        // logica edit
        break;
      case 'delete':
        this.http.delete('/api/delete-competition', {
          body: { competitionId: competition.id }
        }).subscribe({
          next: (res) => {
            console.log('Competition deleted', res);
            this.competitions$ = this.competitions$.pipe(
              map(competitions => competitions.filter((c: ICompetition) => c.id !== competition.id))
            );
            this.competitionService.getCompetitions();
            this.loaderService.showToast('delete_success', MSG_TYPE.SUCCESS);
          },
          error: (err) => {
            console.error('Error deleting competition', err);
            this.loaderService.showToast('delete_error', MSG_TYPE.ERROR);
          }
        });
        break;
      case 'details':
        // logica details
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
