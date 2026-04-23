import { Injectable } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IRankingItem, IRankingResponse } from './data.service';
import { API_PATHS } from '../api/api.config';
import { environment } from '../environments/environment';
import { CachedFetcher } from '../app/utils/helpers/cache.helpers';
import {
  buildEloJsonExport,
  calcNewRatings,
  EloJsonExport,
  EloMatchResult,
  generateFairPlayPairings,
  FairPlayPairing,
  ELO_DEFAULT,
} from '../app/utils/elo.utils';

@Injectable({ providedIn: 'root' })
export class RankingService {

  private refresh$ = new Subject<void>();
  refreshObs$ = this.refresh$.asObservable();
  private fetcherMap: Map<string, CachedFetcher<IRankingResponse>> = new Map();

  constructor(private http: HttpClient) { }

  // ─── Core fetch (invariato) ────────────────────────────────────────────────

  private getFetcher(competition_id: string): CachedFetcher<IRankingResponse> {
    if (!this.fetcherMap.has(competition_id)) {
      const fetcher = new CachedFetcher<IRankingResponse>(
        async () => {
          const url = `${environment.apiUrl}${API_PATHS.getRanking}?competition_id=${competition_id}`;
          return firstValueFrom(
            this.http.get<IRankingResponse>(url)
          );
        },
        10 * 1000 // TTL 10 secondi
      );
      this.fetcherMap.set(competition_id, fetcher);
    }
    return this.fetcherMap.get(competition_id)!;
  }

  getRanking(competition_id: string, force = false): Promise<IRankingResponse> {
    return this.getFetcher(competition_id).get(force);
  }

  clearRankingCache(competition_id: string) {
    const fetcher = this.fetcherMap.get(competition_id);
    if (fetcher) {
      fetcher.clear();
    }
  }

  /** Svuota tutta la cache di tutte le competizioni */
  clearAllCaches() {
    this.fetcherMap.forEach(fetcher => fetcher.clear());
    this.fetcherMap.clear();
  }

  triggerRefresh() {
    this.refresh$.next();
  }

  // ─── ELO helpers ──────────────────────────────────────────────────────────

  /**
   * Restituisce le coppie "Fair Play" ordinate per minima differenza ELO.
   * Riutilizza la cache del ranking — nessuna chiamata HTTP aggiuntiva.
   */
  async getFairPlayPairings(competition_id: string): Promise<FairPlayPairing[]> {
    const res = await this.getRanking(competition_id);
    return generateFairPlayPairings(res.ranking);
  }

  /**
   * Simulazione locale: dato chi vince, restituisce i nuovi rating previsti.
   * Non salva nulla, è puramente predittiva.
   */
  simulateMatch(
    playerA: Pick<IRankingItem, 'rating'>,
    playerB: Pick<IRankingItem, 'rating'>,
    winner: 'A' | 'B' | 'draw'
  ): EloMatchResult {
    const rA = playerA.rating ?? ELO_DEFAULT;
    const rB = playerB.rating ?? ELO_DEFAULT;
    const scoreA: 1 | 0 | 0.5 = winner === 'A' ? 1 : winner === 'B' ? 0 : 0.5;
    return calcNewRatings(rA, rB, scoreA);
  }

  /**
   * Genera il payload JSON pronto per l'integrazione nel frontend/backend.
   */
  async eloJsonExport(competition_id: string): Promise<EloJsonExport> {
    const res = await this.getRanking(competition_id);
    const pairings = generateFairPlayPairings(res.ranking);
    return buildEloJsonExport(res.ranking, pairings);
  }
}
