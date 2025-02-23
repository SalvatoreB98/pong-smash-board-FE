import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseAuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.ANON
    );
  }

  /** Sign Up User */
  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  /** Login User */
  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  /** Logout User */
  async signOut() {
    return this.supabase.auth.signOut();
  }

  /** Get Current User */
  async getUser() {
    return this.supabase.auth.getUser();
  }

  /** Refresh Token (Handled Automatically by Supabase) */
  async refreshSession() {
    return this.supabase.auth.refreshSession();
  }
  /** Sign in with Google */
  async signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`, // Change this if needed
      },
    });
  }
  async getUserSession() {
    return await this.supabase.auth.getSession();
  }
}
