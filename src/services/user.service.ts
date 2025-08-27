// user.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IUserState } from './interfaces/Interfaces';
import { UserApi } from '../api/user.api';
import { UserStore } from '../stores/user.store';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: UserApi, private store: UserStore) {}

  /** stream reattivo */
  userState$() {
    return this.store.state$;
  }

  /** snapshot sincrono */
  snapshot(): IUserState | null {
    return this.store.snapshot();
  }

  /** ottieni lo stato, cache o BE */
  getState(forceReload = false): Observable<IUserState> {
    if (this.store.snapshot() && !forceReload) {
      console.log('[UserService] ⚡ from cache');
      return of(this.store.snapshot()!);
    }

    console.log('[UserService] 🌐 from BE');
    return this.api.getUserState().pipe(
      tap(s => this.store.set(s))
    );
  }

  /** update remoto + patch ottimistico */
  updateRemote(patch: Partial<IUserState>): Observable<IUserState> {
    this.store.patch(patch); // ottimistico
    return this.api.updateUserState(patch).pipe(
      tap(serverState => this.store.set(serverState))
    );
  }

  /** update solo locale */
  setLocal(state: IUserState) {
    this.store.set(state);
  }
  patchLocal(patch: Partial<IUserState>) {
    this.store.patch(patch);
  }

  /** clear */
  clear() {
    this.store.clear();
  }
}
