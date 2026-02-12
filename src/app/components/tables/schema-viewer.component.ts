import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SchemaService } from '../../services/schema.service';

@Component({
  selector: 'app-schema-viewer',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule
  ],
  templateUrl: './schema-viewer.component.html',
  styleUrls: ['./schema-viewer.component.scss']
})
export class SchemaViewerComponent implements OnInit {
  tableName = '';
  columns: any[] = [];
  displayedColumns: string[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private schemaService: SchemaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tableName = params['tableName'] || '';
      if (this.tableName) {
        this.loadSchema();
      }
    });
  }

  loadSchema(): void {
    this.isLoading = true;
    this.error = null;
    this.schemaService.getSchema(this.tableName).subscribe({
      next: (response) => {
        let data: any[] | null = null;

        if (response.success && Array.isArray(response.data)) {
          // Direct array format
          data = response.data;
        } else if (response.success && response.data?.content && Array.isArray(response.data.content)) {
          // MCP tool response format: { content: [{ type: "text", text: "..." }] }
          const text = response.data.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('');
          try {
            const parsed = JSON.parse(text);
            if (parsed.schemas && typeof parsed.schemas === 'object') {
              // Format: { schemas: { TABLE_NAME: { columns: [...] } } }
              const schemaKey = this.tableName || Object.keys(parsed.schemas)[0];
              const schema = parsed.schemas[schemaKey] || Object.values(parsed.schemas)[0];
              if (schema && Array.isArray(schema.columns)) {
                data = schema.columns;
              }
            } else if (Array.isArray(parsed.columns)) {
              data = parsed.columns;
            } else if (Array.isArray(parsed.data)) {
              data = parsed.data;
            } else if (Array.isArray(parsed)) {
              data = parsed;
            }
          } catch {
            // Not valid JSON - ignore
          }
        }

        if (data && data.length > 0) {
          this.columns = data;
          this.displayedColumns = response.columns || Object.keys(this.columns[0]);
        } else {
          this.error = response.error || 'Failed to load schema';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load schema';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/security/tables']);
  }

  getCellValue(row: any, col: string): string {
    const val = row[col];
    if (val === null || val === undefined) return '';
    return String(val);
  }

  isPrimaryKey(row: any): boolean {
    return row['IS_PK'] === 'Y' || row['IS_PRIMARY_KEY'] === true || row['CONSTRAINT_TYPE'] === 'PRIMARY KEY';
  }

  isNullable(row: any): boolean {
    return row['IS_NULLABLE'] === 'Y' || row['NULLABLE'] === 'Y' || row['IS_NULLABLE'] === true;
  }
}
