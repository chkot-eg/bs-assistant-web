import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { forkJoin, Observable, Subscription } from 'rxjs';
// EG Components — replace '../../shared/eg-mock' with '@eg-apps/common' when registry is available
import {
  EgPageModule, EgHeaderModule, EgButtonModule, EgIconModule,
  EgProgressSpinnerModule, EgKpiModule, EgBoxModule, EgSectionModule,
  EgFormFieldModule, EgTableModule, EgTooltipModule
} from '../../shared/eg-mock';
import { EgTableColumn } from '../../shared/eg-mock/modules/eg-table.module';
import { MetricsService } from '../../services/metrics.service';
import { AgenticMetrics, ToolMetrics, ToolMetricEntry } from '../../models/metrics.model';
import { TokenTrackingService } from '../../services/token-tracking.service';
import { SessionTokenSummary } from '../../models/token-usage.model';

@Component({
  selector: 'app-metrics-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    EgPageModule, EgHeaderModule, EgButtonModule, EgIconModule,
    EgProgressSpinnerModule, EgKpiModule, EgBoxModule, EgSectionModule,
    EgFormFieldModule, EgTableModule, EgTooltipModule
  ],
  templateUrl: './metrics-dashboard.component.html',
  styleUrls: ['./metrics-dashboard.component.scss']
})
export class MetricsDashboardComponent implements OnInit, OnDestroy {
  agenticMetrics: AgenticMetrics | null = null;
  toolEntries: { name: string; metrics: ToolMetricEntry }[] = [];
  isLoading = false;
  autoRefresh = false;
  autoRefreshControl = new FormControl(false);
  private refreshInterval: any;
  private autoRefreshSub?: Subscription;

  sessionTokenSummary$: Observable<SessionTokenSummary>;

  toolColumns: EgTableColumn[] = [
    { id: 'name', label: 'Tool' },
    { id: 'totalCalls', label: 'Calls' },
    { id: 'successes', label: 'Success' },
    { id: 'errors', label: 'Errors' },
    { id: 'successRate', label: 'Rate' },
    { id: 'avgTime', label: 'Avg Time' },
    { id: 'maxTime', label: 'Max Time' }
  ];

  toolTableData: Record<string, any>[] = [];

  constructor(
    private metricsService: MetricsService,
    private tokenTrackingService: TokenTrackingService
  ) {
    this.sessionTokenSummary$ = this.tokenTrackingService.sessionSummary$;
  }

  ngOnInit(): void {
    this.loadMetrics();
    this.autoRefreshSub = this.autoRefreshControl.valueChanges.subscribe(value => {
      this.autoRefresh = !!value;
      if (this.autoRefresh) {
        this.refreshInterval = setInterval(() => this.loadMetrics(), 10000);
      } else {
        this.stopAutoRefresh();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.autoRefreshSub?.unsubscribe();
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
        this.toolTableData = this.toolEntries.map(entry => ({
          name: entry.name,
          totalCalls: entry.metrics.totalCalls,
          successes: entry.metrics.successes,
          errors: entry.metrics.errors,
          successRate: this.formatPercent(entry.metrics.successRate),
          avgTime: this.formatMs(entry.metrics.avgExecutionTimeMs),
          maxTime: this.formatMs(entry.metrics.maxExecutionTimeMs)
        }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
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

  formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return `${tokens}`;
  }

  formatCost(cost: number): string {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  }
}
