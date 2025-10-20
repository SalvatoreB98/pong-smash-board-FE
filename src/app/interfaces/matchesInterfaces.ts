export interface IMatchSet {
  id: number;
  match_id: number;
  player1_score: number;
  player2_score: number;
}

export type CompetitionMode = 'league' | 'elimination' | 'group_knockout';

import { KnockoutStage } from '../utils/enum';

export interface IMatch {
  date: string | number | Date;
  id: string;
  data: string;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  setsPoints: number[][];
  groupId?: string;
  player1_id?: number;
  player2_id?: number;
  winner_id?: number;
  created?: string;
  desc?: string;
  tournament_id?: number;
  competition_id?: number | string | null;
  player1_img?: string | null;
  player2_img?: string | null;
  match_sets?: IMatchSet[];
  competitionType?: CompetitionMode;
  competitionName?: string;
  roundName?: KnockoutStage | null;
  roundLabel?: KnockoutStage | string | null;
}

export interface IWins {
  [player: string]: number;
}

export interface ITotalPlayed {
  [player: string]: number;
}

export interface IPoints {
  [player: string]: string;
}

export interface IMonthlyWinRates {
  [month: string]: {
    [player: string]: string;
  };
}

export interface IBadges {
  [player: string]: string[];
}

export interface IGameData {
  players: string[];
  matches: IMatch[];
  wins: IWins;
  totPlayed: ITotalPlayed;
  points: IPoints;
  monthlyWinRates: IMonthlyWinRates;
  badges: IBadges;
}
