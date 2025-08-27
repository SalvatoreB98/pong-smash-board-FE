// src/app/types/ranking.ts
export interface IRankingItem {
  playerid: number;
  name: string;
  image_url: string | null;
  played: number;
  wins: number;
  winrate: number;
  rating: number; // percentuale (es. 62.5)
}
export interface IRankingResponse {
  ranking: IRankingItem[];
  generatedAt: string;
}
export interface RankingData {
  ranking: IRankingItem[];
  generatedAt: string;
}

export type UserProgressState =
  | 'profile_not_completed'
  | 'profile_completed'
  | 'without_competition';


export interface IUserState {
  user_state_id: number;
  user_id: string; // UUID dell'auth user
  state: string;   // es. "profile_completed"
  active_competition_id: number | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  nickname: string;
  player_id: number;
  image_url: string;
  email: string;
  name: string | null;
  lastname: string | null;
}