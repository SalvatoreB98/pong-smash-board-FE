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
import { TranslatePipe } from '../utils/translate.pipe';
import { BottomNavbarComponent } from '../common/bottom-navbar/bottom-navbar.component';
import { StatsComponent } from '../common/stats/stats.component';
import { inject } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [CommonModule, NavbarComponent, BottomNavbarComponent, MatchesComponent, AddMatchModalComponent, ModalComponent, ShowMatchModalComponent, TranslatePipe, StatsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private dataService = inject(DataService);
  matches$ = this.dataService.matchesObs;

  matches: any;
  isAddMatchModalOpen: boolean = false;
  isShowMatchModalOpen: boolean = false;
  clickedMatch: IMatch | undefined;

  constructor(public modalService: ModalService) {}

  ngOnInit() {
    this.dataService.fetchMatches({ ttlMs: 5 * 60 * 1000 }) // cache 5 minuti
    .then(res => this.matches = res.matches);
  }

  setClickedMatch(match: IMatch) {
    this.clickedMatch = match;
  }

}
