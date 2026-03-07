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
import { CompetitionViewComponent } from './components/competition-view/competition-view.component';
import { EloRankingPanelComponent } from './components/elo-ranking-panel/elo-ranking-panel.component';

export const routes: Routes = [
  { path: 'landing', component: LandingComponent },
  { path: 'home-page', component: HomeComponent, canActivate: [AuthGuard, FlowGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'callback', component: CallbackComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard, FlowGuard], data: { title: 'profile' } },
  { path: 'complete-profile', component: CompleteProfileComponent, canActivate: [AuthGuard], data: { title: 'complete_profile' } },
  { path: 'competitions', component: CompetitionsComponent, canActivate: [AuthGuard], data: { title: 'competitions' } },
  { path: 'elo', component: EloRankingPanelComponent, canActivate: [AuthGuard, FlowGuard], data: { title: 'elo_ranking' } },
  { path: 'competition/:id', component: CompetitionViewComponent, data: { title: 'competition_details' } },
  { path: '**', redirectTo: 'home-page', pathMatch: 'full' }
];
