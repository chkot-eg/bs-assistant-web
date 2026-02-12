import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { QueryResponse } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class TableService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllTables(library: string = 'ADB800'): Observable<QueryResponse> {
    const params = new HttpParams().set('library', library);
    return this.http.get<QueryResponse>(`${this.apiUrl}/api/v1/tables`, { params });
  }

  searchTables(query: string, library: string = 'ADB800'): Observable<QueryResponse> {
    const params = new HttpParams().set('q', query).set('library', library);
    return this.http.get<QueryResponse>(`${this.apiUrl}/api/v1/tables/search`, { params });
  }
}
