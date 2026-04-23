import {
    Component,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslatePipe } from '../../utils/translate.pipe';
import { TranslationService } from '../../../services/translation.service';
import { IRankingItem } from '../../../services/data.service';
import {
    ChartComponent,
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexStroke,
    ApexDataLabels,
    ApexYAxis,
    ApexGrid,
    ApexMarkers,
    ApexTooltip,
    NgApexchartsModule
} from 'ng-apexcharts';

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    stroke: ApexStroke;
    colors: string[];
    dataLabels: ApexDataLabels;
    grid: ApexGrid;
    markers: ApexMarkers;
    tooltip: ApexTooltip;
};

// Up to 8 distinct colors for chart lines
const CHART_COLORS = [
    '#008FFB', '#FF4560', '#00E396', '#FEB019',
    '#775DD0', '#3F51B5', '#F86624', '#2B908F'
];

@Component({
    selector: 'app-elo-chart',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, TranslatePipe],
    providers: [DatePipe],
    templateUrl: './elo-chart.component.html',
    styleUrl: './elo-chart.component.scss'
})
export class EloChartComponent implements OnChanges {
    @ViewChild('chart') chart!: ChartComponent;
    @Input() rankings: IRankingItem[] = [];

    public chartOptions: Partial<ChartOptions> = {};
    public players: IRankingItem[] = [];
    public hasData = false;

    constructor(private datePipe: DatePipe, private translationService: TranslationService) {
        this.initEmptyChart();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['rankings']) {
            if (this.rankings && this.rankings.length >= 2) {
                // Prendi tutti i giocatori passati nell'array rankings
                this.players = this.rankings;
                this.updateChartData();
            } else {
                this.hasData = false;
                this.players = [];
                this.chartOptions.series = [];
            }
        }
    }

    private initEmptyChart() {
        this.chartOptions = {
            series: [],
            chart: {
                height: 350,
                type: 'line',
                zoom: { enabled: false },
                toolbar: { show: false },
                fontFamily: 'inherit'
            },
            colors: CHART_COLORS,
            dataLabels: { enabled: false },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            markers: {
                size: 4,
                colors: CHART_COLORS,
                strokeWidth: 0,
                hover: { size: 2 }
            },
            xaxis: {
                type: 'numeric',
                labels: {
                    formatter: function (val: string) { return Number(val).toFixed(0); }
                }
            },
            yaxis: {
                labels: {
                    formatter: function (val: number) { return val.toFixed(0); }
                }
            },
            grid: {
                borderColor: '#e2e8f0',
                strokeDashArray: 4,
            },
            tooltip: {
                custom: function () { return ''; }
            }
        };
    }

    private updateChartData() {
        if (this.players.length < 2) {
            this.hasData = false;
            return;
        }

        const allPlayers = this.players;

        // Estraiamo tutte le date uniche dai log di tutti i giocatori
        const allDates = new Set<string>();
        allPlayers.forEach(p => {
            if (p.history) p.history.forEach(h => allDates.add(h.date));
        });

        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        if (sortedDates.length === 0) {
            this.hasData = false;
            return;
        }

        this.hasData = true;

        // Funzione per calcolare la "forma" progressiva fino alla partita (ultime 5 giocate)
        const calculateForms = (history: { date: string, elo: number, result?: string }[]) => {
            const forms: string[][] = [];
            let currentForm: string[] = [];
            for (let i = 0; i < history.length; i++) {
                // Usa il risultato dal backend
                let result = history[i].result || 'D';

                currentForm.push(result.toUpperCase());
                if (currentForm.length > 5) currentForm.shift();
                forms.push([...currentForm]);
            }
            return forms;
        };

        const playerSeries: { name: string; data: [number, number][] }[] = [];
        const playerTooltipForms: string[][][] = [];
        const playerNames: string[] = [];

        allPlayers.forEach((player: IRankingItem) => {
            const rawHistory = player.history || [];
            // Sort history chronologically just in case the backend sends it in a different order
            const history = [...rawHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const forms = calculateForms(history);
            const data: [number, number][] = [];
            const tooltipForms: string[][] = [];
            let lastElo = history.length > 0 ? history[0].elo : (player.rating ?? 1000);
            let lastForm: string[] = [];

            sortedDates.forEach((dateStr: string, index: number) => {
                const timestamp = index + 1; // Partita 1, Partita 2, ecc.
                const idx = history.findIndex((h: { date: string, elo: number }) => h.date === dateStr);
                if (idx !== -1) {
                    lastElo = Number(history[idx].elo || history[idx]?.['rating' as keyof typeof history[0]] || lastElo);
                    lastForm = forms[idx];
                }
                data.push([timestamp, lastElo]);
                tooltipForms.push(lastForm);
            });

            const name = player.nickname || player.name;
            playerSeries.push({ name, data });
            playerTooltipForms.push(tooltipForms);
            playerNames.push(name);
        });

        const colors = allPlayers.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        const pipe = this.datePipe;
        const tService = this.translationService;

        const formatBadge = (str: string) => str.toLowerCase() === 'w' ? 'w' : str.toLowerCase() === 'l' ? 'l' : 'd';
        const renderForm = (form: string[]) => form.length ? form.map(f => `<span class="badge ${formatBadge(f)}">${f}</span>`).join('') : '<span style="opacity:0.5">-</span>';
        const dotColors = ['color-0', 'color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7'];

        this.chartOptions = {
            ...this.chartOptions,
            colors: colors,
            markers: {
                size: 4,
                colors: colors,
                strokeWidth: 0,
                hover: { size: 2 }
            },
            series: playerSeries,
            tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
                    const originalDateStr = sortedDates[dataPointIndex];
                    const dateFormatted = pipe.transform(new Date(originalDateStr), 'dd/MM/yyyy • H:mm') || '';

                    const playersHtml = playerNames.map((name, i) => {
                        const val = (series[i] || [])[dataPointIndex] ?? '—';
                        const form = (playerTooltipForms[i] || [])[dataPointIndex] || [];
                        const dot = dotColors[i % dotColors.length];
                        return `
                        <div class="tt-player">
                            <div class="tt-top">
                                <div class="tt-name"><div class="dot ${dot}"></div>${name}</div>
                                <div class="tt-score ${dot}">${val}</div>
                            </div>
                            <div class="tt-form">
                                <span>${tService.translate('last_form')}</span> ${renderForm(form)}
                            </div>
                        </div>`;
                    }).join('');

                    return `
                    <div class="custom-tooltip">
                        <div class="tt-header">${dateFormatted}</div>
                        ${playersHtml}
                    </div>
                `;
                }
            }
        };
    }

}
