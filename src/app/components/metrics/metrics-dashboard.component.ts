import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { forkJoin } from 'rxjs';
import { MetricsService } from '../../services/metrics.service';
import { AgenticMetrics, ToolMetrics, ToolMetricEntry } from '../../models/metrics.model';

@Component({
  selector: 'app-metrics-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTableModule, MatSlideToggleModule
  ],
  templateUrl: './metrics-dashboard.component.html',
  styleUrls: ['./metrics-dashboard.component.scss']
})
export class MetricsDashboardComponent implements OnInit, OnDestroy {
  agenticMetrics: AgenticMetrics | null = null;
  toolEntries: { name: string; metrics: ToolMetricEntry }[] = [];
  isLoading = false;
  autoRefresh = false;
  private refreshInterval: any;

  toolColumns = ['name', 'totalCalls', 'successes', 'errors', 'successRate', 'avgTime', 'maxTime'];

  constructor(private metricsService: MetricsService) {}

  ngOnInit(): void {
    this.loadMetrics();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadMetrics(): void {
    this.isLoading = true;
    forkJoin({
      agentic: this.metricsService.getAgenticMetrics(),
      tools: this.metricsService.getToolMetrics()
    }).subscribe({
      next: ({ agentic, tools }) => {
        this.agenticMetrics = agentic;
        this.toolEntries = Object.entries(tools.tools || {}).map(([name, metrics]) => ({ name, metrics }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => this.loadMetrics(), 10000);
    } else {
      this.stopAutoRefresh();
    }
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  formatMs(ms: number | undefined): string {
    if (ms === undefined || ms === null) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  formatPercent(rate: number | undefined): string {
    if (rate === undefined || rate === null) return '-';
    return `${rate.toFixed(1)}%`;
  }
}
