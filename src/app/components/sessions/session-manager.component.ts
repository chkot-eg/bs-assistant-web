import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// EG Components — replace '../../shared/eg-mock' with '@eg-apps/common' when registry is available
import {
  EgPageModule,
  EgHeaderModule,
  EgButtonModule,
  EgIconModule,
  EgProgressSpinnerModule,
  EgAccordionModule,
  EgBoxModule,
  EgSectionModule
} from '../../shared/eg-mock';
import { SessionService } from '../../services/session.service';
import { Session, ChatMessageDto } from '../../models/session.model';

@Component({
  selector: 'app-session-manager',
  standalone: true,
  imports: [
    CommonModule, EgPageModule, EgHeaderModule, EgButtonModule,
    EgIconModule, EgProgressSpinnerModule, EgAccordionModule,
    EgBoxModule, EgSectionModule
  ],
  templateUrl: './session-manager.component.html',
  styleUrls: ['./session-manager.component.scss']
})
export class SessionManagerComponent implements OnInit {
  sessions: Session[] = [];
  isLoading = false;
  expandedMessages: Record<string, ChatMessageDto[]> = {};
  loadingMessages: Record<string, boolean> = {};

  constructor(private sessionService: SessionService) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading = true;
    this.sessionService.getSessions().subscribe({
      next: (response) => {
        this.sessions = response.sessions || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadMessages(sessionId: string): void {
    if (this.expandedMessages[sessionId]) return;
    this.loadingMessages[sessionId] = true;
    this.sessionService.getSessionMessages(sessionId).subscribe({
      next: (response) => {
        this.expandedMessages[sessionId] = response.messages || [];
        this.loadingMessages[sessionId] = false;
      },
      error: () => {
        this.loadingMessages[sessionId] = false;
      }
    });
  }

  deleteSession(session: Session): void {
    if (!confirm(`Delete session ${session.sessionId}? This cannot be undone.`)) return;
    this.sessionService.deleteSession(session.sessionId).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.sessionId !== session.sessionId);
        delete this.expandedMessages[session.sessionId];
      }
    });
  }

  clearSession(session: Session): void {
    if (!confirm(`Clear all messages in session ${session.sessionId}?`)) return;
    this.sessionService.clearSession(session.sessionId).subscribe({
      next: () => {
        this.expandedMessages[session.sessionId] = [];
      }
    });
  }

  getMessageCount(session: Session): number {
    return session.messages?.length || this.expandedMessages[session.sessionId]?.length || 0;
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }

  truncateContent(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
}
