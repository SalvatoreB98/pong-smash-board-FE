// services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IUserState } from './interfaces/Interfaces';
import { API_PATHS } from '../api/api.config';

@Injectable({ providedIn: 'root' })
export class UserService {

  private userState: IUserState | {} = {};

  constructor(private http: HttpClient) { }

  getUserState(): Observable<IUserState | {}> {
    if (Object.keys(this.userState).length > 0) {
      return of(this.userState);
    } else {
      return this.http.get<IUserState | {}>(API_PATHS.userState).pipe(
        tap((state) => this.userState = state)
      );
    }
  }
}
