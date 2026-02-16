import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TableMappingService } from '../../services/table-mapping.service';
import { TableMapping, TableMappingRequest } from '../../models/table-mapping.model';

@Component({
  selector: 'app-table-mapping-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatSlideToggleModule, MatPaginatorModule, MatProgressSpinnerModule
  ],
  templateUrl: './table-mapping-manager.component.html',
  styleUrls: ['./table-mapping-manager.component.scss']
})
export class TableMappingManagerComponent implements OnInit {
  mappings: TableMapping[] = [];
  availableCategories: string[] = [];
  availableProductCodes: string[] = [];
  countsByCategory: Record<string, number> = {};
  isLoading = false;
  isReindexing = false;
  isSearching = false;

  selectedCategory = '';
  selectedProductCode = '';
  searchQuery = '';
  searchResults: TableMapping[] = [];

  showForm = false;
  editingMapping: TableMapping | null = null;
  formData: TableMappingRequest = {
    tableName: '',
    category: '',
    description: '',
    keywords: '',
    relatedTables: '',
    productCode: '',
    priority: 1,
    isActive: true
  };

  tableColumns = ['tableName', 'category', 'productCode', 'description', 'priority', 'isActive', 'actions'];
  categoryEntries: [string, number][] = [];

  constructor(private tableMappingService: TableMappingService) {}

  ngOnInit(): void {
    this.loadMappings();
  }

  loadMappings(): void {
    this.isLoading = true;
    const category = this.selectedCategory || undefined;
    const productCode = this.selectedProductCode || undefined;

    this.tableMappingService.list(category, productCode).subscribe({
      next: (response) => {
        this.mappings = response.mappings || [];
        this.availableCategories = response.availableCategories || [];
        this.availableProductCodes = response.availableProductCodes || [];
        this.countsByCategory = response.countsByCategory || {};
        this.categoryEntries = Object.entries(this.countsByCategory);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.loadMappings();
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.selectedProductCode = '';
    this.loadMappings();
  }

  searchMappings(): void {
    if (!this.searchQuery.trim()) return;
    this.isSearching = true;
    this.tableMappingService.search({ query: this.searchQuery.trim() }).subscribe({
      next: (response) => {
        this.searchResults = response.mappings || [];
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

  reindex(): void {
    if (!confirm('Reindex all table mappings? This may take a moment.')) return;
    this.isReindexing = true;
    this.tableMappingService.reindex().subscribe({
      next: () => {
        this.isReindexing = false;
        this.loadMappings();
      },
      error: () => {
        this.isReindexing = false;
      }
    });
  }

  openAddForm(): void {
    this.editingMapping = null;
    this.formData = {
      tableName: '',
      category: '',
      description: '',
      keywords: '',
      relatedTables: '',
      productCode: '',
      priority: 1,
      isActive: true
    };
    this.showForm = true;
  }

  openEditForm(mapping: TableMapping): void {
    this.editingMapping = mapping;
    this.formData = {
      tableName: mapping.tableName,
      category: mapping.category,
      description: mapping.description || '',
      keywords: mapping.keywords || '',
      relatedTables: mapping.relatedTables || '',
      productCode: mapping.productCode || '',
      priority: mapping.priority || 1,
      isActive: mapping.isActive !== false
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingMapping = null;
  }

  saveMapping(): void {
    if (!this.formData.tableName || !this.formData.category) return;

    if (this.editingMapping) {
      this.tableMappingService.update(this.editingMapping.id, this.formData).subscribe({
        next: () => {
          this.closeForm();
          this.loadMappings();
        }
      });
    } else {
      this.tableMappingService.create(this.formData).subscribe({
        next: () => {
          this.closeForm();
          this.loadMappings();
        }
      });
    }
  }

  deleteMapping(mapping: TableMapping): void {
    if (!confirm(`Delete mapping for "${mapping.tableName}"?`)) return;
    this.tableMappingService.delete(mapping.id).subscribe({
      next: () => {
        this.mappings = this.mappings.filter(m => m.id !== mapping.id);
      }
    });
  }
}
