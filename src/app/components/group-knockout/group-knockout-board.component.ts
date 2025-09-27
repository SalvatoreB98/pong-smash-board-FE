import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../utils/translate.pipe';
import { ModalService } from '../../../services/modal.service';
import { Group, GroupPlayer } from '../../interfaces/group.interface';

@Component({
  selector: 'app-group-knockout-board',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './group-knockout-board.component.html',
  styleUrl: './group-knockout-board.component.scss'
})
export class GroupKnockoutBoardComponent {
  @Input() groups: Group[] = [];

  constructor(public modalService: ModalService) { }

  trackByGroup(_index: number, group: Group) {
    return group.id;
  }

  trackByPlayer(_index: number, player: GroupPlayer) {
    return player.id;
  }

  getInitials(player: GroupPlayer): string {
    const nickname = player.nickname ?? '';
    const name = player.name ?? '';
    const surname = player.surname ?? '';
    const source = nickname || `${name} ${surname}`.trim();

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

  get totalPlayers(): number {
    return this.groups.reduce((acc, group) => acc + group.players.length, 0);
  }
}
