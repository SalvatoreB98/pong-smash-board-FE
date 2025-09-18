import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-player-detail',
  templateUrl: './player-detail.component.html',
  imports: [],
  styleUrls: ['./player-detail.component.scss'],
  standalone: true,
})
export class PlayerDetailComponent {
  @Input() player!: string;
  @Input() totalPlayed = 0;
  @Input() wins = 0;
  @Input() winRate = 0; // percentuale winrate
  @Input() monthlyWinRates: { [month: string]: number } = {};
  @Input() badges: string[] = [];


  MONTH_MAP: Record<string, string> = {
    '01': 'Gennaio',
    '02': 'Febbraio',
    '03': 'Marzo',
    '04': 'Aprile',
    '05': 'Maggio',
    '06': 'Giugno',
    '07': 'Luglio',
    '08': 'Agosto',
    '09': 'Settembre',
    '10': 'Ottobre',
    '11': 'Novembre',
    '12': 'Dicembre',
  };





  getMonthLabel(month: string) {
    return this.MONTH_MAP[month]?.slice(0, 3) || month;
  }
}
