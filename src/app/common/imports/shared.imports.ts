import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../utils/translate.pipe';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { ReactiveFormsModule } from '@angular/forms';

export const SHARED_IMPORTS = [CommonModule, RouterModule, TranslatePipe, DropdownComponent, ReactiveFormsModule];