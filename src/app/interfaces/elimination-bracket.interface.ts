import { IPlayer } from '../../services/players.service';
import { IMatch } from './matchesInterfaces';
import { KnockoutStage } from '../utils/enum';

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
  roundKey?: KnockoutStage | null;
  roundLabel?: KnockoutStage | string | null;
  created?: string | null;
}

export interface EliminationRound {
  name: string;
  matches: EliminationMatch[];
  roundNumber: number;
  stage?: KnockoutStage | null;
}
