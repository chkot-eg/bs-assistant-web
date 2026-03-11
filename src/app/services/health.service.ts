import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { HealthStatus } from '../models/metrics.model';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  checkAll(): Observable<Record<string, HealthStatus>> {
    const down = (name: string, err: any): Observable<HealthStatus> =>
      of({ service: name, status: 'DOWN' as const, error: err.message, timestamp: Date.now() });

    return forkJoin({
      chat: this.http.get<HealthStatus>(`${this.apiUrl}/api/chat/health`)
        .pipe(catchError(e => down('ChatService', e))),
      query: this.http.get<HealthStatus>(`${this.apiUrl}/api/v1/query/health`)
        .pipe(catchError(e => down('QueryService', e))),
      stream: this.http.get<HealthStatus>(`${this.apiUrl}/api/v1/query/agentic/stream/health`)
        .pipe(catchError(e => down('AgenticStreamService', e))),
      documents: this.http.get<HealthStatus>(`${this.apiUrl}/api/v1/documents/health`)
        .pipe(catchError(e => down('DocumentsService', e))),
      metrics: this.http.get<HealthStatus>(`${this.apiUrl}/api/v1/metrics/health`)
        .pipe(catchError(e => down('MetricsService', e)))
    });
  }
}
