export interface IMatch {
  id: string;
  data: string;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  setsPoints: number[][];
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
