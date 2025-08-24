import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomeComponent } from "./home/home.component";
import { LoaderComponent } from './utils/components/loader/loader.component';
import { NavbarComponent } from './common/navbar/navbar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss',
  imports: [LoaderComponent, RouterOutlet, NavbarComponent]
})
export class AppComponent {
  title = 'pong-smash-board';
}
