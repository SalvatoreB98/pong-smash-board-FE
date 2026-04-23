import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DataService } from '../../../services/data.service';
import { CommonModule } from '@angular/common';
import { RankingService } from '../../../services/ranking.service';
import { inject } from '@angular/core';
import { map, firstValueFrom, BehaviorSubject } from 'rxjs';
import { Match, PlayerStanding, HeadToHeadRow } from '../../interfaces/statsInterfaces';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { TranslatePipe } from '../../utils/translate.pipe';
import { SHARED_IMPORTS } from '../imports/shared.imports';
import { UserService } from '../../../services/user.service';
import { PlayerStreaksComponent } from '../../components/player-streaks/player-streaks.component';

type StandingsType = 'WINRATE' | 'WINS';


@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [...SHARED_IMPORTS, PlayerStreaksComponent],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit, OnChanges {
  @Input() competitionId?: string | number;
  @Input() inputMatches: IMatch[] = [];

  private dataService = inject(DataService);
  private rankingService = inject(RankingService);

  private headToHeadSubject = new BehaviorSubject<HeadToHeadRow[]>([]);
  headToHead$ = this.headToHeadSubject.asObservable();

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

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {

  }

  async ngOnInit() {
    await this.refreshRanking();

    this.rankingService.refreshObs$.subscribe(() => {
      this.refreshRanking();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['competitionId'] && !changes['competitionId'].firstChange) {
      this.refreshRanking();
    }
    if (changes['inputMatches']) {
      this.recalcHeadToHead();
    }
  }

  get allMatches(): IMatch[] {
    return (this.inputMatches && this.inputMatches.length > 0)
      ? this.inputMatches
      : (this.dataService.matches || []);
  }

  private async refreshRanking() {
    let activeCompetitionId = '';
    if (this.competitionId) {
      activeCompetitionId = String(this.competitionId);
    } else {
      const userState = await firstValueFrom(this.userService.getState());
      if (userState?.active_competition_id) {
        activeCompetitionId = String(userState.active_competition_id);
      }
    }

    const res = await this.rankingService.getRanking(activeCompetitionId, false);

    const globalWins = this.dataService.wins || {};
    const globalPlayed = this.dataService.totPlayed || {};
    const globalPoints = this.dataService.points || {};

    this.standings = res.ranking.map(item => {
      // Usiamo playerid come chiave, perché i dizionari (wins, totPlayed) sono indicizzati per playerid
      const pId = item.playerid || item.id;
      
      const w = globalWins[pId] !== undefined ? globalWins[pId] : item.wins;
      const tp = globalPlayed[pId] !== undefined ? globalPlayed[pId] : item.played;
      const wr = globalPoints[pId] !== undefined ? parseFloat(String(globalPoints[pId])) : (item.winrate ?? 0);
      
      return {
        id: pId,
        image_url: item.image_url || '/default-player.jpg',
        nickname: item.nickname,         
        playerName: item.nickname,
        wins: w,
        lost: Math.max(tp - w, 0),
        totalPlayed: tp,
        winRate: wr,
        rating: item.rating || 0
      };
    });

    this.standings = this.calculateClassifica(this.standingsType);
    this.cdr.detectChanges();

  }

  // se vuoi cambiare classifica (es. con bottoni), richiami questa
  setStandingsType(type: StandingsType) {
    this.standingsType = type;
    this.recalcAll();
  }

  private recalcAll() {
    this.standings = this.calculateClassifica(this.standingsType);
    this.recalcHeadToHead();
  }

  private recalcHeadToHead() {
    const sourceMatches = this.allMatches;

    const mappedMatches = sourceMatches.map(match => ({
      ...match,
      p1: match.player1_score,
      p2: match.player2_score
    })) as Match[];

    this.headToHeadData = this.calculateHeadToHead(mappedMatches);
    this.headToHeadSubject.next(this.headToHeadData);
  }

  private calculateClassifica(standingsType: StandingsType): PlayerStanding[] {
    const players = [...this.standings];
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
  barWidth(value: number, total: number): number {
    if (total === 0) return 1;
    return Math.max(5, Math.min(100, (value * 100) / total));
  }
}
