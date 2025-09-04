import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IRankingResponse } from './data.service';
import { API_PATHS } from '../api/api.config';
import { environment } from '../environments/environment';
import { CachedFetcher } from '../app/utils/helpers/cache.helpers'
@Injectable({ providedIn: 'root' })
export class RankingService {
  private fetcher: CachedFetcher<IRankingResponse>;

  constructor(private http: HttpClient) {
    this.fetcher = new CachedFetcher<IRankingResponse>(
      async () => {
        return firstValueFrom(
          this.http.get<IRankingResponse>(environment.apiUrl + API_PATHS.getRanking)
        );
      },
      60 * 1000 // TTL 1 minuto
    );
  }

  getRanking(force = false): Promise<IRankingResponse> {
    return this.fetcher.get(force);
  }

  clearRankingCache() {
    this.fetcher.clear();
  }
}
