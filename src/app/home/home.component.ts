import { Component } from '@angular/core';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { MatchesComponent } from './matches/matches.component';
import { IMatch } from '../interfaces/matchesInterfaces';
import { IMatchResponse } from '../interfaces/responsesInterfaces';
import { DataService } from '../../services/data.service';
import { AddMatchModalComponent } from './add-match-modal/add-match-modal.component';
import { ModalComponent } from '../common/modal/modal.component';
import { ShowMatchModalComponent } from './show-match-modal/show-match-modal.component';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { MODALS } from '../utils/enum';

@Component({
  selector: 'app-home',
  imports: [CommonModule, NavbarComponent, MatchesComponent, AddMatchModalComponent, ModalComponent, ShowMatchModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  matches: any;
  isAddMatchModalOpen: boolean = false;
  isShowMatchModalOpen: boolean = false;
  clickedMatch: IMatch | undefined;
  constructor(private dataService: DataService, public modalService: ModalService) {
    this.dataService.fetchDataAndCalculateStats().then((res: any) => {
      this.matches = res.matches;
    });
  }

  setClickedMatch(match: IMatch) {
    this.clickedMatch = match;
  }

}
