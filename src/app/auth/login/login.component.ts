import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../utils/translate.pipe';
import { NavbarComponent } from '../../common/navbar/navbar.component';

@Component({
  selector: 'app-login',
imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, NavbarComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  constructor(private fb: FormBuilder, private authService: SupabaseAuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onLogin() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    const { data, error } = await this.authService.signUp(email, password);

    if (error) {
      console.error('Registration failed:', error.message);
    } else {
      console.log('User logined:', data);
      this.router.navigate(['/']); // Redirect to home after successful registration
    }
  }
  async googleSignIn() {
    await this.authService.signInWithGoogle();
  }
}
