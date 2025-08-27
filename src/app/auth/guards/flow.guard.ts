import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { UserService } from '../../../services/user.service';
import { firstValueFrom } from 'rxjs';
import { IUserState, UserProgressState } from '../../../services/interfaces/Interfaces';
import { LoaderService } from '../../../services/loader.service';

@Injectable({ providedIn: 'root' })
export class FlowGuard implements CanActivate {
  constructor(
    private router: Router,
    private supabaseAuthService: SupabaseAuthService,
    private userService: UserService,
    private loaderService: LoaderService
  ) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const raw = await firstValueFrom(this.userService.getUserState());
    const s = (raw as Partial<IUserState>) ?? {};
    const progress = (s.state ?? 'profile_not_completed') as UserProgressState;
    const activeCompId = s.active_competition_id ?? null;
    const targetUrl = state.url;

    if (progress === 'profile_not_completed') {
      if (targetUrl.startsWith('/complete-profile')) {
        return true; // già nella pagina giusta → permetti
      }
      return this.router.createUrlTree(['/complete-profile']); // redirect obbligatorio
    }
    return true;

  }
}
