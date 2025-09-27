import { EliminationRound } from './elimination-bracket.interface';
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
}

export interface GroupStageResponse {
  groups: Group[];
  knockout?: KnockoutStageData;
}

export interface KnockoutStageData {
  rounds?: EliminationRound[];
  qualifiedPlayers?: GroupPlayer[];
}

export function mapGroupPlayerToIPlayer(player: GroupPlayer): IPlayer {
  return {
    id: Number(player.id),
    name: player.name,
    lastname: player.surname,
    nickname: player.nickname,
    image_url: player.imageUrl,
  };
}
