import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private supabaseAuthService: SupabaseAuthService) { }

  async canActivate(): Promise<boolean> {
    const session = await this.supabaseAuthService.getUserSession();

    if (session?.data.session) {
      // User is logged in, allow them to access the page
      return true;
    } else {
      // User is not logged in, redirect them to login
      this.router.navigate(['login']);
      return false;
    }
  }
}
