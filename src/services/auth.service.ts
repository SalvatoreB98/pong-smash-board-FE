import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) { }

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string, refreshToken: string }>('/api/login', { email, password }).pipe(
      tap(response => {
        localStorage.setItem('refreshToken', response.refreshToken); // Store refresh token
        sessionStorage.setItem('accessToken', response.accessToken); // Store access token in memory
      })
    );
  }

  getAccessToken() {
    return sessionStorage.getItem('accessToken') || this.refreshAccessToken();
  }

  refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    return this.http.post<{ accessToken: string }>('/api/refresh-token', { refreshToken }).pipe(
      tap(response => {
        sessionStorage.setItem('accessToken', response.accessToken);
      })
    );
  }

  logout() {
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
  }
}
