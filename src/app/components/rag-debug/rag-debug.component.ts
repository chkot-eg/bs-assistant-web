import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RagDebugService, RagDebugResponse, TableMappingResult } from '../../services/rag-debug.service';

@Component({
  selector: 'app-rag-debug',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTableModule, MatFormFieldModule, MatInputModule,
    MatSelectModule
  ],
  templateUrl: './rag-debug.component.html',
  styleUrls: ['./rag-debug.component.scss']
})
export class RagDebugComponent {
  query = '';
  topK = 5;
  topKOptions = [3, 5, 10];
  result: RagDebugResponse | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  tableMappingColumns = ['tableName', 'category', 'description', 'keywords', 'relatedTables', 'priority'];

  constructor(private ragDebugService: RagDebugService) {}

  executeLookup(): void {
    const trimmed = this.query.trim();
    if (!trimmed) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.result = null;

    this.ragDebugService.lookup(trimmed, this.topK).subscribe({
      next: (response) => {
        this.result = response;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || err?.message || 'RAG lookup failed';
        this.isLoading = false;
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.executeLookup();
    }
  }

  formatScore(score: number): string {
    if (score == null) return '-';
    return `${(score * 100).toFixed(0)}%`;
  }

  getScoreClass(score: number): string {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  truncate(text: string | null, maxLength: number): string {
    if (!text) return '-';
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
  }

  trackByTableName(_index: number, item: TableMappingResult): string {
    return item.tableName;
  }
}
