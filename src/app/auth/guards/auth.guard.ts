import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { UserService } from '../../../services/user.service';
import { firstValueFrom } from 'rxjs';
import { IUserState, UserProgressState } from '../../../services/interfaces/Interfaces';
import { LoaderService } from '../../../services/loader.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private supabaseAuthService: SupabaseAuthService,
    private userService: UserService,
    private loaderService: LoaderService
  ) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    // 1) Auth
    const session = await this.supabaseAuthService.getUserSession();
    if (!session?.data?.session) return this.router.parseUrl('/login');

    // 2) Stato utente
    this.loaderService.startLittleLoader(); // Mostra il loader
    const raw = await firstValueFrom(this.userService.getUserState());
    this.loaderService.stopLittleLoader(); 
    const s = (raw as Partial<IUserState>) ?? {};
    const progress = (s.state ?? 'profile_not_completed') as UserProgressState;
    const activeCompId = s.active_competition_id ?? null;

    const targetUrl = state.url; // es: '/profile', '/competitions', '/'

    // 3) Routing condizionale
    if (progress === 'profile_not_completed') {
      // Se sto già andando a /profile, lascia passare
      if (targetUrl.startsWith('/profile')) return true;
      return this.router.parseUrl('/profile');
    }

    if (progress === 'profile_completed' && !activeCompId) {
      // Se sto già andando a /competitions, lascia passare
      if (targetUrl.startsWith('/competitions')) return true;
      return this.router.parseUrl('/competitions');
    }

    // Altrimenti ok
    return true;
  }
}
