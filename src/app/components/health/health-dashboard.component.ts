import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HealthService } from '../../services/health.service';
import { HealthStatus } from '../../models/metrics.model';

@Component({
  selector: 'app-health-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './health-dashboard.component.html',
  styleUrls: ['./health-dashboard.component.scss']
})
export class HealthDashboardComponent implements OnInit, OnDestroy {
  services: { key: string; status: HealthStatus }[] = [];
  isLoading = false;
  lastChecked: Date | null = null;
  private refreshInterval: any;

  constructor(private healthService: HealthService) {}

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refresh(): void {
    this.isLoading = true;
    this.healthService.checkAll().subscribe({
      next: (result) => {
        this.services = Object.entries(result).map(([key, status]) => ({ key, status }));
        this.lastChecked = new Date();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getServiceDisplayName(key: string): string {
    const names: Record<string, string> = {
      query: 'Query Service',
      stream: 'Agentic Stream',
      documents: 'Document Service',
      tableMappings: 'Table Mappings',
      metrics: 'Metrics Service',
      chat: 'Chat Service'
    };
    return names[key] || key;
  }

  getUpCount(): number {
    return this.services.filter(s => s.status.status === 'UP').length;
  }

  getDownCount(): number {
    return this.services.filter(s => s.status.status === 'DOWN').length;
  }
}
