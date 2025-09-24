import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { CallbackComponent } from './auth/callback/callback.component';
import { LoginComponent } from './auth/login/login.component';
import { FlowGuard } from './auth/guards/flow.guard';
import { HomeComponent } from './components/home.component';
import { LandingComponent } from './components/landing/landing.component';
import { CompetitionsComponent } from './components/competitions/competitions/competitions.component';
import { ProfileComponent } from './components/profile/profile/profile.component';
import { CompleteProfileComponent } from './components/profile/complete-profile/complete-profile.component';

export const routes: Routes = [
  { path: 'landing', component: LandingComponent },
  { path: 'home-page', component: HomeComponent, canActivate: [AuthGuard, FlowGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'callback', component: CallbackComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard, FlowGuard] },
  { path: 'complete-profile', component: CompleteProfileComponent, canActivate: [AuthGuard] },
  { path: 'competitions', component: CompetitionsComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'home-page', pathMatch: 'full' }
];
