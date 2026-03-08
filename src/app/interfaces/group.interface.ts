import type { KnockoutPlayer, KnockoutRound } from './knockout.interface';
import { IPlayer } from '../../services/players.service';

export interface Group {
  id: string;
  name: string;
  competitionId: string;
  players: GroupPlayer[];
}

export interface GroupPlayer {
  id: string;
  name: string;
  surname?: string;
  nickname?: string;
  imageUrl?: string;
  points: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
  scoreDifference?: number;
  ranking?: number;
  rank?: number;
  position?: number;
  matchesToPlay?: number;
  matchesRemaining?: number;
}

export interface GroupStageResponse {
  groups: Group[];
  knockout?: KnockoutStageData;
}

export interface KnockoutStageData {
  competitionId?: number | string | null;
  rounds?: (KnockoutRound | null | undefined)[];
  qualifiedPlayers?: (GroupPlayer | KnockoutPlayer | null | undefined)[];
}

export const QUALIFIED_PER_GROUP = 2;

export function mapGroupPlayerToIPlayer(player: GroupPlayer): IPlayer {
  return {
    id: Number(player.id),
    name: player.name,
    lastname: player.surname,
    nickname: player.nickname,
    image_url: player.imageUrl,
  };
}
