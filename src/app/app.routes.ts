import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { CallbackComponent } from './auth/callback/callback.component';
import { LoginComponent } from './auth/login/login.component';
import { ProfileComponent } from './profile/profile/profile.component';
import { CompetitionsComponent } from './home/competitions/competitions/competitions.component';
import { CompleteProfileComponent } from './profile/complete-profile/complete-profile.component';
import { CompetitionStartComponent } from './profile/complete-profile/competition-start/competition-start.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'callback', component: CallbackComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'complete-profile', component: CompleteProfileComponent, canActivate: [AuthGuard] },
  { path: 'competitions', component: CompetitionsComponent, canActivate: [AuthGuard] },
  { path: 'competition-start', component: CompetitionStartComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];