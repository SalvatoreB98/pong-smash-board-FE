import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../services/data.service';

type StandingsType = 'WINRATE' | 'WINS';

interface Match {
  giocatore1: string;
  giocatore2: string;
  p1: number | string;
  p2: number | string;
}

interface PlayerStanding {
  playerName: string;
  wins: number;
  lost: number;
  totalPlayed: number;
  winRate: number; // 0..100
}

interface HeadToHeadRow {
  player1: string;
  player2: string;
  scored1: number;
  scored2: number;
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  // dati “materializzati” (non observable)
  wins: Record<string, number> = {};
  totPlayed: Record<string, number> = {};
  points: Record<string, number> = {};
  matches: Match[] = [];

  standingsType: StandingsType = 'WINRATE';

  // per il template
  standings: PlayerStanding[] = [];
  headToHeadData: HeadToHeadRow[] = [];

  constructor(private dataService: DataService) {}

  async ngOnInit() {
    // prendo i dati dal tuo service (la tua API Promise resta com’è)
    const res = await this.dataService.fetchDataAndCalculateStats();
    this.wins = res.wins || {};
    this.totPlayed = res.totPlayed || {};
    this.points = (res.points as any) || {};
    this.matches = (res.matches as any) || [];

    // calcolo una volta
    this.recalcAll();
  }

  // se vuoi cambiare classifica (es. con bottoni), richiami questa
  setStandingsType(type: StandingsType) {
    this.standingsType = type;
    this.recalcAll();
  }

  private recalcAll() {
    this.standings = this.calculateClassifica(this.standingsType);
    this.headToHeadData = this.calculateHeadToHead(this.matches);
  }

  private calculateClassifica(standingsType: StandingsType): PlayerStanding[] {
    const players: PlayerStanding[] = Object.keys(this.wins).map(player => {
      const w = this.wins[player] ?? 0;
      const tp = this.totPlayed[player] ?? 0;
      const lost = Math.max(tp - w, 0);
      const winRate = (this.points[player] ?? 0) * 100; // 0..100
      return { playerName: player, wins: w, lost, totalPlayed: tp, winRate };
    });

    if (standingsType === 'WINRATE') {
      players.sort((a, b) => b.winRate - a.winRate);
    } else {
      players.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        const ar = a.wins / (a.lost || 1);
        const br = b.wins / (b.lost || 1);
        return br - ar;
      });
    }
    return players;
  }

  private calculateHeadToHead(matches: Match[]): HeadToHeadRow[] {
    const headToHead: Record<string, HeadToHeadRow> = {};
    (matches || []).forEach(match => {
      const { giocatore1, giocatore2 } = match;
      const p1 = parseInt(String(match.p1), 10) || 0;
      const p2 = parseInt(String(match.p2), 10) || 0;
      const [a, b] = [giocatore1, giocatore2].sort();
      const key = `${a}-${b}`;
      if (!headToHead[key]) headToHead[key] = { player1: a, player2: b, scored1: 0, scored2: 0 };
      if (a === giocatore1) { headToHead[key].scored1 += p1; headToHead[key].scored2 += p2; }
      else { headToHead[key].scored1 += p2; headToHead[key].scored2 += p1; }
    });
    return Object.values(headToHead);
  }

  // helpers per il template
  trackByPlayer(_i: number, p: PlayerStanding) { return p.playerName; }
  winRateLabel(v: number) { return Math.max(0, Math.min(100, v)).toFixed(1) + '%'; }
  barWidthPct(v: number) { return Math.max(0, Math.min(100, v)); } // numero per [style.width.%]
  barColor(v: number) {
    const frac = Math.max(0, Math.min(100, v)) / 100;
    const r = Math.round(255 * (1 - frac));
    const g = Math.round(255 * frac);
    return `rgb(${r}, ${g}, 0)`;
  }
}
