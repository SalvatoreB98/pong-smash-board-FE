import { IPlayer } from '../../services/players.service';
import { IMatch } from './matchesInterfaces';

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
  matchData?: IMatch | null;
  roundKey?: string | null;
  roundLabel?: string;
}

export interface EliminationRound {
  name: string;
  matches: EliminationMatch[];
  roundNumber: number;
}
