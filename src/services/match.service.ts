import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_PATHS } from '../api/api.config';
import { IMatch } from '../app/interfaces/matchesInterfaces';

export interface SetMatchDatePayload {
  matchId: number | string;
  date?: string;
}

export interface SetMatchDateResponse {
  message?: string;
  match?: IMatch | null;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);

  async setMatchDate(
    matchId: number | string,
    date: string | number | Date | null | undefined,
  ): Promise<SetMatchDateResponse> {
    const payload: SetMatchDatePayload = { matchId };
    const normalizedDate = this.normalizeDate(date);

    if (normalizedDate) {
      payload.date = normalizedDate;
    }

    return firstValueFrom(
      this.http.post<SetMatchDateResponse>(API_PATHS.setMatchDate, payload)
    );
  }

  private normalizeDate(date: string | number | Date | null | undefined): string | undefined {
    if (date == null) {
      return undefined;
    }

    if (typeof date === 'string') {
      const trimmed = date.trim();
      if (!trimmed) {
        return undefined;
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? undefined : this.toInputDate(parsed);
    }

    const parsed = date instanceof Date ? date : new Date(date);
    return Number.isNaN(parsed.getTime()) ? undefined : this.toInputDate(parsed);
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
