import { Component } from '@angular/core';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { TranslatePipe } from '../../utils/translate.pipe';

@Component({
  selector: 'app-profile',
  imports: [NavbarComponent, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

}
