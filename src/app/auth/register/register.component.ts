import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, ValidationErrors, ValidatorFn, AbstractControl } from '@angular/forms';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../utils/translate.pipe';
import { RegistrationNavbarComponent } from '../login/registration-navbar/registration-navbar.component';
import { LoaderService } from '../../../services/loader.service';
import { MSG_TYPE } from '../../utils/enum';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, RegistrationNavbarComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private supabaseAuthService: SupabaseAuthService,
    private router: Router,
    private loaderService: LoaderService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    },
      { validators: this.passwordsMatch }
    );
  }

  async onRegister(event?: SubmitEvent) {
    event?.preventDefault();

    if (this.registerForm.invalid) {
      const firstError = this.registerForm.errors ? Object.values(this.registerForm.errors)[0] : null;
      this.loaderService.showToast(firstError || 'Registration failed. Please try again.', MSG_TYPE.ERROR, 5000);
      return;
    }

    const button = this.resolveButton(event);
    if (button) {
      button.disabled = true;
      this.loaderService.addSpinnerToButton(button);
    }

    const { email, password } = this.registerForm.value;
    const { data, error } = await this.supabaseAuthService.signUp(email, password);

    if (error) {
      console.error('Registration failed:', error.message);
      this.loaderService.showToast(error.message || 'Registration failed. Please try again.', MSG_TYPE.ERROR, 5000);
    } else {
      console.log('User registered:', data);
      this.loaderService.showToast('Registration successful! Please check your email to verify your account.', MSG_TYPE.SUCCESS, 5000);

      this.router.navigate(['/complete-profile']);
    }

    if (button) {
      button.disabled = false;
      this.loaderService.removeSpinnerFromButton(button);
    }
  }
  async googleSignIn(event: Event) {
    event.preventDefault();
    const button = this.resolveButton(event);
    if (button) {
      button.disabled = true;
      this.loaderService.addSpinnerToButton(button);
    }

    try {
      await this.supabaseAuthService.signInWithGoogle();
    } finally {
      if (button) {
        button.disabled = false;
        this.loaderService.removeSpinnerFromButton(button);
      }
    }
  }
  private readonly passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    console.log(this.registerForm)
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    return p && c && p !== c ? { passwordMismatch: true } : null;
  };

  private resolveButton(event?: Event): HTMLButtonElement | null {
    if (!event) return null;
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | undefined;
    if (submitter) return submitter;

    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLButtonElement) return target;
    return target?.closest('button') as HTMLButtonElement | null;
  }
}
