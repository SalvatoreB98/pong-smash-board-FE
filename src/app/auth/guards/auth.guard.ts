import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const isLoggedIn = !!localStorage.getItem('token'); // Check if user has a token (Modify based on your auth logic)

    if (isLoggedIn) {
      this.router.navigate(['/']); // Redirect logged-in users to home
      return false;
    }

    return true; // Allow access if NOT logged in
  }
}
