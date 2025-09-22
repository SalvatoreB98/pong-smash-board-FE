import { IPlayer } from '../../services/players.service';

export interface EliminationMatchSlot {
  seed: number;
  player: IPlayer | null;
  score?: number | null;
}

export interface EliminationMatch {
  id: string;
  slots: [EliminationMatchSlot, EliminationMatchSlot];
  winnerId?: number | string | null;
}

export interface EliminationRound {
  name: string;
  matches: EliminationMatch[];
}
