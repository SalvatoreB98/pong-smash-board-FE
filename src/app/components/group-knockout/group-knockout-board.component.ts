import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { IPlayer } from '../../../services/players.service';
import { TranslatePipe } from '../../utils/translate.pipe';

interface PlayerRow {
  id: string;
  name: string;
  lastname: string;
  nickname?: string;
  victories: number;
  points: number;
  defeats: number;
  image_url?: string;
}

interface GroupedPlayers {
  name: string;
  players: PlayerRow[];
}

@Component({
  selector: 'app-group-knockout-board',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './group-knockout-board.component.html',
  styleUrl: './group-knockout-board.component.scss'
})
export class GroupKnockoutBoardComponent implements OnChanges {
  @Input() players: IPlayer[] = [];
  @Input() groupSize = 4;

  groupedPlayers: GroupedPlayers[] = [];

  ngOnChanges() {
    this.groupPlayers();
  }

  private groupPlayers() {
    this.groupedPlayers = [];
    if (!this.players || this.players.length === 0) return;

    // Trasforma IPlayer in PlayerRow con valori iniziali
    const playerRows: PlayerRow[] = this.players.map(player => ({
      id: String(player.id),
      name: player.name ?? '',
      lastname: player.lastname ?? '',
      nickname: player.nickname,
      victories: 0,
      points: 0,
      defeats: 0,
      image_url: player.image_url
    }));

    for (let i = 0; i < playerRows.length; i += this.groupSize) {
      const groupNumber = Math.floor(i / this.groupSize) + 1;
      this.groupedPlayers.push({
        name: groupNumber.toString(),
        players: playerRows.slice(i, i + this.groupSize)
      });
    }
  }

  trackByPlayer(_index: number, player: PlayerRow) {
    return player.id;
  }

  getInitials(player: PlayerRow): string {
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
