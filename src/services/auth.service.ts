import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SupabaseAuthService } from './supabase-auth.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';
import { CompetitionService } from './competitions.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  
  public isLoggedIn$ = new BehaviorSubject<boolean>(false);
  userService = inject(UserService);

  competitionService = inject(CompetitionService);

  constructor(private supabaseAuthService: SupabaseAuthService) {
    this.checkAuth();
  }

  async checkAuth() {
    const { data, error } = await this.supabaseAuthService.getUserSession();
    this.isLoggedIn$.next(!!data?.session);
  }

  async logout() {
    await this.supabaseAuthService.signOut();
    this.userService.clear()
    this.isLoggedIn$.next(false);
  }
}