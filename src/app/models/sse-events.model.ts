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
  type: 'iteration_info' | 'success_indicator' | 'warning';
  message: string;
  success?: boolean;
  timestamp: number;
}

export interface SseCompleteData {
  success: boolean;
  result: any;
  timestamp: number;
}

export interface SseErrorData {
  error: string;
  type?: string;
  timestamp: number;
}
