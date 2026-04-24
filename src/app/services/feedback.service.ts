import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FeedbackIssue } from '../models/feedback-issue.model';

export interface FeedbackRequest {
  query: string;
  response: string;
  comment?: string;
}

export interface FeedbackResponse {
  success: boolean;
  feedbackId?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = environment.apiUrl;
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  submitFeedback(feedback: FeedbackRequest): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${this.apiUrl}/api/v1/feedback`, feedback, { headers: this.jsonHeaders });
  }

  getAllFeedback(resolved?: boolean): Observable<FeedbackIssue[]> {
    const url = resolved == null
      ? `${this.apiUrl}/api/v1/feedback`
      : `${this.apiUrl}/api/v1/feedback?resolved=${resolved}`;
    return this.http.get<FeedbackIssue[]>(url);
  }

  setResolved(id: number, resolved: boolean): Observable<FeedbackIssue> {
    return this.http.patch<FeedbackIssue>(
      `${this.apiUrl}/api/v1/feedback/${id}/resolve`,
      { resolved },
      { headers: this.jsonHeaders }
    );
  }

  deleteFeedback(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/v1/feedback/${id}`);
  }
}
