import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { SupabaseAuthService } from './supabase-auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private supabaseAuthService: SupabaseAuthService, private router: Router) { }
  isLoggedIn() {
    return !!localStorage.getItem('user');
  }
  logout() {
    this.supabaseAuthService.signOut();
    this.router.navigate(['callback']);
  }
}
