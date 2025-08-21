export interface Match {
  player1_score: number | string;
  player2_score: number | string;
  player1_name: string;
  player2_name: string;
  p1: number | string;
  p2: number | string;
  player1_img?: string;
  player2_img?: string;
}

export interface PlayerStanding {
  image_url?: string; 
  playerName: string;
  wins: number;
  lost: number;
  totalPlayed: number;
  winRate: number; // 0..100
  rating?: number; 
}

export interface HeadToHeadRow {
  player1: string;
  player2: string;
  scored1: number;
  scored2: number;
  player1_img?: string;
  player2_img?: string;
}