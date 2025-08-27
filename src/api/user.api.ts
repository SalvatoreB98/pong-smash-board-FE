// user.api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_PATHS } from '../api/api.config';
import { IUserState } from '../services/interfaces/Interfaces';

@Injectable({ providedIn: 'root' })
export class UserApi {
  constructor(private http: HttpClient) {}

  getUserState(): Observable<IUserState> {
    return this.http.get<IUserState>(API_PATHS.userState);
  }

  updateUserState(patch: Partial<IUserState>): Observable<IUserState> {
    // Usa PATCH/POST/PUT a seconda del BE
    return this.http.post<IUserState>(API_PATHS.userState, patch);
  }
}
