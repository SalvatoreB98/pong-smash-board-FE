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

  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async getUser() {
    return this.supabase.auth.getUser();
  }

  async refreshSession() {
    return this.supabase.auth.refreshSession();
  }
  async signInWithGoogle() {
    const isLocalhost = window.location.hostname === 'localhost';

    const redirectUrl = isLocalhost
      ? 'http://localhost:4200/callback'
      : environment.apiUrl + '/callback';

    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
  }

  async getUserSession() {
    return await this.supabase.auth.getSession();
  }
  
  async getAccessToken(): Promise<string | null> {
    const session = (await this.getUserSession()).data.session;
    return session?.access_token || null;
  }
}
