import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

  constructor(private http: HttpClient) {}

  submitFeedback(feedback: FeedbackRequest): Observable<FeedbackResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<FeedbackResponse>(`${this.apiUrl}/api/v1/feedback`, feedback, { headers });
  }
}
