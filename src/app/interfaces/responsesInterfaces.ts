export interface IMatchResponse {
  id: string;
  data: string;
  giocatore1: string;
  giocatore2: string;
  p1: number | string;
  p2: number | string;
  setsPoints: number[];
}