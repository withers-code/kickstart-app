import { PublicClientApplication } from '@azure/msal-browser'

// Auth is enabled only when VITE_AZURE_CLIENT_ID is set in environment variables.
// Add it as a Vercel environment variable to activate authentication.
// Also set VITE_AZURE_TENANT_ID to restrict to your organisation's tenant (recommended),
// or leave unset to allow any Microsoft account.
//
// Azure App Registration redirect URIs to register:
//   https://<your-vercel-url>
//   http://localhost:5173   (for local development)
export const AUTH_ENABLED = !!import.meta.env.VITE_AZURE_CLIENT_ID

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'placeholder',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '/',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '/',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
}

const loginRequest = { scopes: ['User.Read', 'openid', 'profile', 'email'] }

let _msal = null

async function getMsal() {
  if (!_msal) {
    _msal = new PublicClientApplication(msalConfig)
    await _msal.initialize()
  }
  return _msal
}

// Call on app startup — handles redirect response and returns account, or null
export async function initAuth() {
  if (!AUTH_ENABLED) return null
  const msal = await getMsal()
  const result = await msal.handleRedirectPromise() // let errors bubble up
  if (result?.account) return result.account
  const accounts = msal.getAllAccounts()
  return accounts[0] ?? null
}

// Trigger Microsoft login via redirect (more reliable than popup)
export async function signIn() {
  const msal = await getMsal()
  await msal.loginRedirect(loginRequest)
  // Page will redirect — execution stops here
}

// Clear MSAL's local token cache without triggering a server-side redirect.
// logoutRedirect sends the user through Microsoft's logout endpoint, which
// then follows the "Front-channel logout URL" set in the Azure App Registration
// (often a ServiceNow or other enterprise URL we don't control).
// Clearing the cache locally is enough to destroy the session in this app.
export async function signOut() {
  const msal = await getMsal()
  await msal.clearCache()
}
