import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../utils/translate.pipe';
import { ReactiveFormsModule } from '@angular/forms';

export const SHARED_IMPORTS = [CommonModule, RouterModule, TranslatePipe, ReactiveFormsModule];