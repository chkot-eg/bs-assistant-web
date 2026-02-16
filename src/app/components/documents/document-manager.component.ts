import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { DocumentService } from '../../services/document.service';
import { DocumentDto, DocumentStatsResponse, DocumentSearchResult } from '../../models/document.model';

@Component({
  selector: 'app-document-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatTabsModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, MatProgressBarModule, MatProgressSpinnerModule, MatPaginatorModule
  ],
  templateUrl: './document-manager.component.html',
  styleUrls: ['./document-manager.component.scss']
})
export class DocumentManagerComponent implements OnInit {
  stats: DocumentStatsResponse | null = null;
  documents: DocumentDto[] = [];
  searchResults: DocumentSearchResult[] = [];
  isLoading = false;
  isUploading = false;
  isSearching = false;
  isProcessing = false;
  searchQuery = '';
  selectedTabIndex = 0;
  docColumns = ['fileName', 'contentType', 'fileSize', 'category', 'processingStatus', 'createdAt', 'actions'];

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadDocuments();
  }

  loadStats(): void {
    this.documentService.getStats().subscribe({
      next: (stats) => { this.stats = stats; },
      error: () => {}
    });
  }

  loadDocuments(status?: string): void {
    this.isLoading = true;
    this.documentService.list(undefined, status).subscribe({
      next: (response) => {
        this.documents = response.documents || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    const statusMap: Record<number, string | undefined> = {
      0: undefined,
      1: 'PENDING',
      2: 'COMPLETED',
      3: 'FAILED'
    };
    this.loadDocuments(statusMap[index]);
  }

  triggerUpload(): void {
    this.fileInput?.nativeElement?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploading = true;
    this.documentService.upload(file).subscribe({
      next: () => {
        this.isUploading = false;
        this.loadDocuments();
        this.loadStats();
        if (this.fileInput) this.fileInput.nativeElement.value = '';
      },
      error: () => {
        this.isUploading = false;
        if (this.fileInput) this.fileInput.nativeElement.value = '';
      }
    });
  }

  deleteDocument(doc: DocumentDto): void {
    if (!confirm(`Delete "${doc.fileName}"?`)) return;
    this.documentService.delete(doc.id).subscribe({
      next: () => {
        this.documents = this.documents.filter(d => d.id !== doc.id);
        this.loadStats();
      }
    });
  }

  processAllPending(): void {
    this.isProcessing = true;
    this.documentService.processAllPending().subscribe({
      next: () => {
        this.isProcessing = false;
        this.loadDocuments();
        this.loadStats();
      },
      error: () => {
        this.isProcessing = false;
      }
    });
  }

  searchDocuments(): void {
    if (!this.searchQuery.trim()) return;
    this.isSearching = true;
    this.documentService.search({ query: this.searchQuery.trim() }).subscribe({
      next: (response) => {
        this.searchResults = response.results || [];
        this.isSearching = false;
      },
      error: () => {
        this.isSearching = false;
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'PROCESSING': return 'info';
      case 'FAILED': return 'error';
      default: return '';
    }
  }
}
