import { inject, Injectable } from '@angular/core';
import { KnockoutStage, MSG_TYPE } from "../app/utils/enum";
import mockData from '../app/utils/mock.json';
import { environment } from '../environments/environment';
import { CompetitionMode, IMatch } from '../app/interfaces/matchesInterfaces';
import { Group, GroupStageResponse, KnockoutStageData } from '../app/interfaces/group.interface';
import { IMatchResponse } from '../app/interfaces/responsesInterfaces';
import { LoaderComponent } from '../app/utils/components/loader/loader.component';
import { LoaderService } from './loader.service';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_PATHS } from '../api/api.config';
import { UserService } from './user.service';
import { RankingService } from './ranking.service';
import { INextMatchesResponse } from './interfaces/Interfaces';

export interface ICompetitionViewPlayer {
  id?: number | string;
  name: string;
  image_url?: string | null;
  nickname?: string | null;
}

export interface ICompetitionStatItem {
  label: string;
  value: string | number;
}

export interface ICompetitionMatchSummary {
  id: number | string;
  date?: string | Date | number;
  player1_name?: string;
  player2_name?: string;
  player1_score?: number;
  player2_score?: number;
  [key: string]: any;
}

export interface ICompetitionViewResponse {
  id: number;
  name: string;
  type?: CompetitionMode;
  date?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  participantsCount?: number;
  players?: ICompetitionViewPlayer[];
  stats?: ICompetitionStatItem[];
  lastMatches?: ICompetitionMatchSummary[];
  nextMatches?: ICompetitionMatchSummary[];
  [key: string]: any;
}

interface MatchData extends IMatchResponse {
  matches: IMatch[];
  matchesElimination?: IMatch[] | null;
  wins: Record<string, number>;
  totPlayed: Record<string, number>;
  points: any;
  players: string[];
  monthlyWinRates: Record<string, number>;
  badges: Record<string, any>;
  giocatore1Score: number;
  giocatore2Score: number;
}
export interface IRankingItem {
  nickname: any;
  id: any;
  rating: number;
  playerid: number;
  name: string;
  image_url: string | null;
  played: number;
  wins: number;
  winrate: number; // percentuale (es. 62.5)
}
export interface IRankingResponse {
  ranking: IRankingItem[];
  generatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  matches: IMatch[] = [];
  wins: Record<string, number> = {};
  totPlayed: Record<string, number> = {};
  raw: any = {};
  monthlyWinRates: Record<string, number> = {};
  badges: Record<string, any> = {};
  players: string[] = [];
  loader!: LoaderComponent;
  points: any;
  matchesElimination: IMatch[] = [];
  groups: Group[] = [];
  knockoutStage: KnockoutStageData | null = null;

  private winsSubject = new BehaviorSubject<Record<string, number>>({});
  private totPlayedSubject = new BehaviorSubject<Record<string, number>>({});
  private pointsSubject = new BehaviorSubject<Record<string, number>>({});
  private matchesSubject = new BehaviorSubject<IMatch[]>([]);
  private matchesEliminationSubject = new BehaviorSubject<IMatch[]>([]);
  private groupsSubject = new BehaviorSubject<Group[]>([]);
  private knockoutSubject = new BehaviorSubject<KnockoutStageData | null>(null);
  private playersSubject = new BehaviorSubject<string[]>([]);

  public winsObs = this.winsSubject.asObservable();
  public totPlayedObs = this.totPlayedSubject.asObservable();
  public pointsObs = this.pointsSubject.asObservable();
  public matchesObs = this.matchesSubject.asObservable();
  public matchesEliminationObs = this.matchesEliminationSubject.asObservable();
  public groupsObs = this.groupsSubject.asObservable();
  public knockoutObs = this.knockoutSubject.asObservable();
  public playersObs = this.playersSubject.asObservable();

  private _loaded = false;                 // abbiamo già i dati?
  private _lastLoadedAt = 0;               // timestamp dell’ultimo load
  private _loadingPromise?: Promise<IMatchResponse>; // dedup calls
  private _groupsLoadingPromise?: Promise<GroupStageResponse>;
  private _id = Math.random().toString(36).slice(2);
  private _activeCompetitionId: number | null = null;
  private _groupsLoaded = false;

  private userService = inject(UserService);
  private rankingService = inject(RankingService);

  constructor(private loaderService: LoaderService, private http: HttpClient) {
    console.log('[DataService] ctor', this._id);
  }

