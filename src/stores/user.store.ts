// user.store.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IUserState } from '../services/interfaces/Interfaces';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly _state$ = new BehaviorSubject<IUserState | null>(null);

  /** stream reattivo */
  state$ = this._state$.asObservable();

  /** snapshot sincrono */
  snapshot(): IUserState | null {
    return this._state$.getValue();
  }

  /** set completo */
  set(state: IUserState | null) {
    console.log('[UserStore] 📥 set:', state);
    this._state$.next(state ? { ...state } : null);
  }

  /** patch parziale */
  patch(patch: Partial<IUserState>) {
    const prev = this._state$.getValue();
    if (!prev) return;
    const merged = { ...prev, ...patch };
    console.log('[UserStore] ✏️ patch:', merged);
    this._state$.next(merged);
  }

  /** reset */
  clear() {
    console.log('[UserStore] 🚪 clear');
    this._state$.next(null);
  }
}
