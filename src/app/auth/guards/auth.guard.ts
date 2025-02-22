import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: SupabaseAuthService, private router: Router) { }

  async canActivate(): Promise<boolean> {
    const { data } = await this.authService.getUser();
    if (data?.user) {
      this.router.navigate(['/']); // Redirect to home if already logged in
      return false;
    }
    return true; // Allow access if NOT logged in
  }
}
