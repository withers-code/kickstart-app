import { AUTH_ENABLED, signOut } from './auth.js'

// vi.hoisted runs before vi.mock hoisting, so the ref is safe to use in the factory
const { mockClearCache } = vi.hoisted(() => ({ mockClearCache: vi.fn() }))

vi.mock('@azure/msal-browser', () => ({
  // Must be a constructor function, not a plain object factory
  PublicClientApplication: vi.fn(function () {
    this.initialize = vi.fn().mockResolvedValue(undefined)
    this.clearCache = mockClearCache
    this.handleRedirectPromise = vi.fn().mockResolvedValue(null)
    this.getAllAccounts = vi.fn().mockReturnValue([])
  }),
}))

beforeEach(() => mockClearCache.mockReset())

describe('AUTH_ENABLED', () => {
  it('is false when VITE_AZURE_CLIENT_ID is not set', () => {
    expect(AUTH_ENABLED).toBe(false)
  })
})

describe('signOut', () => {
  it('calls clearCache on the MSAL instance', async () => {
    mockClearCache.mockResolvedValue(undefined)
    await signOut()
    expect(mockClearCache).toHaveBeenCalledOnce()
  })
})
