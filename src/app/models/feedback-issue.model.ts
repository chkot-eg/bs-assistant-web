export interface FeedbackIssue {
  id: number;
  query: string;
  response: string;
  comment?: string;
  resolved: boolean;
  createdAt: string;
}
