import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { ChatService } from '../../services/chat.service';
import { NobbService } from '../../services/nobb.service';
import { NobbArticleDialogComponent } from '../nobb-article-dialog/nobb-article-dialog.component';
import { Message } from '../../models/message.model';
import { Observable } from 'rxjs';

marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlighted = hljs.highlight(text, { language }).value;
      const encoded = encodeURIComponent(text);
      return `<div class="code-wrapper">` +
        `<button class="copy-btn" data-code="${encoded}" title="Kopiér kode">` +
        `<span class="material-icons">content_copy</span></button>` +
        `<pre class="hljs"><code class="language-${language}">${highlighted}</code></pre>` +
        `</div>`;
    }
  }
});

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
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
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
    { label: 'Sales Report', prompt: 'Show me the sales report for this month' },
    { label: 'Recent Orders', prompt: 'Show me the 5 most recent orders' },
    { label: 'Recent Invoices', prompt: 'Show me the 5 most recent invoices' },
    { label: 'Top Customers', prompt: 'Show me the top customers of this month' },
  ];

  constructor(
    private chatService: ChatService,
    private nobbService: NobbService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.messages$ = this.chatService.messages$;
    this.isLoading$ = this.chatService.isLoading$;
  }

  renderContent(content: string): SafeHtml {
    if (!content) return '';
    // Content may already be HTML when the chat service requested responseFormat=html
    // from the backend. marked.parse would HTML-escape angle brackets in that case
    // and render raw tags as text, so detect and pass HTML straight through.
    let html = this.looksLikeHtml(content) ? content : (marked.parse(content) as string);
    // Linkify 8-digit numbers only in NOBB-related table columns
    html = this.linkifyNobbNumbers(html);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private looksLikeHtml(content: string): boolean {
    const trimmed = content.trimStart();
    if (!trimmed.startsWith('<')) return false;
    return /^<\s*(p|table|h[1-6]|ul|ol|pre|div|section|article|blockquote)\b/i.test(trimmed);
  }

  private linkifyNobbNumbers(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('table').forEach(table => {
      const nobbColIndices = new Set<number>();
      table.querySelectorAll('thead th, tr:first-child th').forEach((th, index) => {
        if (/nobb/i.test(th.textContent || '')) {
          nobbColIndices.add(index);
        }
      });

      if (nobbColIndices.size === 0) return;

      table.querySelectorAll('tbody tr, tr').forEach(row => {
        row.querySelectorAll('td').forEach((td, index) => {
          if (nobbColIndices.has(index)) {
            const text = td.textContent || '';
            const match = text.match(/^(\d{8})$/);
            if (match) {
              td.innerHTML = `${match[1]} <a class="nobb-link" data-nobb="${match[1]}" href="javascript:void(0)" title="Klikk for å se NOBB artikkel ${match[1]}"><span class="material-icons nobb-icon">image_search</span></a>`;
            }
          }
        });
      });
    });

    return doc.body.innerHTML;
  }

  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent): void {
    const copyBtn = (event.target as HTMLElement).closest('.copy-btn') as HTMLElement;
    if (copyBtn) {
      event.preventDefault();
      event.stopPropagation();
      const code = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
      navigator.clipboard.writeText(code).then(() => {
        const icon = copyBtn.querySelector('.material-icons');
        if (icon) {
          icon.textContent = 'check';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            icon.textContent = 'content_copy';
            copyBtn.classList.remove('copied');
          }, 2000);
        }
      });
      return;
    }

    const nobbLink = (event.target as HTMLElement).closest('.nobb-link') as HTMLElement;
    if (!nobbLink) return;
    event.preventDefault();
    event.stopPropagation();
    const nobbNumber = nobbLink.getAttribute('data-nobb');
    if (!nobbNumber || nobbLink.classList.contains('nobb-loading')) return;
    nobbLink.classList.add('nobb-loading');
    this.nobbService.getArticle(nobbNumber).subscribe({
      next: (article) => {
        nobbLink.classList.remove('nobb-loading');
        this.dialog.open(NobbArticleDialogComponent, {
          data: { article, nobbNumber },
          width: 'auto',
          maxWidth: '95vw',
          maxHeight: '90vh',
          panelClass: 'nobb-dialog-panel'
        });
      },
      error: () => {
        nobbLink.classList.remove('nobb-loading');
        this.snackBar.open(`Kunne ikke hente artikkel ${nobbNumber}`, '', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
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