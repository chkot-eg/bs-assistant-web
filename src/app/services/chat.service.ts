import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, Subject } from 'rxjs';
import { catchError, retry, tap, takeUntil } from 'rxjs/operators';
import { Message, QueryRequest, QueryResponse, MessageMetadata, CancelResponse, ChatLimitError } from '../models/message.model';
import { ChatMessageDto } from '../models/session.model';
import { environment } from '../../environments/environment';
import { AgenticStreamService } from './agentic-stream.service';
import { SseEvent } from '../models/sse-events.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private currentSessionId: string | null = null;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  // Abort controller for canceling requests
  private abortController$ = new Subject<void>();

  // Rate limiting
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second

  constructor(
    private http: HttpClient,
    private agenticStreamService: AgenticStreamService
  ) {
    this.initializeSession();
  }

  private initializeSession(): void {
    const savedSessionId = localStorage.getItem('sessionId');
    if (savedSessionId) {
      this.currentSessionId = savedSessionId;
    } else {
      this.generateNewSession();
    }
  }

  private generateNewSession(): void {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    this.currentSessionId = `session_${timestamp}_${random}`;
    localStorage.setItem('sessionId', this.currentSessionId);
  }

  canSendRequest(): boolean {
    const now = Date.now();
    if (now - this.lastRequestTime < this.MIN_REQUEST_INTERVAL) {
      return false;
    }
    this.lastRequestTime = now;
    return true;
  }

  sendMessage(content: string, useContext: boolean = true): Observable<QueryResponse> {
    if (!this.canSendRequest()) {
      return throwError(() => new Error('Please wait before sending another message'));
    }

    this.isLoadingSubject.next(true);

    // Add user message
    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: content,
      timestamp: new Date()
    };
    this.addMessage(userMessage);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Session-ID': this.currentSessionId || ''
    });

    const body: QueryRequest = {
      query: content,
      library: 'ADB800',
      sessionId: useContext ? (this.currentSessionId ?? undefined) : undefined,
      maxIterations: 5,
      includeDebugDetails: false
    };

    return this.http.post<QueryResponse>(`${this.apiUrl}/api/v1/query/agentic`, body, { headers })
      .pipe(
        takeUntil(this.abortController$),
        retry(2),
        tap(response => {
          this.isLoadingSubject.next(false);

          if (response.success) {
            const content = this.formatResponseContent(response);
            const metadata: MessageMetadata = {
              executionTime: response.executionTimeMs,
              executionPath: response.executionPath,
              agentStrategy: response.agentStrategy,
              iterationCount: response.iterationCount,
              maxIterations: response.maxIterations,
              goalAchieved: response.goalAchieved,
              conversationContextLoaded: response.conversationContextLoaded,
              executedSql: response.executedSql,
              executionSteps: response.executionSteps
            };
            const assistantMessage: Message = {
              id: this.generateMessageId(),
              role: 'assistant',
              content: content,
              timestamp: new Date(),
              metadata: metadata,
              queryResponse: response
            };
            this.addMessage(assistantMessage);
          }
        }),
        catchError(error => {
          this.isLoadingSubject.next(false);

          // Don't show error message if request was aborted by user
          if (error.name !== 'AbortError') {
            const errorMessage: Message = {
              id: this.generateMessageId(),
              role: 'assistant',
              content: error.userMessage || error.error?.error || error.error?.message || 'An error occurred. Please try again.',
              timestamp: new Date(),
              isError: true
            };
            this.addMessage(errorMessage);
          }

          return throwError(() => error);
        })
      );
  }

  public formatResponseContent(response: QueryResponse): string {
    if (response.error) {
      return `Error: ${response.error}`;
    }

    // If data is a string (already formatted by the agentic service), use as-is
    if (typeof response.data === 'string') {
      return response.data;
    }

    const parts: string[] = [];

    // If data is an array of rows
    if (Array.isArray(response.data) && response.data.length > 0) {
      parts.push(`Found ${response.rowCount ?? response.data.length} results.`);

      // Show first few rows as a preview
      const preview = response.data.slice(0, 5);
      const headers = response.columns ?? Object.keys(preview[0]);
      parts.push('\n| ' + headers.join(' | ') + ' |');
      parts.push('| ' + headers.map(() => '---').join(' | ') + ' |');
      for (const row of preview) {
        parts.push('| ' + headers.map(h => String(row[h] ?? '')).join(' | ') + ' |');
      }

      if (response.data.length > 5) {
        parts.push(`\n... and ${response.data.length - 5} more rows.`);
      }
    } else if (response.data) {
      parts.push(JSON.stringify(response.data, null, 2));
    } else {
      parts.push('Query executed successfully (no data returned).');
    }

    if (response.executedSql) {
      parts.push(`\nSQL: ${response.executedSql}`);
    }

    return parts.join('\n');
  }

  stopCurrentRequest(): void {
    this.abortController$.next();
    this.isLoadingSubject.next(false);

    // Notify backend to cancel server-side execution
    if (this.currentSessionId) {
      this.http.delete<CancelResponse>(
        `${this.apiUrl}/api/v1/query/agentic/${this.currentSessionId}/cancel`
      ).subscribe({
        error: () => {} // Best-effort cancel, ignore errors
      });
    }

    // Add a message indicating the request was stopped
    const stoppedMessage: Message = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: ' ',
      timestamp: new Date(),
      isError: false
    };
    this.addMessage(stoppedMessage);
  }

  private addMessage(message: Message): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  clearSession(): Observable<any> {
    if (!this.currentSessionId) return throwError(() => new Error('No active session'));

    return this.http.post(`${this.apiUrl}/api/v1/sessions/${this.currentSessionId}/clear`, {})
      .pipe(
        tap(() => this.clearMessages())
      );
  }

  getSessionContext(): Observable<any> {
    if (!this.currentSessionId) return throwError(() => new Error('No active session'));

    return this.http.get(`${this.apiUrl}/api/v1/sessions/${this.currentSessionId}/context`);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  exportChat(): void {
    const messages = this.messagesSubject.value;
    const exportData = messages.map(msg => {
      const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
      const time = msg.timestamp.toLocaleTimeString();
      return `[${time}] ${role}: ${msg.content}`;
    }).join('\n\n');

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  sendMessageStreaming(content: string, useContext: boolean = true): Observable<SseEvent> {
    if (!this.canSendRequest()) {
      return throwError(() => new Error('Please wait before sending another message'));
    }

    this.isLoadingSubject.next(true);

    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: content,
      timestamp: new Date()
    };
    this.addMessage(userMessage);

    return this.agenticStreamService.connectStream({
      query: content,
      library: 'ADB800',
      sessionId: useContext ? (this.currentSessionId ?? undefined) : undefined,
      maxIterations: 5
    });
  }

  addStreamingResult(content: string, metadata: MessageMetadata, queryResponse?: QueryResponse): void {
    const assistantMessage: Message = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: content,
      timestamp: new Date(),
      metadata: metadata,
      queryResponse: queryResponse
    };
    this.addMessage(assistantMessage);
    this.isLoadingSubject.next(false);
  }

  addUserMessage(content: string): void {
    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: content,
      timestamp: new Date()
    };
    this.addMessage(userMessage);
  }

  addSystemMessage(content: string, contentType: string = 'text'): void {
    const message: Message = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: content,
      timestamp: new Date(),
      contentType: contentType as any
    };
    this.addMessage(message);
  }

  setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  switchToSession(sessionId: string, messages: Message[]): void {
    this.currentSessionId = sessionId;
    localStorage.setItem('sessionId', sessionId);
    this.messagesSubject.next(messages);
  }

  startNewSession(): void {
    this.generateNewSession();
    this.messagesSubject.next([]);
  }

  mapBackendMessages(dtos: ChatMessageDto[]): Message[] {
    return dtos.map((dto, index) => ({
      id: `hist_${Date.now()}_${index}`,
      role: dto.role as 'user' | 'assistant',
      content: dto.content,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      metadata: dto.executionTimeMs ? { executionTime: dto.executionTimeMs } : undefined
    }));
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Check if an error response is a chat limit exceeded error
   */
  isChatLimitError(error: any): error is ChatLimitError {
    return error &&
           typeof error === 'object' &&
           'maxLimit' in error &&
           'currentCount' in error &&
           'error' in error &&
           error.error === 'Chat limit exceeded';
  }

  /**
   * Get chat limit info from error if it's a limit error
   */
  getChatLimitInfo(error: any): { hasWarning: boolean; warningMessage: string; messageCount: number; isBlocked: boolean } | null {
    if (this.isChatLimitError(error)) {
      return {
        hasWarning: true,
        warningMessage: error.message,
        messageCount: error.currentCount,
        isBlocked: true
      };
    }
    return null;
  }
}
