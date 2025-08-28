import { Component, inject } from '@angular/core';
import { TranslationService } from '../../../services/translation.service';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../utils/translate.pipe';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterOutlet } from '@angular/router';
import { UserProgressStateEnum } from '../../utils/enum';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from '../../../services/user.service';
import { SHARED_IMPORTS } from '../imports/shared.imports';

@Component({
  selector: 'app-navbar',
  imports: [...SHARED_IMPORTS],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  userService = inject(UserService);
  userState$ = this.userService.getState();
  
  isDropdownOpen: boolean = false;
  isMenuOpen: boolean = false;
  isMobile: boolean = window.innerWidth <= 768;
  PROGRESS_STATE = UserProgressStateEnum;
    
  constructor(public translateService: TranslationService, public auth: AuthService, public router: Router) {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }
  ngOnChanges() {
    this.auth.checkAuth()
  }
  langChange(e: any) {
    console.log(e)
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.router.navigate(['/login']);
    this.auth.logout();
  }
  
  trackByLang = (_: number, l: { code: string }) => l.code;
  logga() {
    console.log(this.auth.isLoggedIn$.value);
  }
}
