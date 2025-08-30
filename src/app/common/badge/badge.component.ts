import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  standalone: true,
})
export class BadgeComponent {

  @Input() type: string | undefined; // es. "gold", "silver", "bronze"
  @Input() label?: string; // opzionale per tooltip o testo
  @Input() iconPath?: string; // opzionale per icona personalizzata

  constructor() {}  
}