import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../services/data.service';
import { CommonModule } from '@angular/common';
import { RankingService } from '../../../services/ranking.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { Match, PlayerStanding, HeadToHeadRow } from '../../interfaces/statsInterfaces';
import { TranslatePipe } from '../../utils/translate.pipe';
import { SHARED_IMPORTS } from '../imports/shared.imports';

type StandingsType = 'WINRATE' | 'WINS';


@Component({
  selector: 'app-stats',
  imports: [...SHARED_IMPORTS],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  private dataService = inject(DataService);
  private rankingService = inject(RankingService);

  headToHead$ = this.dataService.matchesObs.pipe(
    map(matches => this.calculateHeadToHead(matches.map(match => ({
      ...match,
      p1: match.player1_score,
      p2: match.player2_score
    }))))
  );

  // dati “materializzati” (non observable)
  wins: Record<string, number> = {};
  totPlayed: Record<string, number> = {};
  points: Record<string, number> = {};
  matches: Match[] = [];

  standingsType: StandingsType = 'WINRATE';

  // per il template
  standings: PlayerStanding[] = [];
  headToHeadData: HeadToHeadRow[] = [];
  players: string[] | undefined;

  constructor() {

  }

  async ngOnInit() {
    // prendo i dati dal tuo service (la tua API Promise resta com’è)
    const res = await this.rankingService.getRanking();
    this.standings = res.ranking.map(item => ({
      id: item.id, // ensure id is present
      image_url: item.image_url || '/default-player.jpg', // placeholder se non c'è
      playerName: item.nickname,
      wins: item.wins,
      lost: item.played - item.wins || 0,
      totalPlayed: item.played,
      winRate: item.winrate ?? 0,
      rating: item.rating || 0
    }));
  }

  // se vuoi cambiare classifica (es. con bottoni), richiami questa
  setStandingsType(type: StandingsType) {
    this.standingsType = type;
    this.recalcAll();
  }

  private recalcAll() {
    this.standings = this.calculateClassifica(this.standingsType);
    this.headToHeadData = this.calculateHeadToHead(
      (this.dataService.matches || []).map(match => ({
        ...match,
        p1: match.player1_score,
        p2: match.player2_score
      }))
    );
  }

  private calculateClassifica(standingsType: StandingsType): PlayerStanding[] {
    /** IMPLEMENTAZIONE */
    return this.standings;
  }

  private calculateHeadToHead(matches: Match[]): HeadToHeadRow[] {
    const headToHead: Record<string, HeadToHeadRow> = {};

    (matches || []).forEach(match => {
      const { player1_name, player2_name, player1_img, player2_img } = match;
      const p1 = parseInt(String(match.player1_score), 10) || 0;
      const p2 = parseInt(String(match.player2_score), 10) || 0;

      // ordino solo i nomi per la chiave
      const [a, b] = [player1_name, player2_name].sort();
      const key = `${a}-${b}`;

      if (!headToHead[key]) {
        headToHead[key] = {
          player1: player1_name,
          player2: player2_name,
          scored1: 0,
          scored2: 0,
          player1_img,
          player2_img
        };
      }

      if (player1_name === headToHead[key].player1) {
        headToHead[key].scored1 += p1;
        headToHead[key].scored2 += p2;
      } else {
        headToHead[key].scored1 += p2;
        headToHead[key].scored2 += p1;
      }
    });

    return Object.values(headToHead);
  }


  // helpers per il template
  trackByPlayer(_i: number, p: PlayerStanding) { return p.nickname; }
  winRateLabel(v: number) { return Math.max(0, Math.min(100, v)).toFixed(1) + '%'; }
  barWidthPct(v: number) { return Math.max(0, Math.min(100, v)); } // numero per [style.width.%]
  barColor(v: number) {
    const frac = Math.max(0, Math.min(100, v)) / 100;
    const r = Math.round(255 * (1 - frac));
    const g = Math.round(255 * frac);
    return `rgb(${r}, ${g}, 0)`;
  }
}
