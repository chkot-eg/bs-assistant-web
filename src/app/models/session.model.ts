// Maps to backend ChatSession model
export interface Session {
  sessionId: string;
  messages?: ChatMessageDto[];
  context?: Record<string, any>;
  createdAt?: string;
  lastActivity?: string;
}

// Maps to backend ChatMessage model
export interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  queryType?: string;
  executionTimeMs?: number;
}

// Response envelopes matching backend controller responses
export interface SessionListResponse {
  success: boolean;
  count: number;
  sessions: Session[];
}

export interface SessionDetailResponse {
  success: boolean;
  session: Session;
}

export interface SessionMessagesResponse {
  success: boolean;
  sessionId: string;
  messageCount: number;
  messages: ChatMessageDto[];
}

export interface SessionContextResponse {
  success: boolean;
  sessionId: string;
  context: Record<string, any>;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}
