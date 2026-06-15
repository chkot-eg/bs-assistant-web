import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ErpUser, UserMappingResponse } from '../models/user-mapping.model';
import { TENANT_STORE } from '../auth-config';

/**
 * Fetches the ERP (IBM i) user mapping from EG's user-mapping service after login.
 *
 * The mapping links the Azure AD identity (object ID) to:
 *  - IBM i login name   (mappedUserName)
 *  - default library    (defaultTenantIdentifier  e.g. "ADBEGT")
 *  - all libraries      (availableTenantIdentifiers comma-separated)
 *
 * Called by AuthService.initialize() after a valid access token is obtained.
 */
@Injectable({ providedIn: 'root' })
export class UserMappingService {

  private readonly apiUrl = 'https://user-service.dev-nx.egapps.no/api/user-mappings';

  private _erpUser = new BehaviorSubject<ErpUser | null>(null);
  readonly erpUser$ = this._erpUser.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Called after login. Fetches the ERP mapping for the given Azure AD user ID
   * and makes the result available via erpUser$ / erpUser.
   * Token is passed in directly to avoid a circular dependency with AuthService.
   */
  async fetchMapping(userId: string, bearerToken: string): Promise<void> {
    try {
      const headers = new HttpHeaders({
        Authorization:  `Bearer ${bearerToken}`,
        'tenant-store': TENANT_STORE
      });

      const mapping = await firstValueFrom(
        this.http.get<UserMappingResponse>(`${this.apiUrl}/${userId}`, { headers })
      );

      if (mapping) {
        this._erpUser.next({
          erpUsername:        mapping.mappedUserName,
          displayName:        mapping.displayName,
          library:            mapping.defaultTenantIdentifier,
          availableLibraries: mapping.availableTenantIdentifiers
            ?.split(',')
            .map(l => l.trim())
            .filter(Boolean) ?? [],
          email: mapping.mappedUserName
        });
      } else {
        console.warn('[UserMappingService] No ERP mapping found for user:', userId);
        this._erpUser.next(null);
      }
    } catch (err) {
      console.warn('[UserMappingService] Fetch failed — proceeding without ERP info:', err);
      this._erpUser.next(null);
    }
  }

  get erpUser(): ErpUser | null      { return this._erpUser.value; }
  get erpUsername(): string           { return this._erpUser.value?.erpUsername ?? ''; }
  /** IBM i library for this user — passed to every IBM i query */
  get library(): string               { return this._erpUser.value?.library ?? ''; }
  get availableLibraries(): string[]  { return this._erpUser.value?.availableLibraries ?? []; }
  get displayName(): string           { return this._erpUser.value?.displayName ?? ''; }
}
