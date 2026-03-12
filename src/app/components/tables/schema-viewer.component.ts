import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SchemaService } from '../../services/schema.service';

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
  EgTableModule,
  EgChipModule,
} from '../../shared/eg-mock';

@Component({
  selector: 'app-schema-viewer',
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
    EgTableModule,
    EgChipModule,
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

  schemaColumns: { id: string; label: string; sortable?: boolean; width?: string }[] = [];

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
          data = response.data;
        } else if (response.success && response.data?.content && Array.isArray(response.data.content)) {
          const text = response.data.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('');
          try {
            const parsed = JSON.parse(text);
            if (parsed.schemas && typeof parsed.schemas === 'object') {
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

          this.schemaColumns = [
            ...this.displayedColumns.map((col: string) => ({
              id: col,
              label: col,
              sortable: true,
            })),
            { id: '_indicators', label: 'Flags', sortable: false },
          ];
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
