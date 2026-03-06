import {
    expectedScore,
    calcNewRatings,
    generateFairPlayPairings,
    buildEloJsonExport,
    ELO_K,
    ELO_DEFAULT,
} from './elo.utils';
import { IRankingItem } from '../../services/data.service';

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

function mockPlayer(id: number, rating: number): IRankingItem {
    return {
        id,
        playerid: id,
        name: `Player ${id}`,
        nickname: `P${id}`,
        image_url: null,
        played: 10,
        wins: 5,
        winrate: 50,
        rating,
    };
}

// ───────────────────────────────────────────────────────────────
// expectedScore
// ───────────────────────────────────────────────────────────────

describe('expectedScore', () => {
    it('should return 0.5 when ratings are equal', () => {
        expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 5);
    });

    it('should return > 0.5 when ratingA > ratingB', () => {
        expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5);
    });

    it('should return < 0.5 when ratingA < ratingB', () => {
        expect(expectedScore(1000, 1200)).toBeLessThan(0.5);
    });

    it('should be symmetric: E_A + E_B = 1', () => {
        const eA = expectedScore(1300, 1100);
        const eB = expectedScore(1100, 1300);
        expect(eA + eB).toBeCloseTo(1, 10);
    });

    /**
     * Ground-truth check: against known ELO table values.
     * 200-pt difference → E_A ≈ 0.7597 (USCF standard table).
     */
    it('should match known value for 200-pt diff', () => {
        expect(expectedScore(1200, 1000)).toBeCloseTo(0.7597, 3);
    });
});

// ───────────────────────────────────────────────────────────────
// calcNewRatings
// ───────────────────────────────────────────────────────────────

describe('calcNewRatings', () => {
    it('winner gains points, loser loses equal amount (zero sum)', () => {
        const { deltaA, deltaB } = calcNewRatings(1000, 1000, 1);
        // K*(1-0.5) = 16 for winner, K*(0-0.5) = -16 for loser
        expect(deltaA + deltaB).toBe(0);
        expect(deltaA).toBe(16);
        expect(deltaB).toBe(-16);
    });

    it('upset win: lower-rated winner gains more than expected', () => {
        const { deltaA } = calcNewRatings(1000, 1200, 1);
        // lower-rated wins => higher reward
        expect(deltaA).toBeGreaterThan(16);
    });

    it('expected win: higher-rated winner gains less', () => {
        const { deltaA } = calcNewRatings(1200, 1000, 1);
        // higher-rated wins => lower reward
        expect(deltaA).toBeLessThan(16);
    });

    it('draw when equal ratings: delta = 0 for both', () => {
        const { deltaA, deltaB } = calcNewRatings(1000, 1000, 0.5);
        expect(deltaA).toBe(0);
        expect(deltaB).toBe(0);
    });

    it('K-factor cap: max gain is K (upset against equal player)', () => {
        // Maximum gain for A is when A loses (delta = K*(0 - E_A)).
        // Here we just verify no result exceeds K.
        const { deltaA } = calcNewRatings(ELO_DEFAULT, ELO_DEFAULT, 1);
        expect(Math.abs(deltaA)).toBeLessThanOrEqual(ELO_K);
    });

    it('returns rounded integers', () => {
        const { newA, newB } = calcNewRatings(1150, 975, 1);
        expect(Number.isInteger(newA)).toBeTrue();
        expect(Number.isInteger(newB)).toBeTrue();
    });
});

// ───────────────────────────────────────────────────────────────
// generateFairPlayPairings
// ───────────────────────────────────────────────────────────────

describe('generateFairPlayPairings', () => {
    const players = [
        mockPlayer(1, 1000),
        mockPlayer(2, 1050),
        mockPlayer(3, 1200),
    ];

    it('generates C(n,2) unique pairings', () => {
        expect(generateFairPlayPairings(players).length).toBe(3);
    });

    it('sorts by ascending ELO difference (most balanced first)', () => {
        const pairings = generateFairPlayPairings(players);
        for (let i = 1; i < pairings.length; i++) {
            expect(pairings[i].eloDiff).toBeGreaterThanOrEqual(pairings[i - 1].eloDiff);
        }
    });

    it('winChanceP1Pct is > 50 when player1 has higher rating', () => {
        const pairings = generateFairPlayPairings(players);
        const highVsLow = pairings.find(
            p => p.player1.playerid === 1 && p.player2.playerid === 3
                || p.player1.playerid === 3 && p.player2.playerid === 1
        )!;
        const p1IsHigher = highVsLow.player1.rating! > highVsLow.player2.rating!;
        expect(p1IsHigher ? highVsLow.winChanceP1Pct : 100 - highVsLow.winChanceP1Pct)
            .toBeGreaterThan(50);
    });

    it('returns empty array for 0 or 1 players', () => {
        expect(generateFairPlayPairings([])).toEqual([]);
        expect(generateFairPlayPairings([mockPlayer(1, 1000)])).toEqual([]);
    });

    it('uses ELO_DEFAULT when player rating is missing', () => {
        const noRating = { ...mockPlayer(99, 0), rating: undefined as any };
        const pairings = generateFairPlayPairings([noRating, mockPlayer(1, ELO_DEFAULT)]);
        // Both default to 1000 → diff = 0
        expect(pairings[0].eloDiff).toBe(0);
    });
});

// ───────────────────────────────────────────────────────────────
// buildEloJsonExport
// ───────────────────────────────────────────────────────────────

describe('buildEloJsonExport', () => {
    it('output has correct top-level keys', () => {
        const payload = buildEloJsonExport([], []);
        expect(payload).toHaveProperty('generatedAt');
        expect(payload).toHaveProperty('rankings');
        expect(payload).toHaveProperty('fairPlayPairings');
    });

    it('generatedAt is a valid ISO string', () => {
        const { generatedAt } = buildEloJsonExport([], []);
        expect(new Date(generatedAt).toISOString()).toBe(generatedAt);
    });

    it('rankings are correctly mapped from IRankingItem', () => {
        const p = mockPlayer(7, 1100);
        const { rankings } = buildEloJsonExport([p], []);
        expect(rankings[0]).toEqual(
            jasmine.objectContaining({ rank: 1, playerid: 7, rating: 1100, nickname: 'P7' })
        );
    });
});
