import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../utils/translate.pipe';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';

export const SHARED_IMPORTS = [
  CommonModule,
  RouterModule,
  TranslatePipe,
  DropdownComponent,
  ReactiveFormsModule,
  LoadingButtonComponent,
];
