import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { SupabaseAuthService } from './supabase-auth.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public isLoggedIn$ = new BehaviorSubject<boolean>(false);

  constructor(private supabaseAuthService: SupabaseAuthService) {
    this.checkAuth();
  }

  async checkAuth() {
    const { data, error } = await this.supabaseAuthService.getUserSession();
    this.isLoggedIn$.next(!!data?.session);
  }

  async logout() {
    await this.supabaseAuthService.signOut();
    this.isLoggedIn$.next(false);
  }
}