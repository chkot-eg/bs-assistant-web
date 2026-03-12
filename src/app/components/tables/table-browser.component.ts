import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { TableService } from '../../services/table.service';
import { environment } from '../../../environments/environment';

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
  EgTableV2Module,
  EgChipModule,
} from '../../shared/eg-mock';

@Component({
  selector: 'app-table-browser',
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
    EgTableV2Module,
    EgChipModule,
  ],
  templateUrl: './table-browser.component.html',
  styleUrls: ['./table-browser.component.scss']
})
export class TableBrowserComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  libraryControl = new FormControl(environment.defaultLibrary);

  libraryOptions = [
    { value: 'ADB800', label: 'ADB800' },
    { value: 'ADBEGT', label: 'ADBEGT' },
    { value: 'ADB900', label: 'ADB900' },
    { value: 'QSYS2', label: 'QSYS2' },
  ];

  isLoading = false;
  filteredTables: any[] = [];
  totalRows = 0;

  tableColumns: { field: string; headerName: string; sortable: boolean; flex: number }[] = [];

  private subs = new Subscription();

  constructor(
    private tableService: TableService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.libraryControl.valueChanges.subscribe(() => this.loadTables())
    );
    this.loadTables();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadTables(): void {
    this.isLoading = true;
    const query = (this.searchControl.value || '').trim();
    const library = this.libraryControl.value || environment.defaultLibrary;

    const obs = query
      ? this.tableService.searchTables(query, library)
      : this.tableService.getAllTables(library);

    obs.subscribe({
      next: (response) => {
        let data: any[] = [];
        let rowCount = response.rowCount ?? 0;

        if (Array.isArray(response.data)) {
          data = response.data;
          rowCount = rowCount || data.length;
        } else if (response.data?.content && Array.isArray(response.data.content)) {
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

        const displayedColumns = response.columns || (data.length > 0 ? Object.keys(data[0]) : []);

        this.tableColumns = [
          ...displayedColumns.map((col: string) => ({
            field: col,
            headerName: col,
            sortable: true,
            flex: 1,
          })),
          { field: '_actions', headerName: 'Actions', sortable: false, flex: 0 },
        ];

        this.filteredTables = data;
        this.totalRows = rowCount;
        this.isLoading = false;
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
    this.searchControl.setValue('');
    this.loadTables();
  }

  viewSchema(row: any): void {
    const tableName = row['TABLE_NAME'] || row['table_name'] || row['SYSTEM_TABLE_NAME'] || Object.values(row)[0];
    if (tableName) {
      this.router.navigate(['/security/tables', tableName, 'schema']);
    }
  }
}
