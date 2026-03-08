import { Component, Input, OnChanges, SimpleChanges, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../../utils/translate.pipe';
import { TranslationService } from '../../../../../services/translation.service';
import { DataService, IRankingItem } from '../../../../../services/data.service';
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
import { Subscription } from 'rxjs';

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

const CHART_COLORS = [
  '#008FFB', '#FF4560', '#00E396', '#FEB019',
  '#775DD0', '#3F51B5', '#F86624', '#2B908F'
];

@Component({
  selector: 'app-monthly-win-rates',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, TranslatePipe],
  providers: [DatePipe],
  templateUrl: './monthly-win-rates.component.html',
  styleUrl: './monthly-win-rates.component.scss'
})
export class MonthlyWinRatesComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chart') chart!: ChartComponent;
  @Input() players: IRankingItem[] = [];

  public chartOptions: Partial<ChartOptions> = {};
  public hasData = false;
  private sub?: Subscription;
  private rawData: Record<string, Record<string, string | number>> = {};

  private dataService = inject(DataService);
  private translationService = inject(TranslationService);
  private datePipe = inject(DatePipe);

  constructor() {
    this.initEmptyChart();
  }

  ngOnInit() {
    this.sub = this.dataService.monthlyWinRatesObs.subscribe(data => {
      this.rawData = data || {};
      this.updateChartData();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['players']) {
        this.updateChartData();
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
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
        type: 'category',
        categories: [],
        labels: {
            style: { colors: '#94a3b8' }
        }
      },
      yaxis: {
        min: 0,
        max: 100,
        labels: {
          formatter: function (val: number) { return val.toFixed(0) + '%'; },
          style: { colors: '#94a3b8' }
        }
      },
      grid: {
        borderColor: 'rgba(255,255,255,0.1)',
        strokeDashArray: 4,
      },
      tooltip: {
        theme: 'dark'
      }
    };
  }

  private updateChartData() {
    const data = this.rawData;
    if (!data || Object.keys(data).length === 0) {
      this.hasData = false;
      return;
    }

    // data format: { "playerId": { "01": "58.1", "02": "58.1", ... } }
    
    // 1. Collect all unique months across all players
    const allMonths = new Set<string>();
    Object.values(data).forEach(playerMonths => {
      if (playerMonths) {
          Object.keys(playerMonths).forEach(m => allMonths.add(m));
      }
    });

    if (allMonths.size === 0) {
      this.hasData = false;
      return;
    }

    // Sort months chronologically. Since they are "01", "02", ..., "12", standard string sort works.
    // If the data spans multiple years later, the backend should provide YYYY-MM. Assuming MM for now.
    const months = Array.from(allMonths).sort();
    
    this.hasData = true;

    const series: ApexAxisChartSeries = [];
    const playerIds = Object.keys(data);
    const colors = playerIds.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    playerIds.forEach(playerId => {
      // Find player name from input or fallback to ID
      const playerItem = this.players.find(p => String(p.id) === String(playerId) || String(p.playerid) === String(playerId));
      const playerName = playerItem?.nickname || playerItem?.name || `Player ${playerId}`;

      const playerData: number[] = [];
      months.forEach(month => {
        const val = data[playerId][month];
        if (val !== undefined && val !== null) {
          playerData.push(Number(val));
        } else {
          // If a player didn't play in a month, what should we show? 
          // Apexcharts line breaks if we push null. Let's push the last known value, or 0.
          // Since it's win rate, maybe connecting the dots with null is better?
          // Using null makes apexcharts stop the line unless `spanGaps` is true, or we just put 0.
          playerData.push(0); 
        }
      });
      series.push({ name: playerName, data: playerData });
    });

    // Format month labels nicely
    const monthNames = [
        "Gen", "Feb", "Mar", "Apr", "Mag", "Giu", 
        "Lug", "Ago", "Set", "Ott", "Nov", "Dic"
    ];

    const formattedCategories = months.map(m => {
       let monthIndex = parseInt(m, 10) - 1;
       let yearStr = '';
       if (m.includes('-')) {
           const parts = m.split('-');
           yearStr = ' ' + parts[0];
           monthIndex = parseInt(parts[1], 10) - 1;
       }

       if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12) {
           return monthNames[monthIndex] + yearStr;
       }
       return m;
    });

    this.chartOptions = {
      ...this.chartOptions,
      series,
      colors,
      markers: {
        ...this.chartOptions!.markers,
        colors
      },
      xaxis: {
        ...this.chartOptions!.xaxis,
        categories: formattedCategories
      }
    };
  }
}
