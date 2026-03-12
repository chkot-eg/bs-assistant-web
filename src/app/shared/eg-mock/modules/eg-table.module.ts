import { NgModule, Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface EgTableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  width?: string;
  hidden?: boolean;
  sticky?: boolean;
  stickyEnd?: boolean;
}

@Component({
  selector: 'eg-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eg-table-wrapper">
      <ng-content select="eg-table-header"></ng-content>
      @if (loading) {
        <div class="eg-table-loading">Loading...</div>
      } @else if (!data || data.length === 0) {
        <div class="eg-table-empty">No data available</div>
      } @else {
        <table class="eg-table">
          <thead>
            <tr>
              @for (col of visibleColumns; track col.id) {
                <th [style.width]="col.width" (click)="col.sortable ? onSort(col) : null" [class.sortable]="col.sortable">
                  {{ col.label }}
                  @if (col.sortable) { <span class="sort-indicator">⇅</span> }
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of data; track rowIDFunction ? rowIDFunction(row) : $index) {
              <tr (click)="rowSelected.emit(row)" class="eg-table-row">
                @for (col of visibleColumns; track col.id) {
                  <td>{{ row[col.id] }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      }
      <ng-content select="eg-table-pagination"></ng-content>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-table-wrapper { overflow-x: auto; }
    .eg-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .eg-table th { padding: 10px 12px; text-align: left; background: #f8f9fa; border-bottom: 2px solid #e0e0e0; font-weight: 600; color: #495057; white-space: nowrap; }
    .eg-table th.sortable { cursor: pointer; }
    .eg-table th.sortable:hover { background: #e9ecef; }
    .sort-indicator { font-size: 11px; margin-left: 4px; color: #adb5bd; }
    .eg-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    .eg-table-row:hover { background: #f5f8ff; }
    .eg-table-loading, .eg-table-empty { padding: 40px; text-align: center; color: #6C757D; }
  `]
})
export class EgTableComponent {
  @Input() columns: EgTableColumn[] = [];
  @Input() data: any[] = [];
  @Input() checkboxes = false;
  @Input() loading = false;
  @Input() actions = false;
  @Input() fitContent = false;
  @Input() rowIDFunction?: (row: any) => any;
  @Input() rowClass?: (row: any) => string;
  @Output() rowSelected = new EventEmitter<any>();
  @Output() sorted = new EventEmitter<any>();

  get visibleColumns(): EgTableColumn[] {
    return this.columns.filter(c => !c.hidden);
  }

  onSort(col: EgTableColumn): void {
    this.sorted.emit({ active: col.id, direction: 'asc' });
  }
}

@Component({
  selector: 'eg-table-header',
  standalone: true,
  template: '<div style="padding:8px 0;display:flex;justify-content:flex-end;gap:8px"><ng-content></ng-content></div>'
})
export class EgTableHeaderComponent {}

@Component({
  selector: 'eg-table-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eg-pagination">
      <span class="eg-pagination-info">Page {{ currentPage + 1 }}</span>
      <button (click)="prevPage()" [disabled]="currentPage === 0">‹</button>
      <button (click)="nextPage()">›</button>
    </div>
  `,
  styles: [`
    .eg-pagination { display: flex; align-items: center; gap: 8px; padding: 12px; justify-content: flex-end; font-size: 13px; }
    .eg-pagination button { border: 1px solid #ddd; background: #fff; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
    .eg-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class EgTablePaginationComponent {
  @Input() pageSize = 20;
  @Input() totalItems = 0;
  @Output() pageChanged = new EventEmitter<{ pageIndex: number; pageSize: number }>();
  currentPage = 0;

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.pageChanged.emit({ pageIndex: this.currentPage, pageSize: this.pageSize });
    }
  }

  nextPage(): void {
    this.currentPage++;
    this.pageChanged.emit({ pageIndex: this.currentPage, pageSize: this.pageSize });
  }
}

@NgModule({
  imports: [EgTableComponent, EgTableHeaderComponent, EgTablePaginationComponent],
  exports: [EgTableComponent, EgTableHeaderComponent, EgTablePaginationComponent]
})
export class EgTableModule {}
