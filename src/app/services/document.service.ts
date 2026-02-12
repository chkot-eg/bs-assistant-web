import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DocumentListResponse, DocumentUploadResponse,
  DocumentSearchRequest, DocumentSearchResponse, DocumentStatsResponse
} from '../models/document.model';
import { HealthStatus } from '../models/metrics.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private apiUrl = environment.apiUrl;
  private basePath = '/api/v1/documents';

  constructor(private http: HttpClient) {}

  upload(file: File, category?: string): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    return this.http.post<DocumentUploadResponse>(`${this.apiUrl}${this.basePath}/upload`, formData);
  }

  list(category?: string, status?: string): Observable<DocumentListResponse> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (status) params = params.set('status', status);
    return this.http.get<DocumentListResponse>(`${this.apiUrl}${this.basePath}`, { params });
  }

  get(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}${this.basePath}/${id}`);
  }

  getDownloadUrl(id: string): Observable<{ success: boolean; url: string; expiresIn: string }> {
    return this.http.get<{ success: boolean; url: string; expiresIn: string }>(
      `${this.apiUrl}${this.basePath}/${id}/url`
    );
  }

  download(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}${this.basePath}/${id}/download`, { responseType: 'blob' });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}${this.basePath}/${id}`);
  }

  search(request: DocumentSearchRequest): Observable<DocumentSearchResponse> {
    return this.http.post<DocumentSearchResponse>(`${this.apiUrl}${this.basePath}/search`, request);
  }

  processDocument(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}${this.basePath}/${id}/process`, {});
  }

  processAllPending(): Observable<any> {
    return this.http.post(`${this.apiUrl}${this.basePath}/process-pending`, {});
  }

  getStats(): Observable<DocumentStatsResponse> {
    return this.http.get<DocumentStatsResponse>(`${this.apiUrl}${this.basePath}/stats`);
  }

  health(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.apiUrl}${this.basePath}/health`);
  }
}
