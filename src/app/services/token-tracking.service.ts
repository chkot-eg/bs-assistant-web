import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatService } from './chat.service';
import { Message } from '../models/message.model';
import { TokenEstimate, SessionTokenSummary } from '../models/token-usage.model';
import { TOKEN_PRICING } from '../constants/token-pricing.constants';

@Injectable({ providedIn: 'root' })
export class TokenTrackingService {
  private tokenEstimatesMap = new Map<string, TokenEstimate>();

  private sessionSummarySubject = new BehaviorSubject<SessionTokenSummary>(this.emptySessionSummary());
  public sessionSummary$ = this.sessionSummarySubject.asObservable();

  constructor(private chatService: ChatService) {
    this.chatService.messages$.subscribe(messages => this.recalculate(messages));
  }

  getEstimateForMessage(messageId: string): TokenEstimate | null {
    return this.tokenEstimatesMap.get(messageId) ?? null;
  }

  private recalculate(messages: Message[]): void {
    if (!messages || messages.length === 0) {
      this.tokenEstimatesMap.clear();
      this.sessionSummarySubject.next(this.emptySessionSummary());
      return;
    }

    let totalInput = 0;
    let totalOutput = 0;
    let queryCount = 0;
    let lastUserTokens = 0;

    for (const msg of messages) {
      if (msg.isError || !msg.content || msg.content.trim() === '') continue;
      if (this.tokenEstimatesMap.has(msg.id)) {
        const existing = this.tokenEstimatesMap.get(msg.id)!;
        if (msg.role === 'user') {
          lastUserTokens = existing.inputTokens;
          totalInput += existing.inputTokens;
        } else if (msg.role === 'assistant') {
          totalOutput += existing.outputTokens;
          queryCount++;
        }
        continue;
      }

      if (msg.role === 'user') {
        lastUserTokens = this.estimateTokens(msg.content);
        totalInput += lastUserTokens;
      } else if (msg.role === 'assistant') {
        const outputTokens = this.estimateTokens(msg.content);
        const inputTokens = lastUserTokens;
        const total = inputTokens + outputTokens;

        this.tokenEstimatesMap.set(msg.id, {
          inputTokens,
          outputTokens,
          totalTokens: total,
          estimatedCost: this.calculateCost(total),
          isEstimated: true,
        });

        totalOutput += outputTokens;
        queryCount++;
        lastUserTokens = 0;
      }
    }

    const totalTokens = totalInput + totalOutput;
    this.sessionSummarySubject.next({
      totalTokens,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalCost: this.calculateCost(totalTokens),
      queryCount,
      avgTokensPerQuery: queryCount > 0 ? Math.round(totalTokens / queryCount) : 0,
      modelName: TOKEN_PRICING.MODEL_NAME,
      isEstimated: true,
    });
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / TOKEN_PRICING.CHARS_PER_TOKEN);
  }

  private calculateCost(tokens: number): number {
    return (tokens / 1_000_000) * TOKEN_PRICING.COST_PER_MILLION_TOKENS;
  }

  private emptySessionSummary(): SessionTokenSummary {
    return {
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      queryCount: 0,
      avgTokensPerQuery: 0,
      modelName: TOKEN_PRICING.MODEL_NAME,
      isEstimated: true,
    };
  }
}
