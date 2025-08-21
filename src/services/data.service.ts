import { Injectable } from '@angular/core';
import { MSG_TYPE } from "../app/utils/enum";
import mockData from '../app/utils/mock.json';
import { environment } from '../environments/environment';
import { IMatch } from '../app/interfaces/matchesInterfaces';
import { IMatchResponse } from '../app/interfaces/responsesInterfaces';
import { LoaderComponent } from '../app/utils/components/loader/loader.component';
import { LoaderService } from './loader.service';
import { BehaviorSubject } from 'rxjs';

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
  
  constructor(private loaderService: LoaderService) {
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

  // -------------------------------------------------------
  // IMPLEMENTAZIONE ORIGINALE spostata in un metodo privato
  // -------------------------------------------------------
  private async _fetchAndAssignInternal(): Promise<IMatchResponse> {
    this.loaderService.startLoader();
    try {
      this.loader?.startLoader();

      if (environment.mock) {
        this.assignData(mockData);
      } else {
        const response = await fetch(`${environment.apiUrl}/api/get-matches`, { headers: {} });
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const data: IMatchResponse = await response.json();
        this.assignData(data);
      }

      return this.generateReturnObject();
    } catch (error) {
      console.error("Error fetching data:", error);
      this.loader?.showToast(`Server Error. Using mock data.`, 5000, MSG_TYPE.ERROR);

      // fallback mock
      this.assignData(mockData);
      return this.generateReturnObject();
    } finally {
      this.loaderService.stopLoader();
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
    if ((data.p1Score !== undefined) && (data.p2Score !== undefined)) {
      try {
        const response = await fetch(`${environment.apiUrl}/api/add-match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        this.loaderService?.showToast("Salvato con successo!", MSG_TYPE.SUCCESS, 5000);
        console.log("Success:", responseData);
      } catch (error) {
        this.loaderService?.showToast(`Match data not found ${error}`, MSG_TYPE.ERROR);
        throw error;
      } finally {
        this.loaderService.stopLittleLoader();
      }
    } else {
      return Promise.reject("Invalid data");
    }
  }
  getLoggedInPlayerId(): number | null {
    const userData = localStorage.getItem('user'); // Example storage
    return userData ? JSON.parse(userData).id : null;
  }
  setLoggedInPlayer(player: { playerid: number, name: string }) {
    localStorage.setItem('loggedInPlayer', JSON.stringify(player));
  }
  getStats() {

  }
}
