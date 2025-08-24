import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { UserService } from '../../../services/user.service';
import { firstValueFrom } from 'rxjs';
import { IUserState, UserProgressState } from '../../../services/interfaces/Interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private supabaseAuthService: SupabaseAuthService, private userService: UserService) { }

  async canActivate(): Promise<boolean | UrlTree> {
    const session = await this.supabaseAuthService.getUserSession();
    if (!session?.data.session) {
      return this.router.parseUrl('/login');
    }

    const raw = await firstValueFrom(this.userService.getUserState());
    const state = (raw as Partial<IUserState>) ?? {};
    const progress = (state.state ?? 'profile_not_completed') as UserProgressState;
    const activeCompId = state.active_competition_id ?? null;

    if (progress === 'profile_not_completed') {
      return this.router.parseUrl('/profile');
    }

    if (progress === 'profile_completed' && !activeCompId) {
      return this.router.parseUrl('/competitions');
    }

    return true;
  }

}

