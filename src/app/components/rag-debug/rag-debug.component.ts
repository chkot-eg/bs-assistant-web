import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RagDebugService, RagDebugResponse } from '../../services/rag-debug.service';

// EG Components — replace '../../shared/eg-mock' with '@eg-apps/common' when registry is available
import {
  EgPageModule,
  EgHeaderModule,
  EgButtonModule,
  EgIconModule,
  EgProgressSpinnerModule,
  EgBoxModule,
  EgSectionModule,
  EgFormFieldModule,
  EgLabelModule,
  EgChipModule,
} from '../../shared/eg-mock';

@Component({
  selector: 'app-rag-debug',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EgPageModule,
    EgHeaderModule,
    EgButtonModule,
    EgIconModule,
    EgProgressSpinnerModule,
    EgBoxModule,
    EgSectionModule,
    EgFormFieldModule,
    EgLabelModule,
    EgChipModule,
  ],
  templateUrl: './rag-debug.component.html',
  styleUrls: ['./rag-debug.component.scss']
})
export class RagDebugComponent {
  queryControl = new FormControl('');
  topKControl = new FormControl(7);
  topKOptions = [
    { value: 3, label: '3' },
    { value: 5, label: '5' },
    { value: 7, label: '7' },
    { value: 10, label: '10' },
  ];
  result: RagDebugResponse | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private ragDebugService: RagDebugService) {}

  executeLookup(): void {
    const trimmed = (this.queryControl.value || '').trim();
    if (!trimmed) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.result = null;

    this.ragDebugService.lookup(trimmed, this.topKControl.value || 7).subscribe({
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
}
