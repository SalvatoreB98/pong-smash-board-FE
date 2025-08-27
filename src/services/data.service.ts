import { inject, Injectable } from '@angular/core';
import { MSG_TYPE } from "../app/utils/enum";
import mockData from '../app/utils/mock.json';
import { environment } from '../environments/environment';
import { IMatch } from '../app/interfaces/matchesInterfaces';
import { IMatchResponse } from '../app/interfaces/responsesInterfaces';
import { LoaderComponent } from '../app/utils/components/loader/loader.component';
import { LoaderService } from './loader.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_PATHS } from '../api/api.config';
import { UserService } from './user.service';

interface MatchData extends IMatchResponse {
  matches: IMatch[];
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

  private winsSubject = new BehaviorSubject<Record<string, number>>({});
  private totPlayedSubject = new BehaviorSubject<Record<string, number>>({});
  private pointsSubject = new BehaviorSubject<Record<string, number>>({});
  private matchesSubject = new BehaviorSubject<IMatch[]>([]);

  public winsObs = this.winsSubject.asObservable();
  public totPlayedObs = this.totPlayedSubject.asObservable();
  public pointsObs = this.pointsSubject.asObservable();
  public matchesObs = this.matchesSubject.asObservable();

  private _loaded = false;                 // abbiamo già i dati?
  private _lastLoadedAt = 0;               // timestamp dell’ultimo load
  private _loadingPromise?: Promise<IMatchResponse>; // dedup calls
  private _id = Math.random().toString(36).slice(2);

  private userService = inject(UserService);

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
    this.loaderService.startLittleLoader();
    try {
      if (environment.mock) {
        this.assignData(mockData);
      } else {
        try {
          const data = await firstValueFrom(
            this.http.get<IMatchResponse>(API_PATHS.getMatches)
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
    } finally {
      this.loaderService.stopLittleLoader();
    }
  }

  private assignData(data: any): void {
    this.raw = data;

    this.matches = data.matches || [];
    this.wins = data.wins || {};
    this.totPlayed = data.totPlayed || {};
    this.points = data.points || {};
    this.players = data.players || [];
    this.monthlyWinRates = data.monthlyWinRates || {};
    this.badges = data.badges || {};

    // 👉 aggiorna gli stream reattivi
    this.matchesSubject.next(this.matches);
    this.winsSubject.next(this.wins);
    this.totPlayedSubject.next(this.totPlayed);
    this.pointsSubject.next(this.points);
  }

  private generateReturnObject(): MatchData {
    return {
      matches: this.matches,
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

  async addMatch(data: { p1Score: number; p2Score: number;[key: string]: any }): Promise<void> {
    console.log(data);
    this.loaderService.startLittleLoader();

    if (data?.p1Score == null || data?.p2Score == null) {
      this.loaderService.stopLittleLoader();
      return Promise.reject('Invalid data');
    }

    const url = API_PATHS.addMatch;

    try {
      // HttpClient serializza automaticamente in JSON
      const responseData = await firstValueFrom(this.http.post<any>(url, data));
      this.loaderService?.showToast('Salvato con successo!', MSG_TYPE.SUCCESS, 5000);
      console.log('Success:', responseData);
    } catch (error: any) {
      this.loaderService?.showToast(`Match data not found ${error?.message ?? error}`, MSG_TYPE.ERROR);
      throw error;
    } finally {
      this.loaderService.stopLittleLoader();
    }
  }

  getLoggedInPlayerId(): number | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData).id : null;
  }

  setLoggedInPlayer(player: { playerid: number, name: string }) {
    localStorage.setItem('loggedInPlayer', JSON.stringify(player));
  }


  getStats() {

  }
}
