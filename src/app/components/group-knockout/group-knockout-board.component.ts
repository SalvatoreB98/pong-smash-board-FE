import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../utils/translate.pipe';
import { ModalService } from '../../../services/modal.service';
import { Group, GroupPlayer, QUALIFIED_PER_GROUP } from '../../interfaces/group.interface';

@Component({
  selector: 'app-group-knockout-board',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './group-knockout-board.component.html',
  styleUrl: './group-knockout-board.component.scss'
})
export class GroupKnockoutBoardComponent {
  @Input() groups: Group[] = [];

  readonly qualifiedPerGroup = QUALIFIED_PER_GROUP;

  constructor(public modalService: ModalService) { }

  trackByGroup(_index: number, group: Group) {
    return group.id;
  }

  trackByPlayer(_index: number, player: GroupPlayer) {
    return player.id;
  }

  getPlayers(group: Group): GroupPlayer[] {
    if (!group?.players?.length) {
      return [];
    }

    const players = [...group.players];
    return players.sort((a, b) => {
      const rankA = this.resolveRanking(a);
      const rankB = this.resolveRanking(b);

      if (rankA != null && rankB != null && rankA !== rankB) {
        return rankA - rankB;
      }

      if (rankA != null && rankB == null) {
        return -1;
      }

      if (rankA == null && rankB != null) {
        return 1;
      }

      const pointsA = this.resolvePoints(a);
      const pointsB = this.resolvePoints(b);

      if (pointsA !== pointsB) {
        return pointsB - pointsA;
      }

      const winsA = Number.isFinite(a.wins) ? Number(a.wins) : 0;
      const winsB = Number.isFinite(b.wins) ? Number(b.wins) : 0;
      if (winsA !== winsB) {
        return winsB - winsA;
      }

      const scoreA = Number.isFinite(a.scoreDifference) ? Number(a.scoreDifference) : 0;
      const scoreB = Number.isFinite(b.scoreDifference) ? Number(b.scoreDifference) : 0;
      return scoreB - scoreA;
    });
  }

  isQualified(player: GroupPlayer, index: number): boolean {
    const ranking = this.resolveRanking(player);
    const effectiveRanking = ranking ?? index + 1;
    return effectiveRanking > 0 && effectiveRanking <= this.qualifiedPerGroup;
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

  private resolveRanking(player: GroupPlayer): number | null {
    const candidates = [player.ranking, player.rank, player.position];
    for (const value of candidates) {
      if (value == null) {
        continue;
      }
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
    return null;
  }

  private resolvePoints(player: GroupPlayer): number {
    const source = (player as unknown as { points?: number | string }).points;
    const numeric = Number(source ?? 0);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    return 0;
  }
}
