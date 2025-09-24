import { IMatch } from './matchesInterfaces';

export interface IMatchResponse {
  matches: IMatch[] | any;
  matchesElimination?: IMatch[] | null;
  points: any;
  totPlayed: {};
  wins: {};
  id: string;
  data: string;
  giocatore1: string;
  giocatore2: string;
  p1: number | string;
  p2: number | string;
  setsPoints: number[];
}