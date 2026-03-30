import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NobbArticle, NobbMedia, NobbSupplier } from '../../services/nobb.service';

export interface NobbArticleDialogData {
  article: NobbArticle;
  nobbNumber: string;
}

@Component({
  selector: 'app-nobb-article-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './nobb-article-dialog.component.html',
  styleUrls: ['./nobb-article-dialog.component.scss']
})
export class NobbArticleDialogComponent {
  imageLoaded = false;
  imageError = false;

  constructor(
    public dialogRef: MatDialogRef<NobbArticleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NobbArticleDialogData
  ) {}

  get article(): NobbArticle {
    return this.data.article;
  }

  get primaryImage(): NobbMedia | undefined {
    const suppliers = this.article.suppliers ?? [];
    for (const s of suppliers) {
      const found = (s.media ?? []).find(m => m.isPrimary && m.url);
      if (found) return found;
    }
    for (const s of suppliers) {
      const found = (s.media ?? []).find(m => m.url);
      if (found) return found;
    }
    return undefined;
  }

  get mainSupplier(): NobbSupplier | undefined {
    return this.article.suppliers?.find(s => s.isMainSupplier) ?? this.article.suppliers?.[0];
  }

  get itemType(): string {
    if (!this.article.type) return '';
    return this.article.type === 'Standard' ? 'Standard item' : this.article.type;
  }

  get lastModified(): string {
    return this.formatDate(this.article.status?.lastModifiedDate);
  }

  get createdDate(): string {
    return this.formatDate(this.article.firstTimeApproved ?? this.article.status?.createdDate);
  }

  get supplierExpiry(): string {
    const d = this.mainSupplier?.expiryDate;
    return d ? `Expired ${this.formatDate(d)}` : '';
  }

  private formatDate(raw?: string): string {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
