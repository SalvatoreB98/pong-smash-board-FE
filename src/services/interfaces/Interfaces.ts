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

export enum UserProgressStateEnum {
  PROFILE_NOT_COMPLETED = 'profile_not_completed',
  PROFILE_COMPLETED = 'profile_completed',
  WITHOUT_COMPETITION = 'without_competition',
}
export interface IUserState {
  id: number;
  user_id: string; // UUID
  state: UserProgressState;
  active_competition_id: number | null;
  created_at: string; // ISO
  updated_at: string; // ISO
}