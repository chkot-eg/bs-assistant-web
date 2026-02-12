import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { QueryResponse } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class SchemaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSchema(tableName: string, library: string = 'ADB800'): Observable<QueryResponse> {
    const params = new HttpParams().set('library', library);
    return this.http.get<QueryResponse>(
      `${this.apiUrl}/api/v1/schemas/${encodeURIComponent(tableName)}`,
      { params }
    );
  }
}
