import { Component, Input } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs';
import { DataService } from '../../../services/data.service';
import { CommonModule } from '@angular/common';



interface PlayerStanding {
  playerName: string;
  wins: number;
  lost: number;
  totalPlayed: number;
  winRate: number; // 0..100
}

interface Match { giocatore1: string; giocatore2: string; p1: number|string; p2: number|string; }
interface HeadToHeadRow { player1: string; player2: string; scored1: number; scored2: number; }

@Component({
  selector: 'app-stats',
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent {
  // Input reattivo per il tipo classifica
  private standingsType$ = new BehaviorSubject<any>('WINRATE');
  @Input() set standingsType(v: any) { this.standingsType$.next(v ?? 'WINRATE'); }
  
  constructor(private data: DataService) {}

  // stream di base dal service
  wins$!: Observable<Record<string, number>>;
  totPlayed$!: Observable<Record<string, number>>;
  points$!: Observable<Record<string, number>>;
  matches$!: Observable<Match[]>;

  ngOnInit(): void {
    this.wins$ = this.data.winsObs;
    this.totPlayed$ = this.data.totPlayedObs;
    this.points$ = this.data.pointsObs;
    this.matches$ = this.data.matchesObs;
  }

  // derivati
  standings$: Observable<PlayerStanding[]> = combineLatest([
    this.wins$, this.totPlayed$, this.points$, this.standingsType$
  ]).pipe(
    map(([wins, totPlayed, points, type]) =>
      this.calculateClassificaFrom(wins, totPlayed, points, type)
    )
  );

  headToHeadData$: Observable<HeadToHeadRow[]> = this.matches$.pipe(
    map(matches => this.calculateHeadToHead(matches))
  );


  private calculateClassificaFrom(
    wins: Record<string, number>,
    totPlayed: Record<string, number>,
    points: Record<string, number>,
    type: any
  ): PlayerStanding[] {
    const players: PlayerStanding[] = Object.keys(wins).map(player => {
      const w = wins[player] ?? 0;
      const tp = totPlayed[player] ?? 0;
      const lost = Math.max(tp - w, 0);
      const winRate = (points[player] ?? 0) * 100;
      return { playerName: player, wins: w, lost, totalPlayed: tp, winRate };
    });

    if (type === 'WINRATE') {
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
    (matches || []).forEach(m => {
      const { giocatore1, giocatore2 } = m;
      const p1 = parseInt(String(m.p1), 10) || 0;
      const p2 = parseInt(String(m.p2), 10) || 0;
      const [a, b] = [giocatore1, giocatore2].sort();
      const key = `${a}-${b}`;
      headToHead[key] ??= { player1: a, player2: b, scored1: 0, scored2: 0 };
      if (a === giocatore1) { headToHead[key].scored1 += p1; headToHead[key].scored2 += p2; }
      else { headToHead[key].scored1 += p2; headToHead[key].scored2 += p1; }
    });
    return Object.values(headToHead);
  }
}
