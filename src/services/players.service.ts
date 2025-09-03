import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { API_PATHS } from '../api/api.config';

export interface IPlayer {
  id: number;
  name: string;
  lastname?: string;
  nickname?: string;
  image_url?: string;
}

@Injectable({ providedIn: 'root' })
export class PlayersService {
  private readonly http = inject(HttpClient);

  /** Ritorna tutti i players di una competizione */
  getPlayers(): Observable<IPlayer[]> {
    return this.http.get<IPlayer[]>(
      environment.apiUrl + API_PATHS.getPlayers
    );
  }
}
