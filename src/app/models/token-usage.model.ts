export interface TokenEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  isEstimated: boolean;
}

export interface SessionTokenSummary {
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  queryCount: number;
  avgTokensPerQuery: number;
  modelName: string;
  isEstimated: boolean;
}
