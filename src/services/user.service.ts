// services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUserState } from './interfaces/Interfaces';
import { API_PATHS } from '../api/api.config';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) { }

  getUserState(): Observable<IUserState | {}> {
    return this.http.get<IUserState | {}>(API_PATHS.userState);
  }

}
