export interface IMatchSet {
  id: number;
  match_id: number;
  player1_score: number;
  player2_score: number;
}

export type CompetitionMode = 'league' | 'elimination';

export interface IMatch {
  id: string;
  data: string;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  setsPoints: number[][];
  player1_id?: number;
  player2_id?: number;
  winner_id?: number;
  created?: string;
  desc?: string;
  tournament_id?: number;
  player1_img?: string | null;
  player2_img?: string | null;
  match_sets?: IMatchSet[];
  competitionType?: CompetitionMode;
  competitionName?: string;
  roundName?: string | null;
  roundLabel?: string;
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
