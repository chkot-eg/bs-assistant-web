export interface DocumentDto {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  category?: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  chunkCount?: number;
  errorMessage?: string;
  createdAt?: string;
  processedAt?: string;
}

export interface DocumentListResponse {
  success: boolean;
  count: number;
  documents: DocumentDto[];
}

export interface DocumentUploadResponse {
  success: boolean;
  documentId: string;
  fileName: string;
  fileSize: number;
  processingStatus: string;
  message: string;
}

export interface DocumentSearchRequest {
  query: string;
  topK?: number;
  category?: string;
}

export interface DocumentSearchResult {
  id: string;
  content: string;
  documentId?: string;
  fileName?: string;
  category?: string;
  chunkIndex?: number;
}

export interface DocumentSearchResponse {
  success: boolean;
  count: number;
  results: DocumentSearchResult[];
}

export interface DocumentStatsResponse {
  success: boolean;
  pending?: number;
  processing?: number;
  completed?: number;
  failed?: number;
  total: number;
  blobStorageAvailable: boolean;
  searchServiceAvailable: boolean;
  processingServiceAvailable: boolean;
}
