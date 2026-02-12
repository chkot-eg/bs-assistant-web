export interface TableMapping {
  id: string;
  tableName: string;
  category: string;
  description?: string;
  keywords?: string;
  relatedTables?: string;
  productCode?: string;
  priority?: number;
  isActive?: boolean;
  vectorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TableMappingRequest {
  tableName: string;
  category: string;
  description?: string;
  keywords?: string;
  relatedTables?: string;
  productCode?: string;
  priority?: number;
  isActive?: boolean;
}

export interface TableMappingListResponse {
  success: boolean;
  count: number;
  mappings: TableMapping[];
  availableCategories: string[];
  availableProductCodes: string[];
  countsByCategory: Record<string, number>;
  filterCategory?: string;
  filterProductCode?: string;
}

export interface TableMappingSearchRequest {
  query: string;
  topK?: number;
}

export interface TableMappingSearchResponse {
  success: boolean;
  count: number;
  mappings: TableMapping[];
  tableNames: string[];
  searchType: 'semantic' | 'keyword';
}
