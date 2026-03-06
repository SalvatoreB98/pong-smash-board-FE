import { IRankingItem } from '../../services/data.service';

/** ELO K-factor — ogni partita vale al massimo 32 punti */
export const ELO_K = 32;
/** Rating iniziale assegnato ai nuovi giocatori */
export const ELO_DEFAULT = 1000;

// ─────────────────────────────────────────────────
// Core ELO formula
// ─────────────────────────────────────────────────

/**
 * Probabilità attesa di vittoria del giocatore A.
 *   E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
export function expectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calcola i nuovi rating dopo una partita.
 * @param ratingA  Rating corrente del giocatore A
 * @param ratingB  Rating corrente del giocatore B
 * @param scoreA   1 se A ha vinto, 0 se B ha vinto, 0.5 per pari
 * @returns { newA, newB, deltaA, deltaB, eA, eB }
 */
export function calcNewRatings(
    ratingA: number,
    ratingB: number,
    scoreA: 1 | 0 | 0.5
): EloMatchResult {
    const eA = expectedScore(ratingA, ratingB);
    const eB = 1 - eA;
    const scoreB = 1 - scoreA;

    const deltaA = ELO_K * (scoreA - eA);
    const deltaB = ELO_K * (scoreB - eB);

    return {
        newA: Math.round(ratingA + deltaA),
        newB: Math.round(ratingB + deltaB),
        deltaA: Math.round(deltaA),
        deltaB: Math.round(deltaB),
        eA,
        eB,
    };
}

// ─────────────────────────────────────────────────
// Fair Play pairing
// ─────────────────────────────────────────────────

export interface FairPlayPairing {
    player1: Pick<IRankingItem, 'playerid' | 'nickname' | 'rating'>;
    player2: Pick<IRankingItem, 'playerid' | 'nickname' | 'rating'>;
    eloDiff: number;
    /** Probabilità di vittoria attesa per player1 (0-100 %) */
    winChanceP1Pct: number;
}

/**
 * Genera suggerimenti di accoppiamento "Fair Play" ordinati per minima
 * differenza ELO (più equilibrato prima).
 *
 * Algoritmo: tutte le combinazioni uniche tra i giocatori,
 *            ordinate per |R_A - R_B| crescente.
 */
export function generateFairPlayPairings(
    players: IRankingItem[]
): FairPlayPairing[] {
    const pairings: FairPlayPairing[] = [];

    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const a = players[i];
            const b = players[j];
            const rA = a.rating ?? ELO_DEFAULT;
            const rB = b.rating ?? ELO_DEFAULT;
            const eloDiff = Math.abs(rA - rB);
            const eA = expectedScore(rA, rB);

            pairings.push({
                player1: { playerid: a.playerid, nickname: a.nickname, rating: rA },
                player2: { playerid: b.playerid, nickname: b.nickname, rating: rB },
                eloDiff,
                winChanceP1Pct: Math.round(eA * 100),
            });
        }
    }

    // Ordina: più equilibrato (minor diff) prima
    return pairings.sort((a, b) => a.eloDiff - b.eloDiff);
}

// ─────────────────────────────────────────────────
// JSON export
// ─────────────────────────────────────────────────

export interface EloJsonExport {
    generatedAt: string;
    rankings: EloRankingEntry[];
    fairPlayPairings: FairPlayPairing[];
}

export interface EloRankingEntry {
    rank: number;
    playerid: number;
    nickname: string;
    rating: number;
    played: number;
    wins: number;
    winrate: number;
}

export interface EloMatchResult {
    newA: number;
    newB: number;
    deltaA: number;
    deltaB: number;
    /** Expected score for A (0..1) */
    eA: number;
    /** Expected score for B (0..1) */
    eB: number;
}

/**
 * Genera un oggetto JSON pronto per l'integrazione nel frontend/backend.
 */
export function buildEloJsonExport(
    rankings: IRankingItem[],
    pairings: FairPlayPairing[]
): EloJsonExport {
    return {
        generatedAt: new Date().toISOString(),
        rankings: rankings.map((item, i) => ({
            rank: i + 1,
            playerid: item.playerid,
            nickname: item.nickname ?? item.name,
            rating: item.rating ?? ELO_DEFAULT,
            played: item.played,
            wins: item.wins,
            winrate: item.winrate,
        })),
        fairPlayPairings: pairings,
    };
}
