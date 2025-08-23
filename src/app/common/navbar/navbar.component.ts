import { Component } from '@angular/core';
import { TranslationService } from '../../../services/translation.service';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../utils/translate.pipe';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isDropdownOpen: boolean = false;
  isMenuOpen: boolean = false;
  isMobile: boolean = window.innerWidth <= 768;

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

}
