import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { msalAuthConfig, SSO_ENABLED } from '../auth-config';
import { UserMappingService } from './user-mapping.service';

/**
 * AuthService — Microsoft Azure AD SSO via angular-oauth2-oidc (PKCE code flow).
 *
 * Flow:
 *  1. APP_INITIALIZER calls initialize() before Angular renders anything
 *  2. If no token → redirect to Microsoft login (app stays on loading screen)
 *  3. After Microsoft login → redirect back to app with auth code
 *  4. angular-oauth2-oidc exchanges code for tokens automatically
 *  5. UserMappingService fetches the ERP user info (IBM i library)
 *  6. Angular renders the chat UI
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(
    private oauthService: OAuthService,
    private router: Router,
    private userMappingService: UserMappingService
  ) {}

  /**
   * Run by APP_INITIALIZER before Angular renders anything.
   * Configures OIDC, handles returning auth-code redirect, and
   * fetches the ERP user mapping.  Blocks rendering until resolved.
   */
  async initialize(): Promise<void> {
    if (!SSO_ENABLED) return;

    this.oauthService.configure(msalAuthConfig);
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();

    if (this.oauthService.hasValidAccessToken()) {
      // Authenticated — fetch ERP library mapping before rendering
      const userId = this.getUserId();
      const token  = this.getAccessToken();
      await this.userMappingService.fetchMapping(userId, token);
      // Don't navigate here — the router will pick up the current URL
    } else {
      // Not authenticated — redirect to Microsoft login.
      // Block rendering until the redirect fires so the app never flashes.
      this.oauthService.initCodeFlow();
      await new Promise<never>(() => {});
    }
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    if (SSO_ENABLED) {
      this.oauthService.logOut();
    } else {
      this.router.navigate(['/']);
    }
  }

  isLoggedIn(): boolean {
    if (!SSO_ENABLED) return true;
    return this.oauthService.hasValidAccessToken();
  }

  getAccessToken(): string {
    return SSO_ENABLED ? this.oauthService.getAccessToken() : '';
  }

  getUserName(): string {
    if (!SSO_ENABLED) return 'Dev User';
    const claims = this.oauthService.getIdentityClaims() as any;
    return claims?.['name'] ?? claims?.['preferred_username'] ?? '';
  }

  getUserEmail(): string {
    if (!SSO_ENABLED) return 'dev@example.com';
    const claims = this.oauthService.getIdentityClaims() as any;
    return claims?.['preferred_username'] ?? claims?.['email'] ?? '';
  }

  getUserId(): string {
    if (!SSO_ENABLED) return 'dev-user-id';
    const claims = this.oauthService.getIdentityClaims() as any;
    return claims?.['sub'] ?? '';
  }

  getTokenExpiry(): Date | null {
    if (!SSO_ENABLED) return null;
    const expMs = this.oauthService.getAccessTokenExpiration();
    return expMs ? new Date(expMs) : null;
  }
}
