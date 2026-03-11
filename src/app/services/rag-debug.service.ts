import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RagDebugResponse {
  success: boolean;
  query: string;
  ragAvailable: boolean;
  businessRules: BusinessRuleResult[];
  businessRuleCount: number;
  extractedTables: string[];
  extractedTableCount: number;
  knownTableCount: number;
  searchType: string;
  executionTimeMs: number;
}

export interface BusinessRuleResult {
  sourceDocument: string;
  content: string;
  category: string;
  similarityScore: number;
  chunkIndex: number;
}

@Injectable({ providedIn: 'root' })
export class RagDebugService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  lookup(query: string, topK: number): Observable<RagDebugResponse> {
    return this.http.post<RagDebugResponse>(`${this.apiUrl}/api/v1/debug/rag-lookup`, { query, topK });
  }
}
