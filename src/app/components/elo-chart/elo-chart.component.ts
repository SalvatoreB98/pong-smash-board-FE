import {
    Component,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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

@Component({
    selector: 'app-elo-chart',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule],
    providers: [DatePipe],
    templateUrl: './elo-chart.component.html',
    styleUrl: './elo-chart.component.scss'
})
export class EloChartComponent implements OnChanges {
    @ViewChild('chart') chart!: ChartComponent;
    @Input() rankings: IRankingItem[] = [];

    public chartOptions: Partial<ChartOptions> = {};
    public player1: IRankingItem | undefined;
    public player2: IRankingItem | undefined;
    public hasData = false;

    constructor(private datePipe: DatePipe) {
        this.initEmptyChart();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['rankings'] && this.rankings && this.rankings.length >= 2) {
            // Selezioniamo i primi due giocatori dalla classifica passata
            this.player1 = this.rankings[0];
            this.player2 = this.rankings[1];

            this.updateChartData();
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
            colors: ['#008FFB', '#FF4560', '#00E396'],
            dataLabels: { enabled: false },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            markers: {
                size: 4,
                colors: ['#008FFB', '#FF4560'],
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
                custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
                    // Questa funzione custom verrà sovrascritta durante l'updateChartData
                    // perché usiamo il `this` component scope.
                    return '';
                }
            }
        };
    }

    private updateChartData() {
        if (!this.player1 || !this.player2 || !this.player1.history || !this.player2.history) {
            this.hasData = false;
            return;
        }

        const h1 = this.player1.history;
        const h2 = this.player2.history;

        // Estraiamo tutte le date uniche dai due log
        const allDates = new Set<string>();
        h1.forEach(h => allDates.add(h.date));
        h2.forEach(h => allDates.add(h.date));

        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        if (sortedDates.length === 0) {
            this.hasData = false;
            return;
        }

        this.hasData = true;

        // Funzione per calcolare la "forma" progressiva fino alla partita (ultime 5 giocate)
        const calculateForms = (history: { date: string, elo: number }[]) => {
            const forms: string[][] = [];
            let currentForm: string[] = [];
            for (let i = 0; i < history.length; i++) {
                const prevElo = i === 0 ? 1000 : history[i - 1].elo;
                let result = 'd';
                if (history[i].elo > prevElo) result = 'w';
                else if (history[i].elo < prevElo) result = 'l';

                currentForm.push(result);
                if (currentForm.length > 5) currentForm.shift();
                forms.push([...currentForm]);
            }
            return forms;
        };

        const forms1 = calculateForms(h1);
        const forms2 = calculateForms(h2);

        // Costruiamo la serie di dati "riempiendo i buchi" (carry forward dell'ultimo ELO noto per le date mancanti)
        let lastElo1 = h1.length > 0 ? h1[0].elo : 1000;
        let lastElo2 = h2.length > 0 ? h2[0].elo : 1000;

        const data1: [number, number][] = [];
        const data2: [number, number][] = [];

        const tooltipForms1: string[][] = [];
        const tooltipForms2: string[][] = [];

        let lastForm1: string[] = [];
        let lastForm2: string[] = [];

        sortedDates.forEach((dateStr, index) => {
            const timestamp = index + 1; // Partita 1, Partita 2, ecc.

            const idx1 = h1.findIndex(h => h.date === dateStr);
            if (idx1 !== -1) {
                lastElo1 = h1[idx1].elo;
                lastForm1 = forms1[idx1];
            }

            const idx2 = h2.findIndex(h => h.date === dateStr);
            if (idx2 !== -1) {
                lastElo2 = h2[idx2].elo;
                lastForm2 = forms2[idx2];
            }

            data1.push([timestamp, lastElo1]);
            data2.push([timestamp, lastElo2]);
            tooltipForms1.push(lastForm1);
            tooltipForms2.push(lastForm2);
        });

        const p1Name = this.player1.nickname || this.player1.name;
        const p2Name = this.player2.nickname || this.player2.name;

        // Salviamo reference per usarli nel tooltip HTML
        const formatBadge = (str: string) => str.toLowerCase() === 'w' ? 'w' : str.toLowerCase() === 'l' ? 'l' : 'd';
        const renderForm = (form: string[]) => form.length ? form.map(f => `<span class="badge ${formatBadge(f)}">${f}</span>`).join('') : '<span style="opacity:0.5">-</span>';

        const pipe = this.datePipe;

        this.chartOptions = {
            ...this.chartOptions,
            series: [
                { name: p1Name, data: data1 },
                { name: p2Name, data: data2 }
            ],
            tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
                    const matchNumber = w.globals.seriesX[0][dataPointIndex];
                    const originalDateStr = sortedDates[dataPointIndex];
                    const dateFormatted = pipe.transform(new Date(originalDateStr), 'dd/MM/yyyy • H:mm') || '';

                    const p1Val = series[0][dataPointIndex];
                    const p2Val = series[1][dataPointIndex];

                    const p1Form = tooltipForms1[dataPointIndex] || [];
                    const p2Form = tooltipForms2[dataPointIndex] || [];

                    return `
                        <div class="custom-tooltip">
                            <div class="tt-header">${dateFormatted}</div>
                            
                            <div class="tt-player">
                                <div class="tt-top">
                                    <div class="tt-name"><div class="dot blue"></div>${p1Name}</div>
                                    <div class="tt-score blue">${p1Val}</div>
                                </div>
                                <div class="tt-form">
                                    <span>Last</span> ${renderForm(p1Form)}
                                </div>
                            </div>

                            <div class="tt-player">
                                <div class="tt-top">
                                    <div class="tt-name"><div class="dot orange"></div>${p2Name}</div>
                                    <div class="tt-score orange">${p2Val}</div>
                                </div>
                                <div class="tt-form">
                                    <span>Last:</span> ${renderForm(p2Form)}
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        };
    }
}
