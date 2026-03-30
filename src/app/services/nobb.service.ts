import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface NobbMedia {
  guid?: string;
  mediaType?: string;
  url?: string;
  isPrimary?: boolean;
}

export interface NobbSupplier {
  participantNumber?: string;
  name?: string;
  isMainSupplier?: boolean;
  supplierItemNumber?: string;
  expiryDate?: string;
  media?: NobbMedia[];
}

export interface NobbProperty {
  propertyName?: string;
  propertyDescription?: string;
  value?: string;
  unit?: string;
}

export interface NobbArticle {
  nobbNumber?: number;
  primaryText?: string;
  secondaryText?: string;
  description?: string;
  digitalChannelText?: string;
  productGroupName?: string;
  productGroupNumber?: string;
  manufacturerItemNumber?: string;
  type?: string;
  seriesName?: string;
  moduleNumber?: number;
  stocked?: boolean;
  firstTimeApproved?: string;
  suppliers?: NobbSupplier[];
  properties?: {
    marketing?: NobbProperty[];
    etim?: NobbProperty[];
    environment?: NobbProperty[];
    other?: NobbProperty[];
  };
  status?: {
    createdDate?: string;
    lastModifiedDate?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NobbService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getArticle(nobbNumber: string): Observable<NobbArticle> {
    return this.http.get<NobbArticle | NobbArticle[]>(`${this.apiUrl}/api/v1/nobb/${nobbNumber}`).pipe(
      map(response => Array.isArray(response) ? response[0] : response)
    );
  }
}
