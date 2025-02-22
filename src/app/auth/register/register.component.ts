import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  constructor(private fb: FormBuilder, private authService: SupabaseAuthService, private router: Router) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onRegister() {
    if (this.registerForm.invalid) return;

    const { email, password } = this.registerForm.value;
    const { data, error } = await this.authService.signUp(email, password);

    if (error) {
      console.error('Registration failed:', error.message);
    } else {
      console.log('User registered:', data);
      this.router.navigate(['/']); // Redirect to home after successful registration
    }
  }
}
