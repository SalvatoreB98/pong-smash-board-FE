import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_PATHS } from '../api/api.config';
import { IJoinCompetitionResponse, IUserState } from '../services/interfaces/Interfaces'; // adatta il path

// --- Modelli ---
export interface ICompetition {
  id: number | string;
  name: string;
  type: string;
  setsType: number;
  pointsType: number;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
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
  type: string;       // "league" | "elimination" | ...
  bestOf: number;
  pointsTo: number;
  startDate?: string;
  endDate?: string;
  [k: string]: any;
}

// tipica risposta del tuo /api/add-competition
export interface AddCompetitionResponse {
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
    // adatta in base ai tuoi path (es. API_PATHS.competitions + `/${id}`)
    return this.http.get<ICompetition>(`${API_PATHS.getCompetitions}/${id}`);
  }

  /** Crea competizione */
  add(dto: AddCompetitionDto): Observable<AddCompetitionResponse> {
    // es.: /api/add-competition
    return this.http.post<AddCompetitionResponse>(API_PATHS.addCompetition, dto);
  }

  /** Aggiorna parzialmente una competizione */
  update(id: number | string, patch: Partial<ICompetition>): Observable<ICompetition> {
    return this.http.patch<ICompetition>(`${API_PATHS.getCompetitions}/${id}`, patch);
  }

  /** Elimina competizione */
  remove(id: number | string): Observable<{ success: boolean } | void> {
    return this.http.delete<{ success: boolean } | void>(`${API_PATHS.getCompetitions}/${id}`);
  }

  join(code: string, userId: number | string): Observable<IJoinCompetitionResponse> {
    return this.http.post<IJoinCompetitionResponse>(API_PATHS.joinCompetition, { code, userId });
  }
}
