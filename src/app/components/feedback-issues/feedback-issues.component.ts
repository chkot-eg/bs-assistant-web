import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FeedbackService } from '../../services/feedback.service';
import { FeedbackIssue } from '../../models/feedback-issue.model';

@Component({
  selector: 'app-feedback-issues',
  standalone: true,
  imports: [
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './feedback-issues.component.html',
  styleUrls: ['./feedback-issues.component.scss']
})
export class FeedbackIssuesComponent implements OnInit {
  issues: FeedbackIssue[] = [];
  isLoading = false;
  currentFilter: 'all' | 'open' | 'resolved' = 'all';
  expandedId: number | null = null;

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.expandedId = null;
    const resolved = this.currentFilter === 'all'
      ? undefined
      : this.currentFilter === 'resolved';
    this.feedbackService.getAllFeedback(resolved).subscribe({
      next: (items) => { this.issues = items; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  setFilter(filter: 'all' | 'open' | 'resolved'): void {
    if (this.currentFilter === filter) return;
    this.currentFilter = filter;
    this.load();
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  isExpanded(id: number): boolean {
    return this.expandedId === id;
  }

  preview(text: string): string {
    return text.length > 100 ? text.slice(0, 100) + '…' : text;
  }

  toggleResolved(issue: FeedbackIssue, event: MouseEvent): void {
    event.stopPropagation();
    this.feedbackService.setResolved(issue.id, !issue.resolved).subscribe({
      next: (updated) => {
        const idx = this.issues.findIndex(i => i.id === updated.id);
        if (idx !== -1) this.issues[idx] = updated;
      }
    });
  }

  delete(id: number, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm('Delete this feedback issue?')) return;
    if (this.expandedId === id) this.expandedId = null;
    this.issues = this.issues.filter(i => i.id !== id);
    this.feedbackService.deleteFeedback(id).subscribe();
  }

  get openCount(): number { return this.issues.filter(i => !i.resolved).length; }
  get resolvedCount(): number { return this.issues.filter(i => i.resolved).length; }
}
