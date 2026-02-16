import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  SessionListResponse, SessionDetailResponse,
  SessionMessagesResponse, SessionContextResponse, ActionResponse
} from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createSession(sessionId?: string): Observable<SessionDetailResponse> {
    const body = sessionId ? { sessionId } : {};
    return this.http.post<SessionDetailResponse>(`${this.apiUrl}/api/v1/sessions`, body);
  }

  getSessions(): Observable<SessionListResponse> {
    return this.http.get<SessionListResponse>(`${this.apiUrl}/api/v1/sessions`);
  }

  getSession(sessionId: string): Observable<SessionDetailResponse> {
    return this.http.get<SessionDetailResponse>(`${this.apiUrl}/api/v1/sessions/${sessionId}`);
  }

  deleteSession(sessionId: string): Observable<ActionResponse> {
    return this.http.delete<ActionResponse>(`${this.apiUrl}/api/v1/sessions/${sessionId}`);
  }

  clearSession(sessionId: string): Observable<ActionResponse> {
    return this.http.post<ActionResponse>(`${this.apiUrl}/api/v1/sessions/${sessionId}/clear`, {});
  }

  getSessionContext(sessionId: string): Observable<SessionContextResponse> {
    return this.http.get<SessionContextResponse>(`${this.apiUrl}/api/v1/sessions/${sessionId}/context`);
  }

  getSessionMessages(sessionId: string): Observable<SessionMessagesResponse> {
    return this.http.get<SessionMessagesResponse>(`${this.apiUrl}/api/v1/sessions/${sessionId}/messages`);
  }
}
