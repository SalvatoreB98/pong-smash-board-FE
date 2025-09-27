import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './utils/components/loader/loader.component';
import { NavbarComponent } from './common/navbar/navbar.component';
import { DebugOverlayComponent } from '../debug-overlay/debug-overlay.component';
import { SHARED_IMPORTS } from './common/imports/shared.imports';
import { MenuDropdownComponent } from './common/menu-dropdown/menu-dropdown.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss',
  imports: [LoaderComponent, RouterOutlet, NavbarComponent, DebugOverlayComponent, MenuDropdownComponent, SHARED_IMPORTS]
})
export class AppComponent {
  title = 'pong-smash-board';
  isLandingPage = window.location.pathname.includes('/landing');
}
