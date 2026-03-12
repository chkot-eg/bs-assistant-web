import { NgModule, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Mock eg-table-v2 (AG Grid-based) - placeholder until @eg-apps/common is installed.
 * The real component wraps AG Grid with EG styling.
 */
@Component({
  selector: 'eg-table-v2',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eg-table-v2-wrapper">
      <ng-content select="eg-table-v2-control-header"></ng-content>
      @if (!data || data.length === 0) {
        <div class="eg-table-v2-empty">
          <ng-content select="eg-table-v2-no-rows-template"></ng-content>
        </div>
      } @else {
        <table class="eg-table-v2">
          <thead>
            <tr>
              @for (col of columns; track col.field || $index) {
                <th [style.flex]="col.flex" (click)="col.sortable ? onSort(col) : null" [class.sortable]="col.sortable">
                  {{ col.headerName || col.field }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of data; track $index) {
              <tr class="eg-table-v2-row">
                @for (col of columns; track col.field || $index) {
                  <td>{{ col.field ? row[col.field] : '' }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      }
      <ng-content select="eg-table-v2-pagination"></ng-content>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-table-v2-wrapper { overflow-x: auto; }
    .eg-table-v2 { width: 100%; border-collapse: collapse; font-size: 13px; }
    .eg-table-v2 th { padding: 10px 12px; text-align: left; background: #f8f9fa; border-bottom: 2px solid #e0e0e0; font-weight: 600; color: #495057; }
    .eg-table-v2 th.sortable { cursor: pointer; }
    .eg-table-v2 td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    .eg-table-v2-row:hover { background: #f5f8ff; }
    .eg-table-v2-empty { padding: 40px; text-align: center; color: #6C757D; }
  `]
})
export class EgTableV2Component {
  @Input() columns: any[] = [];
  @Input() data: any[] = [];
  @Input() checkboxes = false;
  @Input() groupedRows = false;
  @Input() gridOptions: any = {};
  @Output() gridReady = new EventEmitter<any>();
  @Output() selectionChanged = new EventEmitter<any>();
  @Output() sortChanged = new EventEmitter<any>();

  onSort(col: any): void {
    this.sortChanged.emit({ column: col });
  }
}

@Component({ selector: 'eg-table-v2-control-header', standalone: true, template: '<div style="display:flex;gap:8px;padding:8px 0;justify-content:flex-end"><ng-content></ng-content></div>' })
export class EgTableV2ControlHeaderComponent {}

@Component({ selector: 'eg-table-v2-control-export', standalone: true, template: '<button style="border:1px solid #ddd;background:#fff;padding:4px 10px;border-radius:4px;font-size:12px;cursor:pointer">Export</button>' })
export class EgTableV2ControlExportComponent {}

@Component({ selector: 'eg-table-v2-control-visibility', standalone: true, template: '<button style="border:1px solid #ddd;background:#fff;padding:4px 10px;border-radius:4px;font-size:12px;cursor:pointer">Columns</button>' })
export class EgTableV2ControlVisibilityComponent {}

@Component({ selector: 'eg-table-v2-no-rows-template', standalone: true, template: '<ng-content></ng-content>' })
export class EgTableV2NoRowsTemplateComponent {}

@Component({
  selector: 'eg-table-v2-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;gap:8px;padding:12px;justify-content:flex-end;font-size:13px">
      <span>Page {{ currentPage + 1 }}</span>
      <button (click)="prev()" [disabled]="currentPage === 0" style="border:1px solid #ddd;background:#fff;padding:4px 10px;border-radius:4px;cursor:pointer">‹</button>
      <button (click)="next()" style="border:1px solid #ddd;background:#fff;padding:4px 10px;border-radius:4px;cursor:pointer">›</button>
    </div>
  `
})
export class EgTableV2PaginationComponent {
  @Input() pageSize = 50;
  @Output() pageChanged = new EventEmitter<any>();
  currentPage = 0;
  prev(): void { if (this.currentPage > 0) { this.currentPage--; this.pageChanged.emit({ pageIndex: this.currentPage }); } }
  next(): void { this.currentPage++; this.pageChanged.emit({ pageIndex: this.currentPage }); }
}

@NgModule({
  imports: [EgTableV2Component, EgTableV2ControlHeaderComponent, EgTableV2ControlExportComponent, EgTableV2ControlVisibilityComponent, EgTableV2NoRowsTemplateComponent, EgTableV2PaginationComponent],
  exports: [EgTableV2Component, EgTableV2ControlHeaderComponent, EgTableV2ControlExportComponent, EgTableV2ControlVisibilityComponent, EgTableV2NoRowsTemplateComponent, EgTableV2PaginationComponent]
})
export class EgTableV2Module {}
