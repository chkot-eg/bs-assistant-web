export type SseEventType = 'init' | 'progress' | 'step' | 'context' | 'complete' | 'error';

export interface SseEvent {
  event: SseEventType;
  data: any;
}

export interface SseInitData {
  query: string;
  library: string;
  maxIterations: number;
  timestamp: number;
}

export interface SseProgressData {
  status: 'executing';
  message: string;
  timestamp: number;
}

export interface SseContextData {
  status: 'loaded';
  contextLength: number;
  sessionId: string;
  message: string;
  timestamp: number;
}

export interface SseStepData {
  type: 'iteration_info' | 'success_indicator' | 'warning' | 'execution_step';
  message: string;
  attemptNumber?: number;
  toolUsed?: string;
  sql?: string | null;
  success?: boolean;
  rowCount?: number | null;
  executionTimeMs?: number | null;
  reason?: string | null;
  errorMessage?: string | null;
  timestamp: number;
}

export interface SseCompleteData {
  success: boolean;
  result: any;
  timestamp: number;
}

export interface SseAgenticMetadata {
  formattedResponse?: string;
  goalAchieved?: boolean;
  iterationCount?: number;
  maxIterations?: number;
  agentStrategy?: string | null;
  finalSql?: string | null;
  executionSteps?: SseStepData[];
  adaptationFeedback?: string[];
  agentErrors?: string[];
  totalExecutionTimeMs?: number;
}

export interface SseErrorData {
  error: string;
  type?: string;
  timestamp: number;
}
