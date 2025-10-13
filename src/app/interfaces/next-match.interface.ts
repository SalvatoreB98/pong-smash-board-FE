import { IMatch } from './matchesInterfaces';

export interface INextMatchPlayer {
  id?: number | string | null;
  name?: string | null;
  img?: string | null;
}

type BaseNextMatch = Omit<IMatch, 'player1_name' | 'player2_name' | 'player1_img' | 'player2_img'>;

export interface INextMatch extends Partial<BaseNextMatch> {
  id: string;
  group_name?: string | null;
  groupName?: string | null;
  stage?: string | null;
  phase?: string | null;
  status?: string | null;
  countdown?: string | null;
  player1?: INextMatchPlayer | null;
  player2?: INextMatchPlayer | null;
  player1_img?: string | null;
  player2_img?: string | null;
  player1_name?: string | null;
  player2_name?: string | null;
  scheduled_at?: string | null;
  scheduledAt?: string | null;
  note?: string | null;
}
