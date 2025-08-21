// src/app/types/ranking.ts
export interface IRankingItem {
  playerid: number;
  name: string;
  image_url: string | null;
  played: number;
  wins: number;
  winrate: number; // percentuale (es. 62.5)
}
export interface IRankingResponse {
  ranking: IRankingItem[];
  generatedAt: string;
}
