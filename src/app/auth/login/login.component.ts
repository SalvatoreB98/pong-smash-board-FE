import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../utils/translate.pipe';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { RegistrationNavbarComponent } from './registration-navbar/registration-navbar.component';
import { AuthService } from '../../../services/auth.service';
import { LoaderService } from '../../../services/loader.service';
import { MSG_TYPE } from '../../utils/enum';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, NavbarComponent, RegistrationNavbarComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private supabaseAuthService: SupabaseAuthService,
    private router: Router,
    private auth: AuthService,
    private loaderService: LoaderService // Assuming you have a loader service for error handling
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onLogin() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    const { data, error } = await this.supabaseAuthService.signIn(email, password);

    if (error) {
      console.error('Login failed:', error.code);
      this.loaderService.showToast(error.code || 'Login failed. Please try again.', MSG_TYPE.ERROR, 5000);
    } else {
      console.log('User logged in:', data);
      this.loaderService.showToast('Login successful!', MSG_TYPE.SUCCESS, 3000);
      this.router.navigate(['/']); // Redirect to home after successful registration
      this.auth.checkAuth()
    }
  }
  async googleSignIn() {
    await this.supabaseAuthService.signInWithGoogle();
  }

}
