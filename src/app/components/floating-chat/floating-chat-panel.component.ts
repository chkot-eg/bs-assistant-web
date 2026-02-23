import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChatToggleService, ChatState, ChatSize } from '../../services/chat-toggle.service';
import { ChatService } from '../../services/chat.service';
import { Message, MessageMetadata, QueryResponse, StreamingStep } from '../../models/message.model';
import { SseEvent } from '../../models/sse-events.model';
import { extractSqlFromArguments } from '../../utils/mcp-response-parser';
import { Observable, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { VoiceService, VoiceState } from '../../services/voice.service';
import { TableService } from '../../services/table.service';
import { SchemaService } from '../../services/schema.service';
import { DocumentService } from '../../services/document.service';
import { SessionService } from '../../services/session.service';
import { FeatureTourService } from '../../services/feature-tour.service';
import { Session } from '../../models/session.model';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { parseMcpResponseText } from '../../utils/mcp-response-parser';

@Component({
  selector: 'app-floating-chat-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './floating-chat-panel.component.html',
  styleUrls: ['./floating-chat-panel.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: '0' }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: '1' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(-20px)', opacity: '0' }))
      ])
    ])
  ]
})
export class FloatingChatPanelComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('chatPanel') private chatPanel!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef;

  isOpen$: Observable<boolean>;
  state$: Observable<ChatState>;
  messages$: Observable<Message[]>;
  isLoading$: Observable<boolean>;
  messageControl = new FormControl('', {
    validators: [Validators.required, Validators.maxLength(2000)],
    updateOn: 'change' // Keep immediate updates but optimize rendering
  });

  // Resize state
  isResizing = false;
  resizeDirection = '';
  startX = 0;
  startY = 0;
  startWidth = 0;
  startHeight = 0;

  // Drag state
  isDragging = false;
  dragPosition = { x: 20, y: 20 };

  // Scroll state
  private shouldAutoScroll = true;
  private previousMessageCount = 0;
  private isUserScrolling = false;
  private isLoading = false;

  // Context toggle
  useContext = true;

  // Quick actions toggle
  showQuickActions = false;

  // Contact Support
  showContactSupport = false;
  contactDetailsExpanded = false;

  // Quick actions list
  quickActions = [
    { label: 'Sales Report', prompt: 'Show me the sales report for this month', icon: 'bar_chart' },
    { label: 'Recent Orders', prompt: 'Show me the 5 most recent orders', icon: 'receipt' },
    { label: 'Recent Invoices', prompt: 'Show me the 5 most recent invoices', icon: 'description' },
    { label: 'Top Customers', prompt: 'Show me the top customers of this month', icon: 'people' },
  ];

  // SSE Streaming state
  isStreaming = false;
  streamingSteps: StreamingStep[] = [];
  currentResponseUsesContext = false;
  private streamSubscription: Subscription | null = null;

  // Chat limit warning (managed by backend)
  hasWarning = false;
  warningMessage = '';
  messageCount = 0;
  isBlocked = false;

  // File upload state
  isUploading = false;
  uploadProgress = 0;

  // Metadata expand/collapse state
  private expandedSqlMessages = new Set<string>();
  private expandedStepsMessages = new Set<string>();
  private expandedStepSqlEntries = new Set<string>();
  private expandedStreamingSqlEntries = new Set<number>();

  // History panel state
  showHistory = false;
  historySessions: Session[] = [];
  isLoadingHistory = false;
  isDeletingSession: string | null = null;

  // Voice properties
  voiceState$: Observable<VoiceState>;
  selectedLanguage: string;
  currentVoiceState: VoiceState = {
    isRecording: false,
    isProcessing: false,
    transcript: '',
    interimTranscript: '',
    language: 'en-US',
    error: null
  };
  private destroy$ = new Subject<void>();

  constructor(
    private chatToggleService: ChatToggleService,
    private chatService: ChatService,
    private voiceService: VoiceService,
    private tableService: TableService,
    private schemaService: SchemaService,
    private documentService: DocumentService,
    private sessionService: SessionService,
    private sanitizer: DomSanitizer,
    private featureTourService: FeatureTourService
  ) {
    this.isOpen$ = this.chatToggleService.isOpen$;
    this.state$ = this.chatToggleService.state$;
    this.messages$ = this.chatService.messages$;
    this.isLoading$ = this.chatService.isLoading$;
    this.voiceState$ = this.voiceService.voiceState$;
    this.selectedLanguage = this.voiceService.getDefaultLanguage();
  }

  ngOnInit(): void {
    // Load saved position if available
    const state = this.chatToggleService.getState();
    this.dragPosition = state.position;

    // Subscribe to loading state
    this.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });

    // Subscribe to messages to detect changes
    this.messages$.subscribe(messages => {
      if (messages.length > this.previousMessageCount) {
        this.previousMessageCount = messages.length;
        // Only auto-scroll if user hasn't manually scrolled up
        if (!this.isUserScrolling) {
          this.shouldAutoScroll = true;
          this.voiceService.clearTranscript();
        }
      }
    });
    // Track previous command to avoid duplicate execution
    let lastCommand: string | null = null;

    this.voiceState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(voiceState => {
      this.currentVoiceState = voiceState;

      console.log('[COMPONENT] Voice state:', {
        isRecording: voiceState.isRecording,
        commandDetected: voiceState.commandDetected,
        transcript: voiceState.transcript,
        lastCommand
      });

      // Handle voice commands - only when command is newly detected
      if (voiceState.commandDetected && voiceState.commandDetected !== lastCommand) {
        console.log('[COMPONENT] NEW command detected, executing:', voiceState.commandDetected);
        lastCommand = voiceState.commandDetected;
        this.handleVoiceCommand(voiceState.commandDetected, voiceState.transcript);
      } else if (!voiceState.commandDetected && lastCommand) {
        // Command was cleared, reset tracking
        console.log('[COMPONENT] Command cleared, resetting');
        lastCommand = null;
      } else if (voiceState.transcript && !voiceState.isRecording && !voiceState.commandDetected) {
        // Auto-fill textarea when recording stops (no command)
        console.log('[COMPONENT] Recording stopped, filling textarea');
        this.messageControl.setValue(voiceState.transcript, { emitEvent: false });
        this.adjustTextareaHeight();
      }
    });

    // When the user manually clears the textarea, reset the voice transcript so that
    // the next recording session starts fresh (no stale saved text gets restored).
    this.messageControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (!value || !value.trim()) {
        this.voiceService.clearTranscript();
      }
    });

    // Check for first message to show contact support
    this.checkFirstMessage();
  }

  ngAfterViewChecked(): void {
    // Only auto-scroll when new messages arrive and user hasn't scrolled up
    if (this.shouldAutoScroll && !this.isUserScrolling) {
      setTimeout(() => {
        this.scrollToBottom();
        this.shouldAutoScroll = false;
      }, 50);
    }
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.voiceService.stopRecording();
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
    }
  }

  closeChat(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.voiceService.stopRecording();
    this.voiceService.clearTranscript();
    this.messageControl.setValue('', { emitEvent: false });
    this.chatToggleService.closeChat();
  }

  onOverlayClick(event: MouseEvent): void {
    // Only close when clicking the overlay, not when clicking the chat panel
    event.stopPropagation();
    this.closeChat();
  }

  minimizeChat(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const currentState = this.chatToggleService.getState();
    if (currentState.size === 'minimized') {
      this.chatToggleService.setSize('normal');
    } else {
      this.chatToggleService.setSize('minimized');
    }
  }

  maximizeChat(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const currentState = this.chatToggleService.getState();
    if (currentState.size === 'fullscreen') {
      this.chatToggleService.setSize('normal');
    } else {
      this.chatToggleService.setSize('fullscreen');
    }
  }

  expandChat(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const currentState = this.chatToggleService.getState();
    if (currentState.size === 'expanded') {
      this.chatToggleService.setSize('normal');
    } else {
      this.chatToggleService.setSize('expanded');
    }
  }

  restoreChat(): void {
    this.chatToggleService.setSize('normal');
  }

  sendMessage(): void {
    if (this.isBlocked) {
      // Don't send if blocked by hard limit
      return;
    }

    if (this.messageControl.valid && this.messageControl.value?.trim()) {
      const message = this.messageControl.value.trim();
      const inputElement = this.messageInput?.nativeElement;

      this.clearInput(inputElement);

      // Force scroll to bottom when user sends a message
      this.isUserScrolling = false;
      this.shouldAutoScroll = true;

      // Check for slash commands first
      if (this.handleSlashCommand(message)) {
        return;
      }

      // Reset streaming state
      this.isStreaming = true;
      this.streamingSteps = [];
      this.expandedStreamingSqlEntries.clear();
      this.currentResponseUsesContext = false;

      // Try SSE streaming
      this.streamSubscription = this.chatService.sendMessageStreaming(message, this.useContext)
        .subscribe({
          next: (event: SseEvent) => this.handleSseEvent(event, inputElement),
          error: (error) => this.handleSseError(error, message, inputElement),
          complete: () => {
            this.isStreaming = false;
            this.streamingSteps = [];
          }
        });
    }
  }

  private clearInput(inputElement?: HTMLElement): void {
    this.messageControl.setValue('', {
      emitEvent: false,
      emitModelToViewChange: true,
      emitViewToModelChange: false
    });
    this.messageControl.markAsPristine();
    this.messageControl.markAsUntouched();
    this.voiceService.clearTranscript();
    if (inputElement) {
      (inputElement as HTMLTextAreaElement).style.height = '52px';
    }
  }

  private handleSseEvent(event: SseEvent, inputElement?: HTMLElement): void {
    switch (event.event) {
      case 'init':
        this.streamingSteps.push({
          type: 'init',
          message: 'Starting query...',
          timestamp: event.data.timestamp,
          icon: 'play_circle'
        });
        this.scrollToBottom();
        break;

      case 'context':
        this.currentResponseUsesContext = true;
        this.streamingSteps.push({
          type: 'context',
          message: 'Using conversation history',
          success: true,
          timestamp: event.data.timestamp,
          icon: 'psychology'
        });
        this.scrollToBottom();
        break;

      case 'step':
        const stepData = event.data;
        if (stepData.type === 'execution_step') {
          this.streamingSteps.push({
            type: 'execution_step',
            message: stepData.reason || stepData.message || stepData.toolUsed || 'Executing...',
            success: stepData.success,
            timestamp: stepData.timestamp,
            icon: stepData.success ? 'check_circle' : (stepData.success === false ? 'error' : 'hourglass_empty'),
            sql: stepData.sql,
            attemptNumber: stepData.attemptNumber,
            toolUsed: stepData.toolUsed,
            rowCount: stepData.rowCount,
            executionTimeMs: stepData.executionTimeMs,
            reason: stepData.reason,
            errorMessage: stepData.errorMessage
          });
        } else {
          this.streamingSteps.push({
            type: 'step',
            message: stepData.message,
            success: stepData.success,
            timestamp: stepData.timestamp,
            icon: stepData.success ? 'check_circle' : 'error'
          });
        }
        this.scrollToBottom();
        break;

      case 'progress':
        this.streamingSteps.push({
          type: 'progress',
          message: event.data.message || event.data.status || 'Processing...',
          success: true,
          timestamp: event.data.timestamp,
          icon: 'hourglass_empty'
        });
        this.scrollToBottom();
        break;

      case 'limit':
        // Chat limit exceeded - stop streaming and show blocked UI
        this.isStreaming = false;
        this.streamingSteps = [];
        this.hasWarning = true;
        this.warningMessage = event.data.message;
        this.messageCount = event.data.currentCount;
        this.isBlocked = true;

        // Add an error message to the chat
        const limitErrorMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant' as const,
          content: event.data.message,
          timestamp: new Date(),
          isError: true
        };
        this.chatService.addSystemMessage(limitErrorMessage.content, 'text');

        this.scrollToBottom();
        if (inputElement) { inputElement.focus(); }
        break;

      case 'complete':
        let completeContent: string;
        let completeMetadata: MessageMetadata = {
          conversationContextLoaded: this.currentResponseUsesContext
        };
        let completeQueryResponse: QueryResponse | undefined;

        const rawResult = event.data.result;

        // MCP tool response format: { content: [{ type: "text", text: "..." }] }
        if (rawResult?.content && Array.isArray(rawResult.content)) {
          completeContent = rawResult.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('\n');
          // Clean leading/trailing quotes if the text was JSON-stringified
          if (completeContent.startsWith('"') && completeContent.endsWith('"')) {
            completeContent = completeContent.slice(1, -1);
          }
          // Unescape literal \n, \r\n, \t sequences from double-encoded JSON
          completeContent = completeContent
            .replace(/\\r\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"');

          // Parse MCP markdown into structured content + metadata
          const parsed = parseMcpResponseText(completeContent);
          completeContent = parsed.content;
          completeMetadata = { ...completeMetadata, ...parsed.metadata };

          // Merge agenticMetadata for SQL data (it coexists alongside MCP result)
          if (event.data.agenticMetadata) {
            const meta = event.data.agenticMetadata;
            if (meta.finalSql) {
              completeMetadata.executedSql = meta.finalSql;
            }
            if (meta.executionSteps?.length) {
              completeMetadata.executionSteps = meta.executionSteps.map((s: any) => ({
                attemptNumber: s.attemptNumber,
                toolUsed: s.toolUsed,
                sqlQuery: s.sql,
                success: s.success,
                rowCount: s.rowCount,
                executionTimeMs: s.executionTimeMs,
                reason: s.reason,
                errorMessage: s.errorMessage
              }));
            }
            if (meta.totalExecutionTimeMs && !completeMetadata.executionTime) {
              completeMetadata.executionTime = meta.totalExecutionTimeMs;
            }
            if (meta.goalAchieved !== undefined && completeMetadata.goalAchieved === undefined) {
              completeMetadata.goalAchieved = meta.goalAchieved;
            }
            if (meta.iterationCount !== undefined && !completeMetadata.iterationCount) {
              completeMetadata.iterationCount = meta.iterationCount;
              completeMetadata.maxIterations = meta.maxIterations;
            }
            if (meta.agentStrategy && !completeMetadata.agentStrategy) {
              completeMetadata.agentStrategy = meta.agentStrategy;
            }
            if (!completeMetadata.executionPath) {
              completeMetadata.executionPath = 'AGENTIC';
            }
          }
        } else if (rawResult && typeof rawResult === 'object' && event.data.agenticMetadata) {
          // SSE complete with agenticMetadata
          const meta = event.data.agenticMetadata;
          completeContent = meta.formattedResponse || String(rawResult);
          completeMetadata = {
            executionTime: meta.totalExecutionTimeMs,
            executionPath: 'AGENTIC',
            agentStrategy: meta.agentStrategy,
            iterationCount: meta.iterationCount,
            maxIterations: meta.maxIterations,
            goalAchieved: meta.goalAchieved,
            conversationContextLoaded: this.currentResponseUsesContext,
            executedSql: meta.finalSql,
            executionSteps: meta.executionSteps?.map((s: any) => ({
              attemptNumber: s.attemptNumber,
              toolUsed: s.toolUsed,
              sqlQuery: s.sql,
              success: s.success,
              rowCount: s.rowCount,
              executionTimeMs: s.executionTimeMs,
              reason: s.reason,
              errorMessage: s.errorMessage
            }))
          };
        } else if (rawResult && typeof rawResult === 'object' && 'success' in rawResult) {
          // Direct QueryResponse format (fallback)
          const qr = rawResult as QueryResponse;
          completeContent = this.chatService.formatResponseContent(qr);
          completeQueryResponse = qr;
          completeMetadata = {
            executionTime: qr.executionTimeMs,
            executionPath: qr.executionPath,
            agentStrategy: qr.agentStrategy,
            iterationCount: qr.iterationCount,
            maxIterations: qr.maxIterations,
            goalAchieved: qr.goalAchieved,
            conversationContextLoaded: this.currentResponseUsesContext,
            executedSql: qr.executedSql,
            executionSteps: qr.executionSteps?.map(step => ({
              ...step,
              sqlQuery: step.sqlQuery || extractSqlFromArguments(step.arguments)
            }))
          };
        } else {
          completeContent = String(rawResult || 'No response received.');
        }

        // Fallback: derive executedSql from last successful step if not set
        if (!completeMetadata.executedSql && completeMetadata.executionSteps?.length) {
          const lastSuccess = [...completeMetadata.executionSteps]
            .reverse()
            .find(s => s.success && s.sqlQuery);
          if (lastSuccess) {
            completeMetadata.executedSql = lastSuccess.sqlQuery;
          }
        }

        this.chatService.addStreamingResult(completeContent, completeMetadata, completeQueryResponse);
        this.isStreaming = false;
        this.streamingSteps = [];
        this.scrollToBottom();
        if (inputElement) { inputElement.focus(); }
        break;
    }
  }

  private handleSseError(error: any, originalMessage: string, inputElement?: HTMLElement): void {
    console.warn('SSE streaming failed:', error);
    this.isStreaming = false;
    this.streamingSteps = [];

    // NOTE: Chat limit errors come as event:limit (handled in handleSseEvent),
    // not as SSE error events. Fallback to POST for connection errors.

    // Fallback to POST-based flow for other errors
    this.chatService.sendMessage(originalMessage, this.useContext).subscribe({
      next: (response) => {
        // Check for chat limit warnings in POST response
        if (response.hasWarning) {
          this.hasWarning = true;
          this.warningMessage = response.warningMessage || '';
          this.messageCount = response.messageCount || 0;
          this.isBlocked = response.isBlocked || false;
        } else if (response.messageCount !== undefined) {
          this.messageCount = response.messageCount;
        }
        this.scrollToBottom();
        if (inputElement) { inputElement.focus(); }
      },
      error: (err) => {
        console.error('POST fallback also failed:', err);

        // Check POST error for chat limit
        const postLimitInfo = this.chatService.getChatLimitInfo(err.error || err);
        if (postLimitInfo) {
          this.hasWarning = postLimitInfo.hasWarning;
          this.warningMessage = postLimitInfo.warningMessage;
          this.messageCount = postLimitInfo.messageCount;
          this.isBlocked = postLimitInfo.isBlocked;
        }

        this.scrollToBottom();
        if (inputElement) { inputElement.focus(); }
      }
    });
  }

  stopRequest(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
    }
    this.isStreaming = false;
    this.streamingSteps = [];
    this.chatService.stopCurrentRequest();
  }

  // --- Slash Commands ---

  private handleSlashCommand(input: string): boolean {
    const trimmed = input.trim();

    if (trimmed === '/tables') {
      this.executeTablesCommand();
      return true;
    }

    const tableSearchMatch = trimmed.match(/^\/tables\s+search\s+(.+)$/i);
    if (tableSearchMatch) {
      this.executeTableSearchCommand(tableSearchMatch[1].trim());
      return true;
    }

    const schemaMatch = trimmed.match(/^\/schema\s+(\S+)$/i);
    if (schemaMatch) {
      this.executeSchemaCommand(schemaMatch[1].trim());
      return true;
    }

    const docSearchMatch = trimmed.match(/^\/search\s+(.+)$/i);
    if (docSearchMatch) {
      this.executeDocSearchCommand(docSearchMatch[1].trim());
      return true;
    }

    return false;
  }

  /**
   * Extract data from MCP tool response format.
   * Backend may return { content: [{ type: "text", text: "..." }] } instead of a direct array.
   */
  private extractMcpData(responseData: any): { data: any[] | null; rawText: string | null } {
    // Direct array — no extraction needed
    if (Array.isArray(responseData)) {
      return { data: responseData, rawText: null };
    }
    // MCP format
    if (responseData?.content && Array.isArray(responseData.content)) {
      const text = responseData.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('');
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.tables)) {
          return { data: parsed.tables.map((name: string) => ({ TABLE_NAME: name })), rawText: text };
        }
        if (parsed.schemas && typeof parsed.schemas === 'object') {
          // Format: { schemas: { TABLE_NAME: { columns: [...] } } }
          const firstSchema: any = Object.values(parsed.schemas)[0];
          if (firstSchema && Array.isArray(firstSchema.columns)) {
            return { data: firstSchema.columns, rawText: text };
          }
        }
        if (Array.isArray(parsed.columns)) {
          return { data: parsed.columns, rawText: text };
        }
        if (Array.isArray(parsed.data)) {
          return { data: parsed.data, rawText: text };
        }
        if (Array.isArray(parsed)) {
          return { data: parsed, rawText: text };
        }
      } catch {
        // Not JSON
      }
      return { data: null, rawText: text };
    }
    return { data: null, rawText: null };
  }

  private executeTablesCommand(): void {
    this.chatService.addUserMessage('/tables');
    this.chatService.setLoading(true);
    this.tableService.getAllTables().subscribe({
      next: (response) => {
        this.chatService.setLoading(false);
        const extracted = this.extractMcpData(response.data);
        if (response.success && extracted.data && extracted.data.length > 0) {
          this.chatService.addSystemMessage(this.formatTableListContent(extracted.data, response.rowCount || extracted.data.length), 'table-list');
        } else {
          this.chatService.addSystemMessage(response.error || 'No tables found.', 'text');
        }
        this.scrollToBottom();
      },
      error: (err) => {
        this.chatService.setLoading(false);
        this.chatService.addSystemMessage('Failed to load tables: ' + (err.userMessage || err.message), 'text');
        this.scrollToBottom();
      }
    });
  }

  private executeTableSearchCommand(query: string): void {
    this.chatService.addUserMessage(`/tables search ${query}`);
    this.chatService.setLoading(true);
    this.tableService.searchTables(query).subscribe({
      next: (response) => {
        this.chatService.setLoading(false);
        const extracted = this.extractMcpData(response.data);
        if (response.success && extracted.data && extracted.data.length > 0) {
          this.chatService.addSystemMessage(this.formatTableListContent(extracted.data, response.rowCount || extracted.data.length, query), 'table-list');
        } else {
          this.chatService.addSystemMessage(`No tables found matching "${query}".`, 'text');
        }
        this.scrollToBottom();
      },
      error: (err) => {
        this.chatService.setLoading(false);
        this.chatService.addSystemMessage('Search failed: ' + (err.userMessage || err.message), 'text');
        this.scrollToBottom();
      }
    });
  }

  private executeSchemaCommand(tableName: string): void {
    this.chatService.addUserMessage(`/schema ${tableName}`);
    this.chatService.setLoading(true);
    this.schemaService.getSchema(tableName).subscribe({
      next: (response) => {
        this.chatService.setLoading(false);
        const extracted = this.extractMcpData(response.data);
        if (response.success && extracted.data && extracted.data.length > 0) {
          this.chatService.addSystemMessage(this.formatSchemaContent(tableName, extracted.data), 'schema');
        } else if (response.success && response.data) {
          // Fallback: pass raw data to formatter
          this.chatService.addSystemMessage(this.formatSchemaContent(tableName, response.data), 'schema');
        } else {
          this.chatService.addSystemMessage(response.error || `Schema not found for "${tableName}".`, 'text');
        }
        this.scrollToBottom();
      },
      error: (err) => {
        this.chatService.setLoading(false);
        this.chatService.addSystemMessage('Failed to load schema: ' + (err.userMessage || err.message), 'text');
        this.scrollToBottom();
      }
    });
  }

  private executeDocSearchCommand(query: string): void {
    this.chatService.addUserMessage(`/search ${query}`);
    this.chatService.setLoading(true);
    this.documentService.search({ query, topK: 5 }).subscribe({
      next: (response) => {
        this.chatService.setLoading(false);
        if (response.success && response.results.length > 0) {
          this.chatService.addSystemMessage(this.formatDocSearchResults(response.results, response.count, query), 'search-result');
        } else {
          this.chatService.addSystemMessage(`No documents found matching "${query}".`, 'text');
        }
        this.scrollToBottom();
      },
      error: (err) => {
        this.chatService.setLoading(false);
        this.chatService.addSystemMessage('Search failed: ' + (err.userMessage || err.message), 'text');
        this.scrollToBottom();
      }
    });
  }

  private formatTableListContent(data: any[], rowCount?: number, searchQuery?: string): string {
    const header = searchQuery
      ? `## Tables matching "${searchQuery}" (${rowCount ?? data.length} found)`
      : `## All Tables (${rowCount ?? data.length})`;
    const tableRows = data.slice(0, 50).map((t: any) => {
      const name = t.TABLE_NAME || t.tableName || t.name || Object.values(t)[0];
      const desc = t.TABLE_TEXT || t.description || t.text || '';
      return `- **${name}**${desc ? ' — ' + desc : ''}`;
    }).join('\n');
    let content = `${header}\n\n${tableRows}`;
    if (data.length > 50) {
      content += `\n\n*... and ${data.length - 50} more tables.*`;
    }
    return content;
  }

  private formatSchemaContent(tableName: string, data: any): string {
    const header = `## Schema for ${tableName.toUpperCase()}`;
    if (Array.isArray(data)) {
      // Build a markdown table
      const rows = data.map((col: any) => {
        const name = col.COLUMN_NAME || col.columnName || col.name || '';
        const type = col.DATA_TYPE || col.dataType || col.type || '';
        const len = col.LENGTH || col.length || '';
        const desc = col.COLUMN_TEXT || col.description || '';
        const pk = col.PRIMARY_KEY ? '**PK**' : '';
        return `| ${name} | ${type}${len ? '(' + len + ')' : ''} | ${pk} | ${desc || '—'} |`;
      }).join('\n');
      return `${header}\n\n| Column | Type | Key | Description |\n| --- | --- | --- | --- |\n${rows}`;
    }
    return `${header}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
  }

  private formatDocSearchResults(results: any[], count: number, query: string): string {
    const header = `## Document search for "${query}" (${count} found)`;
    const items = results.map((r: any, i: number) => {
      const name = r.fileName || 'Unknown';
      const category = r.category ? ` \`${r.category}\`` : '';
      const preview = r.content?.substring(0, 200) || '';
      const ellipsis = (r.content?.length || 0) > 200 ? '...' : '';
      return `${i + 1}. **${name}**${category}\n   ${preview}${ellipsis}`;
    }).join('\n\n');
    return `${header}\n\n${items}`;
  }

  // --- Rich Metadata ---

  toggleSqlExpanded(messageId: string): void {
    if (this.expandedSqlMessages.has(messageId)) {
      this.expandedSqlMessages.delete(messageId);
    } else {
      this.expandedSqlMessages.add(messageId);
    }
  }

  isSqlExpanded(messageId: string): boolean {
    return this.expandedSqlMessages.has(messageId);
  }

  toggleStepsExpanded(messageId: string): void {
    if (this.expandedStepsMessages.has(messageId)) {
      this.expandedStepsMessages.delete(messageId);
    } else {
      this.expandedStepsMessages.add(messageId);
    }
  }

  isStepsExpanded(messageId: string): boolean {
    return this.expandedStepsMessages.has(messageId);
  }

  toggleStepSqlExpanded(messageId: string, stepIndex: number): void {
    const key = `${messageId}_step_${stepIndex}`;
    if (this.expandedStepSqlEntries.has(key)) {
      this.expandedStepSqlEntries.delete(key);
    } else {
      this.expandedStepSqlEntries.add(key);
    }
  }

  isStepSqlExpanded(messageId: string, stepIndex: number): boolean {
    return this.expandedStepSqlEntries.has(`${messageId}_step_${stepIndex}`);
  }

  toggleStreamingSqlExpanded(stepIndex: number): void {
    if (this.expandedStreamingSqlEntries.has(stepIndex)) {
      this.expandedStreamingSqlEntries.delete(stepIndex);
    } else {
      this.expandedStreamingSqlEntries.add(stepIndex);
    }
  }

  isStreamingSqlExpanded(stepIndex: number): boolean {
    return this.expandedStreamingSqlEntries.has(stepIndex);
  }

  // --- Document Upload ---

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
      this.chatService.addSystemMessage('File too large. Maximum size is 10MB.', 'text');
      this.resetFileInput();
      return;
    }

    this.chatService.addUserMessage(`Uploading: ${file.name}`);
    this.isUploading = true;
    this.uploadProgress = 0;
    this.scrollToBottom();

    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) { this.uploadProgress += 10; }
    }, 200);

    this.documentService.upload(file).subscribe({
      next: (response) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.isUploading = false;
        const content = `Document uploaded successfully!\n\nFile: ${response.fileName}\nSize: ${this.formatFileSize(response.fileSize)}\nID: ${response.documentId}\nStatus: ${response.processingStatus}\n\n${response.message}`;
        this.chatService.addSystemMessage(content, 'upload-result');
        this.resetFileInput();
        this.scrollToBottom();
      },
      error: (err) => {
        clearInterval(progressInterval);
        this.isUploading = false;
        this.uploadProgress = 0;
        this.chatService.addSystemMessage('Upload failed: ' + (err.userMessage || err.message || 'Unknown error'), 'text');
        this.resetFileInput();
        this.scrollToBottom();
      }
    });
  }

  private resetFileInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  clearChat(): void {
    if (confirm('Are you sure you want to clear the chat history?')) {
      // Stop any ongoing streaming request
      if (this.streamSubscription) {
        this.streamSubscription.unsubscribe();
        this.streamSubscription = null;
      }
      this.isStreaming = false;
      this.streamingSteps = [];

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

          // Hide contact support button when chat is cleared
          this.showContactSupport = false;
          this.contactDetailsExpanded = false;
        },
        error: (error) => {
          console.error('Error clearing chat:', error);
          // Fallback: just clear messages locally if API fails
          this.chatService.clearMessages();

          // Still reset warning state even on error
          this.hasWarning = false;
          this.warningMessage = '';
          this.messageCount = 0;
          this.isBlocked = false;

          this.showContactSupport = false;
          this.contactDetailsExpanded = false;
        }
      });
    }
  }

  /**
   * Dismiss the warning banner (but keep tracking the state)
   */
  dismissWarning(): void {
    this.hasWarning = false;
  }

  exportChat(): void {
    this.chatService.exportChat();
  }

  toggleContext(): void {
    this.useContext = !this.useContext;
  }

  // --- History Panel ---

  startFeatureTour(): void {
    this.featureTourService.resetTour();
    this.featureTourService.startTour();
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
    if (this.showHistory) {
      this.loadSessionHistory();
    }
  }

  private loadSessionHistory(): void {
    this.isLoadingHistory = true;
    this.sessionService.getSessions().subscribe({
      next: (response) => {
        this.historySessions = (response.sessions || [])
          .sort((a, b) => {
            const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
            const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
            return dateB - dateA;
          });
        this.isLoadingHistory = false;
      },
      error: () => {
        this.isLoadingHistory = false;
        this.historySessions = [];
      }
    });
  }

  selectSession(session: Session): void {
    if (session.sessionId === this.chatService.getCurrentSessionId()) {
      this.showHistory = false;
      return;
    }

    this.isLoadingHistory = true;
    this.sessionService.getSessionMessages(session.sessionId).subscribe({
      next: (response) => {
        const messages = this.chatService.mapBackendMessages(response.messages || []);
        this.chatService.switchToSession(session.sessionId, messages);
        this.showHistory = false;
        this.isLoadingHistory = false;
        this.previousMessageCount = messages.length;
        this.shouldAutoScroll = true;
      },
      error: () => {
        this.isLoadingHistory = false;
        this.chatService.switchToSession(session.sessionId, []);
        this.showHistory = false;
      }
    });
  }

  startNewConversation(): void {
    // Stop any ongoing streaming request
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
    }
    this.isStreaming = false;
    this.streamingSteps = [];

    // Stop current request in chat service
    this.chatService.stopCurrentRequest();

    // Reset chat limit warning state
    this.hasWarning = false;
    this.warningMessage = '';
    this.messageCount = 0;
    this.isBlocked = false;

    // Start new session
    this.chatService.startNewSession();

    // Reset UI state
    this.showHistory = false;
    this.showContactSupport = false;
    this.contactDetailsExpanded = false;
  }

  deleteHistorySession(event: MouseEvent, session: Session): void {
    event.stopPropagation();
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    this.isDeletingSession = session.sessionId;
    this.sessionService.deleteSession(session.sessionId).subscribe({
      next: () => {
        this.historySessions = this.historySessions.filter(
          s => s.sessionId !== session.sessionId
        );
        this.isDeletingSession = null;

        if (session.sessionId === this.chatService.getCurrentSessionId()) {
          this.chatService.startNewSession();
        }
      },
      error: () => {
        this.isDeletingSession = null;
      }
    });
  }

  isCurrentSession(sessionId: string): boolean {
    return sessionId === this.chatService.getCurrentSessionId();
  }

  formatSessionDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getSessionPreview(session: Session): string {
    if (session.messages && session.messages.length > 0) {
      const firstUserMsg = session.messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        return firstUserMsg.content.length > 50
          ? firstUserMsg.content.substring(0, 50) + '...'
          : firstUserMsg.content;
      }
    }
    return session.sessionId;
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer?.nativeElement) {
        const element = this.scrollContainer.nativeElement;
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          element.scrollTop = element.scrollHeight;
        });
      }
    } catch (err) {
      // Ignore scroll errors - this can happen during component initialization
      console.debug('Scroll error (non-critical):', err);
    }
  }

  private scrollToBottomSmooth(): void {
    try {
      if (this.scrollContainer?.nativeElement) {
        const element = this.scrollContainer.nativeElement;
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }
    } catch (err) {
      console.debug('Scroll error (non-critical):', err);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle Enter key - send message if not holding Shift
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      // Only send if not currently loading and has valid input
      if (!this.isLoading && this.messageControl.valid && this.messageControl.value?.trim()) {
        this.sendMessage();
      }
    }
    // Shift+Enter allows new line
  }

  adjustTextareaHeight(): void {
    const textarea = this.messageInput?.nativeElement;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    requestAnimationFrame(() => {
      textarea.style.height = 'auto';

      // Calculate new height based on content
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 52), 120);

      // Apply new height smoothly
      textarea.style.height = `${newHeight}px`;
    });
  }

  getInputHint(): string {
    if (this.isLoading) {
      return 'Processing your request... Click Stop to cancel';
    }
    const value = this.messageControl.value || '';
    if (value.startsWith('/')) {
      return '/tables, /tables search <q>, /schema <name>, /search <q>';
    }
    return 'Press Enter to send, Shift+Enter for new line';
  }

  getSendButtonTooltip(): string {
    if (this.isLoading) {
      return 'Please wait...';
    }
    if (this.messageControl.invalid || !this.messageControl.value?.trim()) {
      return 'Type a message to send';
    }
    return 'Send message (Enter)';
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Check if user is at the bottom (within 50px threshold)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    // If user scrolls up, mark as user scrolling
    if (!isAtBottom) {
      this.isUserScrolling = true;
      this.shouldAutoScroll = false;
    } else {
      // User scrolled back to bottom, re-enable auto-scroll
      this.isUserScrolling = false;
      this.shouldAutoScroll = false; // Will be set to true when new message arrives
    }
  }

  // Resize handling
  startResize(event: MouseEvent, direction: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.isResizing = true;
    this.resizeDirection = direction;
    this.startX = event.clientX;
    this.startY = event.clientY;
    const state = this.chatToggleService.getState();
    this.startWidth = state.width;
    this.startHeight = state.height;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    let newWidth = this.startWidth;
    let newHeight = this.startHeight;

    // Handle different resize directions
    if (this.resizeDirection.includes('w')) {
      newWidth = Math.max(300, Math.min(window.innerWidth * 0.9, this.startWidth - deltaX));
    }
    if (this.resizeDirection.includes('e')) {
      newWidth = Math.max(300, Math.min(window.innerWidth * 0.9, this.startWidth + deltaX));
    }
    if (this.resizeDirection.includes('n')) {
      newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, this.startHeight - deltaY));
    }
    if (this.resizeDirection.includes('s')) {
      newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, this.startHeight + deltaY));
    }

    this.chatToggleService.updateDimensions(newWidth, newHeight);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isResizing = false;
    this.resizeDirection = '';
  }

  // Drag handling
  onDragEnded(event: any): void {
    this.dragPosition = event.source.getFreeDragPosition();
    this.chatToggleService.updatePosition(this.dragPosition.x, this.dragPosition.y);
  }

  // Quick actions
  executeQuickAction(prompt: string): void {
    if (prompt && prompt.trim()) {
      this.messageControl.setValue(prompt.trim());
      this.sendMessage();
    }
  }

  toggleVoiceRecording(): void {
    if (this.currentVoiceState.isRecording) {
      this.voiceService.stopRecording();
    } else {
      this.voiceService.startRecording(this.selectedLanguage);
    }
  }

  onLanguageChange(): void {
    if (this.currentVoiceState.isRecording) {
      this.voiceService.stopRecording();
      setTimeout(() => {
        this.voiceService.startRecording(this.selectedLanguage);
      }, 200);
    }
  }

  onTranscriptChange(_event: any): void {
    const transcriptValue = this.currentVoiceState.transcript;
    if (transcriptValue && this.messageInput?.nativeElement) {
      if (this.messageInput.nativeElement.value !== transcriptValue) {
        this.messageControl.setValue(transcriptValue, { emitEvent: false });
      }
    }
  }

  clearVoiceError(): void {
    this.voiceService.clearTranscript();
  }

  /**
   * Handle voice commands (SEND)
   */
  private handleVoiceCommand(command: 'SEND', transcript: string): void {
    console.log('[HANDLER] Executing voice command:', command, 'Transcript:', transcript);

    // Stop recording first
    this.voiceService.stopRecording();

    // Fill the textarea with the transcript (without the command phrase)
    this.messageControl.setValue(transcript, { emitEvent: false });
    this.adjustTextareaHeight();

    // Send the message automatically
    setTimeout(() => {
      if (transcript.trim()) {
        this.sendMessage();
      }
    }, 100);

    console.log('[HANDLER] Command execution completed');
  }

  renderMarkdown(content: string): SafeHtml {
    if (!content) return '';
    const html = marked.parse(content, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getLanguages(): { [key: string]: string } {
    return this.voiceService.getSupportedLanguages();
  }

  // Contact Support methods
  private checkFirstMessage(): void {
    this.messages$.subscribe(messages => {
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length >= 1 && !this.showContactSupport) {
        this.showContactSupport = true;
      }
    });
  }

  toggleContactDetails(): void {
    this.contactDetailsExpanded = !this.contactDetailsExpanded;
  }

  onTextareaFocus(): void {
    // Collapse contact support when user clicks on textarea
    if (this.contactDetailsExpanded) {
      this.contactDetailsExpanded = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Check if contact support is expanded
    if (!this.contactDetailsExpanded) {
      return;
    }

    const target = event.target as HTMLElement;

    // Check if click is outside contact support area
    const contactButton = target.closest('.contact-support-btn-centered');
    const contactDetails = target.closest('.contact-details-section');

    // If click is not on the button or the details section, collapse it
    if (!contactButton && !contactDetails) {
      this.contactDetailsExpanded = false;
    }
  }
}