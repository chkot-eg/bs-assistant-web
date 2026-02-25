import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TableService } from '../../services/table.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-table-browser',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule,
    MatPaginatorModule, MatSortModule, MatProgressSpinnerModule
  ],
  templateUrl: './table-browser.component.html',
  styleUrls: ['./table-browser.component.scss']
})
export class TableBrowserComponent implements OnInit {
  searchQuery = '';
  selectedLibrary = environment.defaultLibrary;
  isLoading = false;
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<any>([]);
  totalRows = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private tableService: TableService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.isLoading = true;
    const obs = this.searchQuery.trim()
      ? this.tableService.searchTables(this.searchQuery.trim(), this.selectedLibrary)
      : this.tableService.getAllTables(this.selectedLibrary);

    obs.subscribe({
      next: (response) => {
        let data: any[] = [];
        let rowCount = response.rowCount ?? 0;

        if (Array.isArray(response.data)) {
          // Direct array format
          data = response.data;
          rowCount = rowCount || data.length;
        } else if (response.data?.content && Array.isArray(response.data.content)) {
          // MCP tool response format: { content: [{ type: "text", text: "..." }] }
          const text = response.data.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('');
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed.tables)) {
              data = parsed.tables.map((name: string) => ({ TABLE_NAME: name }));
              rowCount = parsed.count ?? data.length;
            } else if (Array.isArray(parsed.data)) {
              data = parsed.data;
              rowCount = parsed.count ?? parsed.rowCount ?? data.length;
            } else if (Array.isArray(parsed)) {
              data = parsed;
              rowCount = data.length;
            }
          } catch {
            // Not valid JSON - ignore
          }
        }

        this.displayedColumns = response.columns || (data.length > 0 ? Object.keys(data[0]) : []);
        this.dataSource.data = data;
        this.totalRows = rowCount;
        this.isLoading = false;

        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
          if (this.sort) this.dataSource.sort = this.sort;
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.loadTables();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadTables();
  }

  viewSchema(row: any): void {
    const tableName = row['TABLE_NAME'] || row['table_name'] || row['SYSTEM_TABLE_NAME'] || Object.values(row)[0];
    if (tableName) {
      this.router.navigate(['/security/tables', tableName, 'schema']);
    }
  }

  getCellValue(row: any, col: string): string {
    const val = row[col];
    if (val === null || val === undefined) return '';
    return String(val);
  }
}
