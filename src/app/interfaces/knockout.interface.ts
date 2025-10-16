import { EliminationMatchSlot, EliminationRound } from './elimination-bracket.interface';
import { IPlayer } from '../../services/players.service';

export interface KnockoutPlayer {
  id: number | string;
  nickname: string;
  imageUrl?: string | null;
}

export interface KnockoutScore {
  player1?: number | null;
  player2?: number | null;
}

export interface KnockoutWinner {
  id: number | string;
  nickname?: string;
}

export interface KnockoutMatch {
  id?: number | string;
  player1?: KnockoutPlayer | null;
  player2?: KnockoutPlayer | null;
  score?: KnockoutScore | null;
  winner?: KnockoutWinner | null;
  nextMatchId?: number | string | null;
  [key: string]: unknown;
}

export interface KnockoutRound {
  name?: string | null;
  order?: number | string | null;
  matches?: (KnockoutMatch | null | undefined)[];
}

export interface KnockoutResponse {
  competitionId: number | string;
  rounds?: (KnockoutRound | null | undefined)[];
}

function mapKnockoutPlayer(player?: KnockoutPlayer | null): IPlayer | null {
  if (!player) {
    return null;
  }

  return {
    id: Number(player.id),
    name: player.nickname,
    nickname: player.nickname,
    image_url: player.imageUrl ?? undefined,
  };
}

function toRoundOrder(order: KnockoutRound['order'], fallback: number): number {
  if (order == null) {
    return fallback;
  }

  const numericOrder = typeof order === 'number' ? order : Number(order);
  return Number.isFinite(numericOrder) ? Number(numericOrder) : fallback;
}

export function mapKnockoutResponse(response: KnockoutResponse): EliminationRound[] {
  const rounds = Array.isArray(response?.rounds) ? [...response.rounds] : [];

  return rounds
    .filter((round): round is KnockoutRound => round != null)
    .sort((a, b) => toRoundOrder(a.order, 0) - toRoundOrder(b.order, 0))
    .map((round, roundIndex) => {
      const roundOrder = toRoundOrder(round.order, roundIndex + 1);
      const matches = Array.isArray(round.matches) ? round.matches : [];

      return {
        name: round.name ?? `Round ${roundOrder}`,
        roundNumber: roundOrder,
        matches: matches
          .filter((match): match is KnockoutMatch => match != null)
          .map((match, matchIndex) => {
            const player1 = mapKnockoutPlayer(match.player1 ?? null);
            const player2 = mapKnockoutPlayer(match.player2 ?? null);
            const slots: [EliminationMatchSlot, EliminationMatchSlot] = [
              { seed: 1, player: player1 },
              { seed: 2, player: player2 },
            ];

            const player1Score = match.score?.player1;
            const player2Score = match.score?.player2;

            return {
              id: String(match.id ?? `round-${roundOrder}-match-${matchIndex}`),
              slots,
              ...(player1Score !== undefined && player1Score !== null ? { player1Score } : {}),
              ...(player2Score !== undefined && player2Score !== null ? { player2Score } : {}),
              winnerId: match.winner?.id ?? null,
              matchData: match ?? null,
            };
          }),
      };
    });
}
