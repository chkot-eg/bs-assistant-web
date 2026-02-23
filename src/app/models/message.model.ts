// ==========================================
// Backend DTO: QueryRequest
// Maps to: no.eg.bsassistantbot.dto.QueryRequest
// ==========================================
export interface QueryRequest {
  query: string;
  library?: string;
  queryType?: string;
  sessionId?: string;
  executeImmediately?: boolean;
  maxIterations?: number;
  includeDebugDetails?: boolean;
  parameters?: Record<string, any>;
}

// ==========================================
// Backend DTO: QueryResponse
// Maps to: no.eg.bsassistantbot.dto.QueryResponse
// ==========================================
export interface QueryResponse {
  success: boolean;
  data?: any;
  executedSql?: string;
  generatedSql?: string;
  rowCount?: number;
  columns?: string[];
  executionTimeMs?: number;
  executionPath?: 'MCP_SUBPROCESS' | 'DIRECT_SERVICE' | 'AGENTIC' | string;
  error?: string;
  errorDetails?: string;
  sessionId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;

  // Agentic fields (only present for queryType=agentic)
  agentStrategy?: string;
  iterationCount?: number;
  maxIterations?: number;
  goalAchieved?: boolean;
  conversationContextLoaded?: boolean;
  executionSteps?: AgenticStep[];
  debugDetails?: string;
  adaptationFeedback?: string[];
  agentErrors?: string[];
  synthesizedAnswer?: string;

  // Chat limit warning fields
  hasWarning?: boolean;
  warningMessage?: string;
  messageCount?: number;
  isBlocked?: boolean;
}

export interface AgenticStep {
  attemptNumber?: number;
  toolUsed?: string;
  arguments?: string;
  sqlQuery?: string;
  result?: string;
  success?: boolean;
  reason?: string;
  errorMessage?: string;
  rowCount?: number;
  executionTimeMs?: number;
  timestamp?: string;
}

// ==========================================
// Backend DTO: ErrorResponse
// Maps to: no.eg.bsassistantbot.dto.ErrorResponse
// ==========================================
export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}

// ==========================================
// Local UI model (not a backend DTO)
// ==========================================
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  isError?: boolean;
  queryResponse?: QueryResponse;
  contentType?: 'text' | 'table-list' | 'schema' | 'upload-result' | 'search-result';
}

export interface MessageMetadata {
  executionTime?: number;
  tablesUsed?: string[];
  queryOptimized?: boolean;
  hasContext?: boolean;
  cacheHit?: boolean;
  executionPath?: string;
  agentStrategy?: string;
  iterationCount?: number;
  maxIterations?: number;
  goalAchieved?: boolean;
  conversationContextLoaded?: boolean;
  executedSql?: string;
  executionSteps?: AgenticStep[];
  synthesizedAnswer?: string;
  rawDataContent?: string;
}

export interface StreamingStep {
  type: string;
  message: string;
  success?: boolean;
  timestamp: number;
  icon?: string;
  sql?: string | null;
  attemptNumber?: number;
  toolUsed?: string;
  rowCount?: number | null;
  executionTimeMs?: number | null;
  reason?: string | null;
  errorMessage?: string | null;
}

// Legacy interface kept for backward compatibility
export interface ChatResponse {
  success: boolean;
  result?: string;
  error?: string;
  executionTime?: number;
  sessionId?: string;
  hasContext?: boolean;
  metadata?: MessageMetadata;
  tablesUsed?: string[];
}

// Cancel endpoint response
export interface CancelResponse {
  sessionId: string;
  timestamp: number;
  status: 'CANCELLED' | 'NOT_FOUND' | 'ALREADY_COMPLETED' | 'ERROR';
  message: string;
}

// Chat limit exceeded error response
export interface ChatLimitError {
  maxLimit: number;
  currentCount: number;
  sessionId: string;
  error: string;
  message: string;
  remaining: number;
  timestamp: number;
}
