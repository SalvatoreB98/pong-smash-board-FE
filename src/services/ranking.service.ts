import { Injectable } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IRankingResponse } from './data.service';
import { API_PATHS } from '../api/api.config';
import { environment } from '../environments/environment';
import { CachedFetcher } from '../app/utils/helpers/cache.helpers'
@Injectable({ providedIn: 'root' })
export class RankingService {

  private refresh$ = new Subject<void>();
  refreshObs$ = this.refresh$.asObservable();
  private fetcherMap: Map<string, CachedFetcher<IRankingResponse>> = new Map();

  constructor(private http: HttpClient) { }

  private getFetcher(competition_id: string): CachedFetcher<IRankingResponse> {
    if (!this.fetcherMap.has(competition_id)) {
      const fetcher = new CachedFetcher<IRankingResponse>(
        async () => {
          const url = `${environment.apiUrl}${API_PATHS.getRanking}?competition_id=${competition_id}`;
          return firstValueFrom(
            this.http.get<IRankingResponse>(url)
          );
        },
        60 * 1000 // TTL 1 minuto
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

  triggerRefresh() {
    this.refresh$.next();
  }
}
