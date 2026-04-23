import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../utils/translate.pipe';
import { IMatch } from '../../interfaces/matchesInterfaces';

export interface PlayerStreak {
  playerid: string | number;
  nickname: string;
  image_url: string;
  currentStreak: number;
  maxStreak: number;
}

@Component({
  selector: 'app-player-streaks',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './player-streaks.component.html',
  styleUrls: ['./player-streaks.component.scss']
})
export class PlayerStreaksComponent implements OnChanges {
  @Input() matches: IMatch[] = [];

  streaks: PlayerStreak[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matches']) {
      this.calculateStreaks();
    }
  }

  private calculateStreaks() {
    if (!this.matches || this.matches.length === 0) {
      this.streaks = [];
      return;
    }

    const streaksMap = new Map<string, PlayerStreak>();

    // Ordina cronologicamente le partite per calcolare correttamente le serie
    const sortedMatches = [...this.matches].sort((a, b) => {
      const dateA = new Date(a.date || a.created || 0).getTime();
      const dateB = new Date(b.date || b.created || 0).getTime();
      return dateA - dateB;
    });

    sortedMatches.forEach(m => {
      const p1Str = String(m.player1_id || m.player1_name);
      const p2Str = String(m.player2_id || m.player2_name);
      
      if (!streaksMap.has(p1Str)) {
        streaksMap.set(p1Str, {
          playerid: p1Str,
          nickname: m.player1_name,
          image_url: m.player1_img || '/default-player.jpg',
          currentStreak: 0,
          maxStreak: 0
        });
      }
      
      if (!streaksMap.has(p2Str)) {
        streaksMap.set(p2Str, {
          playerid: p2Str,
          nickname: m.player2_name,
          image_url: m.player2_img || '/default-player.jpg',
          currentStreak: 0,
          maxStreak: 0
        });
      }

      const s1 = streaksMap.get(p1Str)!;
      const s2 = streaksMap.get(p2Str)!;

      const score1 = Number(m.player1_score) || 0;
      const score2 = Number(m.player2_score) || 0;

      if (score1 > score2) {
        // P1 vince, P2 perde
        s1.currentStreak++;
        s2.currentStreak = 0;
        if (s1.currentStreak > s1.maxStreak) {
          s1.maxStreak = s1.currentStreak;
        }
      } else if (score2 > score1) {
        // P2 vince, P1 perde
        s2.currentStreak++;
        s1.currentStreak = 0;
        if (s2.currentStreak > s2.maxStreak) {
          s2.maxStreak = s2.currentStreak;
        }
      } else {
        // Pareggio: serie di imbattibilità non si interrompe (cresce)
        s1.currentStreak++;
        s2.currentStreak++;
        if (s1.currentStreak > s1.maxStreak) s1.maxStreak = s1.currentStreak;
        if (s2.currentStreak > s2.maxStreak) s2.maxStreak = s2.currentStreak;
      }
    });

    // Converte in array e ordina in base al Max Streak (decrescente)
    this.streaks = Array.from(streaksMap.values()).sort((a, b) => {
      if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
      return b.currentStreak - a.currentStreak; // tiebreaker: current streak
    });
  }
}
