import { Component } from '@angular/core';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { MatchesComponent } from './matches/matches.component';
import { IMatch } from '../interfaces/matchesInterfaces';
import { IMatchResponse } from '../interfaces/responsesInterfaces';
import { DataService } from '../../services/data.service';
import { AddMatchModalComponent } from './add-match-modal/add-match-modal.component';

@Component({
  selector: 'app-home',
  imports: [NavbarComponent, MatchesComponent, AddMatchModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  matches: any;
  isAddMatchModalOpen: boolean = false;
  
  constructor(private dataService: DataService) {
    this.dataService.fetchDataAndCalculateStats().then((res: any) => {
      this.matches = res.matches;
    });
  }
  closeModal() {
    this.isAddMatchModalOpen = false;
  }
  openModal() {
    this.isAddMatchModalOpen = true;
  }
}
