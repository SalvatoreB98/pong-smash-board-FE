import { IPlayer } from '../../services/players.service';

export interface EliminationMatchSlot {
  seed: number;
  player: IPlayer | null;
}

export interface EliminationMatch {
  id: string;
  slots: [EliminationMatchSlot, EliminationMatchSlot];
  winnerId?: number | string | null;
  player1Score?: number;
  player2Score?: number;
}

export interface EliminationRound {
  name: string;
  matches: EliminationMatch[];
  roundNumber: number;
}
