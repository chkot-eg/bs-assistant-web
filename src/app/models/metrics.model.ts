export interface AgenticMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  successRate: number;
  activeSessions: number;
  goalsAchieved: number;
  goalsFailed: number;
  avgExecutionTimeMs: number;
  maxExecutionTimeMs: number;
  avgIterations: number;
  maxIterations: number;
  source: 'mcp' | 'default';
  timestamp: number;
  status: string;
}

export interface ToolMetrics {
  tools: Record<string, ToolMetricEntry>;
  timestamp: number;
  status: string;
}

export interface ToolMetricEntry {
  avgExecutionTimeMs: number;
  maxExecutionTimeMs: number;
  totalCalls: number;
  successes: number;
  errors: number;
  successRate: number;
}

export interface HealthStatus {
  service: string;
  status: 'UP' | 'DOWN';
  timestamp: number;
  [key: string]: any;
}
