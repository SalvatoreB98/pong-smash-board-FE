import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service'; // Make sure the path is correct
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { LoaderComponent } from '../../utils/components/loader/loader.component';

@Component({
  selector: 'app-callback',
  imports: [LoaderComponent],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss',
})
export class CallbackComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router, private supabaseService: SupabaseAuthService) { }

  async ngOnInit() {
    try {
      const { data, error } = await this.supabaseService.getUserSession();

      if (error) {
        console.error('Error retrieving session:', error);
        return;
      }

      if (data?.session) {
        console.log('User signed in:', data.session.user);
        localStorage.setItem('user', JSON.stringify(data.session.user));
      }

      this.router.navigate(['/']);
    } catch (err) {
      console.error('Error handling authentication:', err);
    }
  }
}