  /**
   * Carica i dati solo la prima volta (o se scaduti/forzati).
   * options.force => forza il fetch
   * options.ttlMs => time-to-live: se i dati sono più "giovani" di ttlMs, usa cache
   */
  async fetchMatches(
    options?: { force?: boolean; ttlMs?: number }
  ): Promise<IMatchResponse> {
    const currentCompetitionId = this.userService.snapshot()?.active_competition_id ?? null;

    // Se la competizione attiva è cambiata, resettiamo la cache locale
    if (this._activeCompetitionId !== currentCompetitionId) {
      this._activeCompetitionId = currentCompetitionId;
      this._loaded = false;
      this._loadingPromise = undefined;
      this.resetData();
    }

    const force = !!options?.force;
    const ttlMs = options?.ttlMs ?? 0;
    const now = Date.now();

    // 1) Cache hit (già caricati) e non forzato
    if (!force && this._loaded) {
      // Se c'è un TTL, verifica che non sia scaduto
      if (ttlMs === 0 || (now - this._lastLoadedAt) < ttlMs) {
        return this.generateReturnObject(); // ← usa stato in memoria
      }
    }

    // 2) Se una richiesta è già in corso, riusa quella (coalescing)
    if (this._loadingPromise) {
      return this._loadingPromise;
    }

    // 3) Altrimenti fai il fetch “vero”
    this._loadingPromise = this._fetchAndAssignInternal();
    try {
      const res = await this._loadingPromise;
      this._loaded = true;
      this._lastLoadedAt = Date.now();
      return res;
    } finally {
      this._loadingPromise = undefined;
    }
  }

  /** Forza un refresh (es. dopo addMatch) */
  async refresh(): Promise<IMatchResponse> {
    this._loaded = false;
    return this.fetchMatches({ force: true });
  }

  private async _fetchAndAssignInternal(): Promise<IMatchResponse> {
    try {
      if (environment.mock) {
        this.assignData(mockData);
      } else {
        try {
          const data = await firstValueFrom(
            this.http.get<IMatchResponse>(API_PATHS.getMatches, {
              params: { competitionId: String(this.userService.snapshot()?.active_competition_id ?? '') }
            })
          );
          this.assignData(data);
        } catch (err: any) {
          throw new Error(`Failed to fetch data: ${err?.message ?? 'Unknown error'}`);
        }
      }

      return this.generateReturnObject();
    } catch (error) {
      console.error("Error fetching data:", error);
      this.loader?.showToast(`Server Error. Using mock data.`, 5000, MSG_TYPE.ERROR);

      // fallback mock
      this.assignData(mockData);
      return this.generateReturnObject();
    }
  }

  async fetchNextMatches(): Promise<IMatch[]> {
    const competitionId = this.userService.snapshot()?.active_competition_id ?? null;
    if (!competitionId) {
      return [];
    }
    try {
      const data = await firstValueFrom(
        this.http.get<INextMatchesResponse>(API_PATHS.getNextMatches, {
          params: { competitionId: String(competitionId) }
        })
      );
      return data.nextMatches ?? [];
    } catch (error) {
      console.error('Error fetching next matches:', error);
      return [];
    }
  }

  private assignData(data: any): void {
    this.raw = data;

    this.matches = (data.matches || []).map((match: any) => this.normalizeMatch(match));
    this.wins = data.wins || {};
    this.totPlayed = data.totPlayed || {};
    this.points = data.points || {};
    this.players = data.players || [];
    this.matchesElimination = (data.matchesElimination || []).map((match: any) => this.normalizeMatch(match));
    this.monthlyWinRates = data.monthlyWinRates || {};
    this.badges = data.badges || {};

    // 👉 aggiorna gli stream reattivi
    this.matchesSubject.next(this.matches);
    this.matchesEliminationSubject.next(this.matchesElimination);
    this.winsSubject.next(this.wins);
    this.totPlayedSubject.next(this.totPlayed);
    this.pointsSubject.next(this.points);
    this.playersSubject.next(this.players);
  }

  private resetData(): void {
    this.matches = [];
    this.matchesElimination = [];
    this.groups = [];
    this.knockoutStage = null;
    this.wins = {};
    this.totPlayed = {};
    this.points = {};
    this.players = [];
    this.monthlyWinRates = {};
    this.badges = {};
    this.raw = {};
    this._groupsLoaded = false;

    this.matchesSubject.next([]);
    this.matchesEliminationSubject.next([]);
    this.groupsSubject.next([]);
    this.knockoutSubject.next(null);
    this.winsSubject.next({});
    this.totPlayedSubject.next({});
    this.pointsSubject.next({});
    this.playersSubject.next([]);
  }

