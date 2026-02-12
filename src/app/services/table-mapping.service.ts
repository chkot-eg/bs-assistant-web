import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  TableMappingRequest, TableMappingListResponse,
  TableMappingSearchRequest, TableMappingSearchResponse
} from '../models/table-mapping.model';
import { HealthStatus } from '../models/metrics.model';

@Injectable({ providedIn: 'root' })
export class TableMappingService {
  private apiUrl = environment.apiUrl;
  private basePath = '/api/v1/table-mappings';

  constructor(private http: HttpClient) {}

  create(mapping: TableMappingRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}${this.basePath}`, mapping);
  }

  list(category?: string, productCode?: string): Observable<TableMappingListResponse> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (productCode) params = params.set('productCode', productCode);
    return this.http.get<TableMappingListResponse>(`${this.apiUrl}${this.basePath}`, { params });
  }

  get(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}${this.basePath}/${id}`);
  }

  getByTableName(tableName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}${this.basePath}/table/${encodeURIComponent(tableName)}`);
  }

  update(id: string, mapping: Partial<TableMappingRequest>): Observable<any> {
    return this.http.put(`${this.apiUrl}${this.basePath}/${id}`, mapping);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}${this.basePath}/${id}`);
  }

  search(request: TableMappingSearchRequest): Observable<TableMappingSearchResponse> {
    return this.http.post<TableMappingSearchResponse>(`${this.apiUrl}${this.basePath}/search`, request);
  }

  reindex(): Observable<any> {
    return this.http.post(`${this.apiUrl}${this.basePath}/reindex`, {});
  }

  health(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.apiUrl}${this.basePath}/health`);
  }
}
