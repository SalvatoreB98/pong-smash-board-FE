import { EliminationMatchSlot, EliminationRound } from './elimination-bracket.interface';
import { IPlayer } from '../../services/players.service';
import { KnockoutStage, knockoutStageOrder, toKnockoutStage } from '../utils/enum';

/* ===========================
   Interfacce API knockout
=========================== */

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
  stage?: KnockoutStage | string | null;
  stageLabel?: string | null;
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
  qualifiedPlayers?: (KnockoutPlayer | null | undefined)[];
}

/* ===========================
   Helper functions
=========================== */

function mapKnockoutPlayer(player?: KnockoutPlayer | null): IPlayer | null {
  if (!player) return null;

  return {
    id: Number(player.id),
    name: player.nickname,
    nickname: player.nickname,
    image_url: player.imageUrl ?? undefined,
  };
}

function toRoundOrder(order: KnockoutRound['order'], fallback: number): number {
  const numericOrder =
    typeof order === 'number'
      ? order
      : order != null
        ? Number(order)
        : fallback;
  return Number.isFinite(numericOrder) ? numericOrder : fallback;
}

/* ===========================
   Main mapper
=========================== */

export function mapKnockoutResponse(response: Pick<KnockoutResponse, 'rounds'>): EliminationRound[] {
  const rounds = Array.isArray(response?.rounds) ? [...response.rounds] : [];

  return rounds
    .filter((round): round is KnockoutRound => round != null)
    .sort((a, b) => {
      const stageOrderA = knockoutStageOrder(toKnockoutStage(a.name ?? null));
      const stageOrderB = knockoutStageOrder(toKnockoutStage(b.name ?? null));
      if (stageOrderA !== stageOrderB) {
        return stageOrderA - stageOrderB;
      }
      return toRoundOrder(a.order, 0) - toRoundOrder(b.order, 0);
    })
    .map((round, roundIndex) => {
      const stage = toKnockoutStage(round.name);
      const roundOrderFromStage = knockoutStageOrder(stage);
      const roundOrder =
        roundOrderFromStage !== Number.POSITIVE_INFINITY
          ? roundOrderFromStage
          : toRoundOrder(round.order, roundIndex + 1);
      const roundLabel = stage ?? (round.name ? String(round.name) : null);
      const matches = Array.isArray(round.matches) ? round.matches : [];

      return {
        name: roundLabel ?? `Round ${roundOrder}`,
        roundNumber: roundOrder,
        stage,
        matches: matches
          .filter((match): match is KnockoutMatch => match != null)
          .map((match, matchIndex) => {
            const player1 = mapKnockoutPlayer(match.player1 ?? null);
            const player2 = mapKnockoutPlayer(match.player2 ?? null);

            const matchStage = toKnockoutStage(match.stage ?? stage ?? null);
            const resolvedStage = matchStage ?? stage ?? null;
            const labelSource = match.stageLabel ?? roundLabel ?? resolvedStage ?? null;

            const slots: [EliminationMatchSlot, EliminationMatchSlot] = [
              { seed: 1, player: player1 },
              { seed: 2, player: player2 },
            ];

            const player1Score = match.score?.player1 ?? null;
            const player2Score = match.score?.player2 ?? null;

            return {
              id: String(match.id ?? `round-${roundOrder}-match-${matchIndex}`),
              slots,
              ...(player1Score != null ? { player1Score } : {}),
              ...(player2Score != null ? { player2Score } : {}),
              winnerId: match.winner?.id ?? null,
              roundKey: resolvedStage,
              roundLabel: labelSource,
              matchData: mapToIMatch(match, resolvedStage, labelSource),
            };
          }),
      };
    });
}

/* ===========================
   Mapping KnockoutMatch → IMatch
=========================== */

function mapToIMatch(
  match: KnockoutMatch,
  stage: KnockoutStage | null,
  roundLabel: string | KnockoutStage | null,
): any {
  return {
    id: match.id != null ? String(match.id) : '',
    date: '',
    data: '',
    player1_id: match.player1?.id ? Number(match.player1.id) : null,
    player2_id: match.player2?.id ? Number(match.player2.id) : null,
    player1_name: match.player1?.nickname ?? '',
    player2_name: match.player2?.nickname ?? '',
    player1_score: match.score?.player1 ?? null,
    player2_score: match.score?.player2 ?? null,
    winner_id: match.winner?.id ? Number(match.winner.id) : null,
    group_id: null,
    next_match_id: match.nextMatchId ?? null,
    roundName: stage ?? null,
    roundLabel: roundLabel ?? undefined,
  };
}