  private generateReturnObject(): MatchData {
    return {
      matches: this.matches,
      matchesElimination: this.matchesElimination,
      wins: this.wins,
      totPlayed: this.totPlayed,
      points: this.points,
      players: this.players,
      monthlyWinRates: this.monthlyWinRates,
      badges: this.badges,
      id: this.raw.id || '',
      data: this.raw.data || '',
      giocatore1: this.raw.giocatore1 || '',
      giocatore2: this.raw.giocatore2 || '',
      giocatore1Score: this.raw.giocatore1Score || 0,
      giocatore2Score: this.raw.giocatore2Score || 0,
      p1: this.raw.p1 || '',
      p2: this.raw.p2 || '',
      setsPoints: this.raw.setsPoints || []
    };
  }

  async addMatch(data: { p1Score: number; p2Score: number; groupId?: string | null;[key: string]: any }, stage?: KnockoutStage): Promise<void> {
    console.log(data);

    if (data?.p1Score == null || data?.p2Score == null) {
      this.loaderService.stopLittleLoader();
      return Promise.reject('Invalid data');
    }

    const url = API_PATHS.addMatch;

    try {
      const userState = await firstValueFrom(this.userService.getState());
      if (!userState?.active_competition_id) {
        throw new Error('Nessuna competizione attiva');
      }

      const responseData = await firstValueFrom(
        this.http.post<IMatchResponse>(url, {
          ...data,
          competitionId: userState.active_competition_id,
          stage
        })
      );

      // aggiorna lo store locale con i dati restituiti
      this.assignData(responseData);
      this.loaderService?.showToast('Salvato con successo!', MSG_TYPE.SUCCESS, 5000);
      this.matches = responseData.matches || [];
      this.matchesSubject.next(this.matches);
      this.rankingService.triggerRefresh();

      try {
        await this.fetchGroups({ force: true });
      } catch (err) {
        console.error('Failed to refresh groups after match:', err);
      }

      console.log('Success:', responseData);
    } catch (error: any) {
      console.info('Error:', error);
      this.loaderService?.showToast(
        `Match data not found ${error?.message ?? error}`,
        MSG_TYPE.ERROR
      );
      throw error;
    }
  }

  getLoggedInPlayerId(): number | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData).id : null;
  }

  setLoggedInPlayer(player: { playerid: number, name: string }) {
    localStorage.setItem('loggedInPlayer', JSON.stringify(player));
  }

  setMatches(matches: IMatch[]) {
    this.matches = matches;
    this.matchesSubject.next(this.matches);
  }
  getStats() {

  }

  // Cambia la firma:
  async fetchGroups(options?: { force?: boolean }): Promise<GroupStageResponse> {
    const competitionId = this.userService.snapshot()?.active_competition_id ?? null;
    if (!competitionId) {
      this.assignGroups([]);
      return { groups: [] };
    }

    if (!options?.force && this._groupsLoaded) {
      return this.generateGroupsReturnObject();
    }

    if (this._groupsLoadingPromise) {
      return this._groupsLoadingPromise;
    }

    this._groupsLoadingPromise = this._fetchAndAssignGroups(String(competitionId));
    try {
      const res = await this._groupsLoadingPromise;
      this._groupsLoaded = true;
      return res;
    } finally {
      this._groupsLoadingPromise = undefined;
    }
  }

  private async _fetchAndAssignGroups(competitionId: string): Promise<GroupStageResponse> {
    try {
      const data = await firstValueFrom(
        this.http.get<Group[]>(API_PATHS.getGroups, {
          params: { competitionId },
        })
      );
      this.assignGroups(data);
      return this.generateGroupsReturnObject();
    } catch (error) {
      console.error('Error fetching groups:', error);
      this.assignGroups([]);
      return this.generateGroupsReturnObject();
    }
  }

  private assignGroups(data: Group[]): void {
    this.groups = data ?? [];
    this.groupsSubject.next(this.groups);
  }

  private generateGroupsReturnObject(): GroupStageResponse {
    return { groups: [...this.groups] };
  }


  private normalizeMatch(raw: any): IMatch {
    return {
      ...(raw as IMatch),
      setsPoints: raw?.setsPoints ?? raw?.sets_points ?? [],
      groupId: raw?.groupId ?? raw?.group_id ?? undefined,
    };
  }
  async getKnockouts(competitionId: string | number | undefined): Promise<KnockoutStageData | null> {
    if (!competitionId) {
      return null;
    }
    try {
      const data = await firstValueFrom(
        this.http.get<KnockoutStageData>(API_PATHS.getKnockouts, {
          params: { competitionId: String(competitionId) }
        })
      );
      return data;
    } catch (error) {
      console.error('Error fetching knockout:', error);
      return null;
    }
  }
}
