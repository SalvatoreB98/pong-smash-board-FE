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

      const parsed = this.parseToDate(trimmed);
      return parsed ? parsed.toISOString() : undefined;
    }

    const parsed = date instanceof Date ? date : new Date(date);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  private parseToDate(value: string): Date | null {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(part => Number(part));
      const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
