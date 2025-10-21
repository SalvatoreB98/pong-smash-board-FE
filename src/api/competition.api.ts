import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_PATHS } from '../api/api.config';
import { KnockoutResponse } from '../app/interfaces/knockout.interface';
import { IJoinCompetitionResponse, IUserState } from '../services/interfaces/Interfaces'; // adatta il path

// --- Modelli ---
export type CompetitionType = 'league' | 'elimination' | 'group_knockout';

export interface ICompetition {
  id: number | string;
  name: string;
  type: CompetitionType;
  setsType: number;
  sets_type?: number; // alias per setsType
  pointsType: number;
  points_type?: number; // alias per pointsType
  start_date?: string | null;
  end_date?: string | null;
  created?: string;
  players?: { id: number; name: string; image_url: string, nickname: string }[];
  [k: string]: any;
  management: 'admin' | 'self';
}

export interface ICompetitionsResponse {
  competitions: ICompetition[];
  player?: { playerId: number | null; playerRow?: any } | null;
  meta?: any;
  userState?: IUserState;
}

// payload per la creazione
export interface AddCompetitionDto {
  name: string;
  type: CompetitionType;       // "league" | "elimination" | ...
  bestOf: number;
  pointsTo: number;
  startDate?: string;
  endDate?: string;
  [k: string]: any;
}

// tipica risposta del tuo /api/add-competition
export interface AddCompetitionResponse {
  players: any;
  message?: string;
  competition: ICompetition;
  userState?: IUserState;
}

@Injectable({ providedIn: 'root' })
export class CompetitionApi {
  constructor(private http: HttpClient) { }

  /** Lista competizioni dell'utente */
  getList(): Observable<ICompetitionsResponse> {
    // es.: API_PATHS.getCompetitions
    return this.http.get<ICompetitionsResponse>(API_PATHS.getCompetitions);
  }

  /** Dettaglio singola competizione */
  getOne(id: number | string): Observable<ICompetition> {
    return this.http
      .get<any>(`${API_PATHS.getCompetitions}/${id}`)
      .pipe(
        map(res => ({
          ...res,
          id: (res.id ?? res.competition_id) || res.competition['id']
        }))
      );
  }

  getView(id: number | string): Observable<any> {
    return this.http.get<any>(API_PATHS.getCompetitionView, {
      params: { competitionId: String(id) },
    });
  }

  getKnockouts(id: number | string): Observable<KnockoutResponse> {
    return this.http.get<KnockoutResponse>(API_PATHS.getKnockouts, {
      params: { competitionId: String(id) },
    });
  }

  /** Crea competizione */
  add(dto: AddCompetitionDto): Observable<AddCompetitionResponse> {
    return this.http.post<AddCompetitionResponse>(API_PATHS.addCompetition, dto).pipe(
      map(res => ({
        ...res,
        competition: {
          ...res.competition,
          id: (res.competition.id ?? res.competition['competition_id']) || res.competition['id'] 
        }
      }))
    );
  }

  /** Aggiorna parzialmente una competizione */
  update(id: number | string, patch: Partial<ICompetition>): Observable<ICompetition> {
    return this.http.patch<ICompetition>(`${API_PATHS.getCompetitions}/${id}`, patch);
  }

  /** Elimina competizione */
  remove(id: number | string): Observable<{ success: boolean } | void> {
    return this.http.delete<{ success: boolean } | void>(API_PATHS.deleteCompetition, {
      body: { competitionId: id },
    });
  }

  join(code: string, userId: number | string): Observable<IJoinCompetitionResponse> {
    return this.http.post<IJoinCompetitionResponse>(API_PATHS.joinCompetition, { code, userId });
  }

  updateActiveCompetition(competitionId: number | string): Observable<any> {
    return this.http.post<any>(API_PATHS.updateActiveCompetition, { competitionId });
  }

  deletePlayer(competitionId: number | string, playerId: number | string): Observable<any> {
    return this.http.delete<any>(API_PATHS.deletePlayer, {
      body: { competitionId, playerId },
    });
  }
}
