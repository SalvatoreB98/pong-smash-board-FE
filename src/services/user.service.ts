// services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, first, finalize, tap } from 'rxjs/operators';
import { IUserState } from './interfaces/Interfaces';
import { API_PATHS } from '../api/api.config';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly state$ = new BehaviorSubject<IUserState | null>(null);
  private loading$?: Observable<IUserState>; // evita richieste parallele
  private instanceId = Math.random().toString(36).substring(2, 8);

  constructor(private http: HttpClient) { 
    console.log(`[UserService] instance created -> ${this.instanceId}`);
  }

  /** Stream reattivo (emette solo valori non-null). */
  userState$(): Observable<IUserState> {
    return this.state$.asObservable().pipe(filter((s): s is IUserState => s !== null));
  }

  /** Ottieni lo stato (carica dal BE la prima volta, poi serve dal Subject). */
  getUserState(): Observable<IUserState> {
    const cached = this.state$.getValue();
    if (cached) return of(cached);

    if (this.loading$) return this.loading$;

    this.loading$ = this.http.get<IUserState>(API_PATHS.userState).pipe(
      tap(s => this.state$.next(s)),
      finalize(() => (this.loading$ = undefined))
    );

    return this.loading$;
  }

  /** Forza reload dal BE (es. dopo login/callback). */
  refreshUserState(): Observable<IUserState> {
    this.state$.next(null);
    return this.getUserState();
  }

  /** Update locale (ottimista) + BE. Puoi fare PATCH/POST a tua scelta. */
  updateUserState(patch: Partial<IUserState>): Observable<IUserState> {
    // 1) ottimista: merge locale immediato
    const prev = this.state$.getValue();
    if (prev) this.state$.next({ ...prev, ...patch });

    // 2) salva su BE e riallinea con la risposta (fonte di verità)
    return this.http.patch<IUserState>(API_PATHS.userState, patch).pipe(
      tap(serverState => this.state$.next(serverState))
    );
  }

  /** Helper comodo: set attiva competizione. */
  setActiveCompetition(id: string | null): Observable<IUserState> {
    return this.updateUserState({ active_competition_id: id } as Partial<IUserState>);
  }

  /** Logout/cleanup. */
  clear(): void {
    this.state$.next(null);
    this.loading$ = undefined;
  }
}

//const raw = await firstValueFrom(this.userService.getUserState()); // carica o usa cache

// this.userService.userState$().subscribe(state => {
//   // reagisci a ogni updateState()/refreshUserState()
// });

//this.userService.updateUserState({ state: 'profile_completed' }).subscribe();
