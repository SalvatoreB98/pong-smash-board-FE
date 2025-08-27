import { Component, inject } from '@angular/core';
import { NavbarComponent } from '../../../common/navbar/navbar.component';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { ModalService } from '../../../../services/modal.service';
import { ModalComponent } from '../../../common/modal/modal.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { AddCompetitionModalComponent } from '../add-competition-modal/add-competition-modal.component';
import { BottomNavbarComponent } from '../../../common/bottom-navbar/bottom-navbar.component';
import { CompetitionsService, ICompetition } from '../../../../services/competitions.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { IUserState } from '../../../../services/interfaces/Interfaces';
import { UserService } from '../../../../services/user.service';
import { UserProgressStateEnum } from '../../../utils/enum';
import { CompetitionStartComponent } from '../../profile/complete-profile/competition-start/competition-start.component';

@Component({
  selector: 'app-competitions',
  imports: [
    NavbarComponent,
    TranslatePipe,
    ModalComponent,
    CommonModule,
    FormsModule,
    AddCompetitionModalComponent,
    BottomNavbarComponent,
    CompetitionStartComponent
  ],
  templateUrl: './competitions.component.html',
  styleUrl: './competitions.component.scss'
})
export class CompetitionsComponent {

  private userService = inject(UserService);
  public userState = toSignal<IUserState | null>(this.userService.userState$(), { initialValue: null });
  PROGRESS_STATE = UserProgressStateEnum;
  
  loading = true;
  error: string | null = null;
  competitions: ICompetition[] = [];
  form = new FormGroup({ name: new FormControl('') });
  constructor(public modalService: ModalService, private fb: FormBuilder, private competitionsService: CompetitionsService) {
    this.createForm();
    this.competitionsService.getCompetitions().then((res) => {
      console.log('Competitions fetched:', res);
      this.competitions = res.competitions;
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
