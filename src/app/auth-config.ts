import { AuthConfig } from 'angular-oauth2-oidc';

export const SSO_ENABLED = true;

export const TENANT_ID = 'd9eb6768-048d-47f9-872c-10b0f791a697';
export const CLIENT_ID  = '1a4c16a9-017b-4ef3-8985-325856a539d3';

// Custom EgFabri scope — required to call the EG user-mapping service
export const SCOPE = 'openid api://1a4c16a9-017b-4ef3-8985-325856a539d3/EgFabri';

// Works in both dev (localhost:4200) and production automatically
export const REDIRECT_URI = window.location.origin + '/';

// EG tenant store identifier — sent as header to EG user-mapping API
export const TENANT_STORE = 'egutvk01-adbegf0000';

export const msalAuthConfig: AuthConfig = {
  issuer:    `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
  redirectUri: REDIRECT_URI,
  clientId:  CLIENT_ID,
  responseType: 'code',   // Authorization Code + PKCE (no client secret needed)
  scope:     SCOPE,

  // Must be false for Azure AD — their discovery document uses a different
  // issuer format than strict OIDC requires.
  strictDiscoveryDocumentValidation: false,

  showDebugInformation: false,
  clearHashAfterLogin:  true,

  tokenEndpoint:    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
  userinfoEndpoint: `https://graph.microsoft.com/oidc/userinfo`,
  logoutUrl:        `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/logout`,
};
