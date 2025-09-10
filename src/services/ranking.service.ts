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
        const competition_id = '143'; // Replace with actual value or pass as parameter
        const url = `${environment.apiUrl}${API_PATHS.getRanking}?competition_id=${competition_id}`;
        return firstValueFrom(
          this.http.get<IRankingResponse>(url)
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
