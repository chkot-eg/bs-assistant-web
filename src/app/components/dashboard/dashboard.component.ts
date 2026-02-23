import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HealthService } from '../../services/health.service';
import { MetricsService } from '../../services/metrics.service';
import { DocumentService } from '../../services/document.service';
import { AgenticMetrics, HealthStatus } from '../../models/metrics.model';
import { DocumentStatsResponse } from '../../models/document.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  metrics: AgenticMetrics | null = null;
  healthStatuses: { key: string; status: HealthStatus }[] = [];
  docStats: DocumentStatsResponse | null = null;
  isLoading = true;

  navCards = [
    { title: 'Table Browser', description: 'Browse and search database tables', icon: 'table_chart', route: '/security/tables', color: '#2196F3' },
    { title: 'Documents', description: 'Manage uploaded documents', icon: 'description', route: '/security/documents', color: '#4CAF50' },
    { title: 'Metrics', description: 'View query performance metrics', icon: 'analytics', route: '/security/metrics', color: '#FF9800' },
    { title: 'Sessions', description: 'Manage conversation sessions', icon: 'forum', route: '/security/sessions', color: '#9C27B0' },
    { title: 'Table Mappings', description: 'Configure table semantic mappings', icon: 'account_tree', route: '/security/table-mappings', color: '#00BCD4' },
    { title: 'Health', description: 'Monitor service health status', icon: 'monitor_heart', route: '/security/health', color: '#F44336' }
  ];

  constructor(
    private healthService: HealthService,
    private metricsService: MetricsService,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    forkJoin({
      health: this.healthService.checkAll().pipe(catchError(() => of(null))),
      metrics: this.metricsService.getAgenticMetrics().pipe(catchError(() => of(null))),
      docs: this.documentService.getStats().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ health, metrics, docs }) => {
        if (health) {
          this.healthStatuses = Object.entries(health).map(([key, status]) => ({ key, status }));
        }
        this.metrics = metrics as AgenticMetrics | null;
        this.docStats = docs as DocumentStatsResponse | null;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getHealthyCount(): number {
    return this.healthStatuses.filter(s => s.status.status === 'UP').length;
  }

  getTotalServices(): number {
    return this.healthStatuses.length;
  }

  formatPercent(rate: number | undefined): string {
    if (rate === undefined || rate === null) return '-';
    return `${rate.toFixed(1)}%`;
  }
}
