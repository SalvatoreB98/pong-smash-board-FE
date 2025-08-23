// src/app/services/ranking.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

// Se già dichiari IRankingItem/IRankingResponse altrove, usa quell'import.
// Qui le ri-dichiaro per completezza nel caso serva localmente.
export interface IRankingItem {
  rating: number;
  img_player: string;
  lost: number;
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

interface RankingData extends IRankingResponse {
  // Estendibile se in futuro vuoi aggiungere altro stato derivato
}

@Injectable({ providedIn: 'root' })
export class RankingService {
  // ---- Stato in memoria (come in DataService) ----
  private ranking: IRankingItem[] = [];
  private generatedAt = '';

  // Stream reattivi (facoltativi ma in linea con DataService)
  private rankingSubject = new BehaviorSubject<IRankingItem[]>([]);
  private generatedAtSubject = new BehaviorSubject<string>('');

  public rankingObs = this.rankingSubject.asObservable();
  public generatedAtObs = this.generatedAtSubject.asObservable();

  // ---- Cache & coalescing (stessa struttura del DataService) ----
  private _loaded = false;                         // abbiamo già i dati?
  private _lastLoadedAt = 0;                       // timestamp ultimo load
  private _loadingPromise?: Promise<IRankingResponse>; // dedup delle chiamate

  constructor(private http: HttpClient) {}

  /**
   * Carica la ranking solo la prima volta (o se scaduta/forzata).
   * options.force => forza il fetch
   * options.ttlMs => time-to-live: se i dati sono più "giovani" di ttlMs, usa cache
   */
  async fetchRanking(
    options?: { force?: boolean; ttlMs?: number }
  ): Promise<IRankingResponse> {
    const force = !!options?.force;
    const ttlMs = options?.ttlMs ?? 0;
    const now = Date.now();

    // 1) Cache hit (già caricati) e non forzato
    if (!force && this._loaded) {
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

  /** Forza un refresh (es. dopo azioni che possono cambiare la classifica) */
  async refresh(): Promise<IRankingResponse> {
    this._loaded = false;
    return this.fetchRanking({ force: true });
  }

  private async _fetchAndAssignInternal(): Promise<IRankingResponse> {
    try {

      const data = await firstValueFrom(
        this.http.get<IRankingResponse>(`/api/add-match`)
      );

      this.assignData(data);
      return this.generateReturnObject();
    } catch (error) {
      console.error('Error fetching ranking:', error);
      return this.generateReturnObject();
    } finally {
      // this.loaderService.stopLoader();
    }
  }

  private assignData(data: IRankingResponse): void {
    this.ranking = data?.ranking ?? [];
    this.generatedAt = data?.generatedAt ?? '';

    // Aggiorna gli stream reattivi
    this.rankingSubject.next(this.ranking);
    this.generatedAtSubject.next(this.generatedAt);
  }

  private generateReturnObject(): RankingData {
    return {
      ranking: this.ranking,
      generatedAt: this.generatedAt,
    };

  }
}
