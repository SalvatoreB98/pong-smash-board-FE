// competitions.service.ts (estratto)
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment'; // adatta il path
import { LoaderService } from './loader.service';
import { API_PATHS } from '../api/api.config';

// === Tipi di risposta dal BE ===
export interface ICompetition {
  id: number;
  name: string;
  type: string;           // 'league' | 'elimination' | ...
  setsType: number;       // bestOf
  pointsType: number;     // pointsTo
  start_date?: string | null;
  end_date?: string | null;
  // opzionale se presenti nel DB
  created_by?: string;
  createdBy?: string;
  [k: string]: any;
}

export interface ICompetitionsResponse {
  player: { playerId: number | null; playerRow?: any } | null;
  competitions: ICompetition[];
  meta?: any;
}

@Injectable({ providedIn: 'root' })
export class CompetitionsService {

  private competitions: ICompetition[] = [];
  private playerId: number | null = null;
  private meta: any = {};

  constructor(private http: HttpClient, private loaderService: LoaderService) { }

  // Assegna lo stato interno
  private assignData(data: ICompetitionsResponse) {
    this.competitions = data?.competitions ?? [];
    this.playerId = data?.player?.playerId ?? null;
    this.meta = data?.meta ?? {};
  }

  // Ritorna un oggetto coerente (come fai per IRankingResponse)
  private generateReturnObject(): ICompetitionsResponse {
    return {
      player: this.playerId != null ? { playerId: this.playerId } : null,
      competitions: this.competitions,
      meta: this.meta
    };
  }

  // === Metodo richiesto, stile _fetchAndAssignInternal ===
  private async _fetchAndAssignCompetitionsInternal(): Promise<ICompetitionsResponse> {
    try {
      this.loaderService.startLittleLoader();
      const data = await firstValueFrom(
        this.http.get<ICompetitionsResponse>(API_PATHS.getCompetitions)
      );

      this.assignData(data);
      return this.generateReturnObject();
    } catch (error) {
      const err = error as HttpErrorResponse;
      console.error('Error fetching competitions:', err);
      return this.generateReturnObject(); // ritorna lo stato (vuoto) coerente
    } finally {
      this.loaderService.stopLittleLoader();
    }
  }

  // Espone un metodo pubblico “comodo”
  public getCompetitions(): Promise<ICompetitionsResponse> {
    return this._fetchAndAssignCompetitionsInternal();
  }
}
