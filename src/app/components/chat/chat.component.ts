import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../models/message.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages$: Observable<Message[]>;
  isLoading$: Observable<boolean>;
  messageControl = new FormControl('', [Validators.required]);

  // Chat limit warning (managed by backend)
  hasWarning = false;
  warningMessage = '';
  messageCount = 0;
  isBlocked = false;

  quickActions = [
    { label: 'Show Tables', prompt: 'Show me all tables in the database' },
    { label: 'Customer Info', prompt: 'Show customer information' },
    { label: 'Recent Orders', prompt: 'Show recent orders' },
  ];

  constructor(
    private chatService: ChatService
  ) {
    this.messages$ = this.chatService.messages$;
    this.isLoading$ = this.chatService.isLoading$;
  }

  ngOnInit(): void {
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    if (this.isBlocked) {
      // Don't send if blocked by hard limit
      return;
    }

    if (this.messageControl.valid && this.messageControl.value) {
      const message = this.messageControl.value;
      this.messageControl.reset();

      this.chatService.sendMessage(message).subscribe({
        next: (response) => {
          // Check for chat limit warnings from backend
          if (response.hasWarning) {
            this.hasWarning = true;
            this.warningMessage = response.warningMessage || '';
            this.messageCount = response.messageCount || 0;
            this.isBlocked = response.isBlocked || false;
          } else {
            // Update message count even when no warning
            if (response.messageCount !== undefined) {
              this.messageCount = response.messageCount;
            }
          }
        },
        error: (error) => {
          console.error('Error:', error);

          // Check if this is a chat limit exceeded error
          const limitInfo = this.chatService.getChatLimitInfo(error.error || error);
          if (limitInfo) {
            this.hasWarning = limitInfo.hasWarning;
            this.warningMessage = limitInfo.warningMessage;
            this.messageCount = limitInfo.messageCount;
            this.isBlocked = limitInfo.isBlocked;
          }
        }
      });
    }
  }

  executeQuickAction(prompt: string): void {
    this.messageControl.setValue(prompt);
    this.sendMessage();
  }

  clearChat(): void {
    // Stop current request in chat service
    this.chatService.stopCurrentRequest();

    // Clear session on backend
    this.chatService.clearSession().subscribe({
      next: () => {
        // Reset warning state when clearing chat
        this.hasWarning = false;
        this.warningMessage = '';
        this.messageCount = 0;
        this.isBlocked = false;
      },
      error: (error) => {
        console.error('Error clearing chat:', error);

        // Still reset warning state even on error
        this.hasWarning = false;
        this.warningMessage = '';
        this.messageCount = 0;
        this.isBlocked = false;
      }
    });
  }

  /**
   * Dismiss the warning banner (but keep tracking the state)
   */
  dismissWarning(): void {
    this.hasWarning = false;
  }

  /**
   * Start a new conversation with fresh session
   */
  startNewConversation(): void {
    // Stop current request in chat service
    this.chatService.stopCurrentRequest();

    // Reset chat limit warning state
    this.hasWarning = false;
    this.warningMessage = '';
    this.messageCount = 0;
    this.isBlocked = false;

    // Start new session
    this.chatService.startNewSession();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) {
      // Ignore scroll errors
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}