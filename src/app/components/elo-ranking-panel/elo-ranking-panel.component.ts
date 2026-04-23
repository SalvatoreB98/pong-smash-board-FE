import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    OnInit,
    inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { RankingService } from '../../../services/ranking.service';
import { UserService } from '../../../services/user.service';
import { LoaderService } from '../../../services/loader.service';
import { BottomNavbarComponent } from '../../common/bottom-navbar/bottom-navbar.component';
import { TranslatePipe } from '../../utils/translate.pipe';
import { IRankingItem } from '../../../services/data.service';
import {
    FairPlayPairing,
    EloMatchResult,
    ELO_DEFAULT,
    EloJsonExport,
} from '../../utils/elo.utils';
import { MSG_TYPE } from '../../utils/enum';
import { EloChartComponent } from '../elo-chart/elo-chart.component';

@Component({
    selector: 'app-elo-ranking-panel',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, TranslatePipe, BottomNavbarComponent, EloChartComponent],
    templateUrl: './elo-ranking-panel.component.html',
    styleUrl: './elo-ranking-panel.component.scss',
})
export class EloRankingPanelComponent implements OnInit {
    private rankingService = inject(RankingService);
    private userService = inject(UserService);
    private loaderService = inject(LoaderService);
    private cdr = inject(ChangeDetectorRef);
    private destroyRef = inject(DestroyRef);

    // ── State ──────────────────────────────────────────────────────────────────
    isLoading = true;
    competitionId = '';

    rankings: IRankingItem[] = [];
    pairings: FairPlayPairing[] = [];

    // ── Simulator ─────────────────────────────────────────────────────────────
    simPlayerAId: number | null = null;
    simPlayerBId: number | null = null;
    simResult: EloMatchResult | null = null;
    simWinner: 'A' | 'B' | 'draw' = 'A';
    ELO_DEFAULT = ELO_DEFAULT;

    // ── JSON preview ──────────────────────────────────────────────────────────
    jsonPreview: string | null = null;
    showJsonPreview = false;

    // ── Sorting ───────────────────────────────────────────────────────────────
    pairingLimit = 10;

    async ngOnInit() {
        const state = await firstValueFrom(this.userService.getState());
        this.competitionId = String(state?.active_competition_id ?? '');
        await this.load();

        // Ricarica quando cambia la competizione attiva
        this.userService.getState()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(async newState => {
                const newId = String(newState?.active_competition_id ?? '');
                if (newId && newId !== this.competitionId) {
                    console.log('[EloRankingPanel] 🧹 Competition changed to', newId, '-> Clearing state and reloading');
                    this.competitionId = newId;
                    this.clearState();
                    await this.load();
                }
            });
    }

    private async load() {
        this.isLoading = true;
        this.cdr.markForCheck();
        try {
            const [res, pairings] = await Promise.all([
                this.rankingService.getRanking(this.competitionId),
                this.rankingService.getFairPlayPairings(this.competitionId),
            ]);
            this.rankings = res.ranking;
            this.pairings = pairings;
        } catch {
            this.loaderService.showToast('Errore nel caricamento ELO', MSG_TYPE.ERROR);
        } finally {
            this.isLoading = false;
            this.cdr.markForCheck();
        }
    }

    private clearState() {
        this.rankings = [];
        this.pairings = [];
        this.simPlayerAId = null;
        this.simPlayerBId = null;
        this.simResult = null;
        this.simWinner = 'A';
        this.jsonPreview = null;
        this.showJsonPreview = false;
        this.pairingLimit = 10;
        this.cdr.markForCheck();
    }

    // ── Simulator ─────────────────────────────────────────────────────────────

    get simPlayerA(): IRankingItem | undefined {
        return this.rankings.find(r => r.playerid === Number(this.simPlayerAId));
    }

    get simPlayerB(): IRankingItem | undefined {
        return this.rankings.find(r => r.playerid === Number(this.simPlayerBId));
    }

    runSimulation() {
        const a = this.simPlayerA;
        const b = this.simPlayerB;
        if (!a || !b || a.playerid === b.playerid) return;
        this.simResult = this.rankingService.simulateMatch(a, b, this.simWinner);
        this.cdr.markForCheck();
    }

    resetSimulation() {
        this.simPlayerAId = null;
        this.simPlayerBId = null;
        this.simResult = null;
        this.simWinner = 'A';
        this.cdr.markForCheck();
    }

    // ── JSON export ───────────────────────────────────────────────────────────

    async toggleJsonPreview() {
        if (this.showJsonPreview) {
            this.showJsonPreview = false;
            this.cdr.markForCheck();
            return;
        }
        try {
            const payload: EloJsonExport =
                await this.rankingService.eloJsonExport(this.competitionId);
            this.jsonPreview = JSON.stringify(payload, null, 2);
            this.showJsonPreview = true;
        } catch {
            this.loaderService.showToast('Errore export JSON', MSG_TYPE.ERROR);
        }
        this.cdr.markForCheck();
    }

    downloadJson() {
        if (!this.jsonPreview) return;
        const blob = new Blob([this.jsonPreview], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elo-ranking-${this.competitionId || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ── Template helpers ──────────────────────────────────────────────────────

    ratingOf(player: IRankingItem): number {
        return player.rating ?? ELO_DEFAULT;
    }

    deltaSign(n: number): string {
        return n >= 0 ? `+${n}` : `${n}`;
    }

    deltaClass(n: number): string {
        return n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral';
    }

    balanceClass(diff: number): string {
        if (diff <= 50) return 'balanced';
        if (diff <= 150) return 'moderate';
        return 'unbalanced';
    }

    trackByPlayerid(_i: number, item: IRankingItem) { return item.playerid; }
    trackByPairing(_i: number, p: FairPlayPairing) {
        return `${p.player1.playerid}-${p.player2.playerid}`;
    }

    get visiblePairings() {
        return this.pairings.slice(0, this.pairingLimit);
    }

    get hasMorePairings() {
        return this.pairings.length > this.pairingLimit;
    }

    showMorePairings() {
        this.pairingLimit += 10;
    }
}
