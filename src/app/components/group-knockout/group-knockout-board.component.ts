import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IPlayer } from '../../../services/players.service';
import { TranslatePipe } from '../../utils/translate.pipe';

@Component({
  selector: 'app-group-knockout-board',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './group-knockout-board.component.html',
  styleUrl: './group-knockout-board.component.scss'
})
export class GroupKnockoutBoardComponent {
  @Input() players: IPlayer[] = [];

  trackByPlayer(_index: number, player: IPlayer) {
    return player.id;
  }

  getInitials(player: IPlayer): string {
    const nickname = player.nickname ?? '';
    const name = player.name ?? '';
    const lastname = player.lastname ?? '';
    const source = nickname || `${name} ${lastname}`.trim();

    if (!source) {
      return '?';
    }

    const parts = source.split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return parts
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }
}
