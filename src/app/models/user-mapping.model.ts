/** Raw response from EG's user-mapping API */
export interface UserMappingResponse {
  id: string;
  displayName: string;                  // Full name (e.g. "Chirag Kottary")
  externalIdentifiers: string;
  defaultTenantIdentifier: string;      // IBM i default library (e.g. "ADBEGT")
  availableTenantIdentifiers: string;   // Comma-separated list of libraries user can access
  mappedUserName: string;               // IBM i / ERP login name (e.g. "BSAIEGT")
}

/** Parsed ERP user info used throughout the app */
export interface ErpUser {
  erpUsername: string;          // IBM i login name from mappedUserName
  displayName: string;          // Full name
  library: string;              // Default IBM i library (defaultTenantIdentifier)
  availableLibraries: string[]; // All libraries the user can switch to
  email: string;                // Azure AD email / preferred_username
}
