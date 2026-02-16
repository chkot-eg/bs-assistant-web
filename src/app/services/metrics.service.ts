import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AgenticMetrics, ToolMetrics, HealthStatus } from '../models/metrics.model';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAgenticMetrics(): Observable<AgenticMetrics> {
    return this.http.get<AgenticMetrics>(`${this.apiUrl}/api/v1/metrics/agentic`);
  }

  getToolMetrics(): Observable<ToolMetrics> {
    return this.http.get<ToolMetrics>(`${this.apiUrl}/api/v1/metrics/tools`);
  }

  health(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.apiUrl}/api/v1/metrics/health`);
  }

  getAvailableMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/v1/metrics/available`);
  }
}
