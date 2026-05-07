import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { signIn } from '../lib/auth.js'
import LoginScreen from './LoginScreen.jsx'

vi.mock('../lib/auth.js', () => ({
  signIn: vi.fn(),
  AUTH_ENABLED: true,
}))

beforeEach(() => vi.mocked(signIn).mockReset())

describe('LoginScreen', () => {
  it('renders the sign-in button', () => {
    render(<LoginScreen onSignIn={vi.fn()} />)
    expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument()
  })

  it('shows an auth error when one is passed as a prop', () => {
    render(<LoginScreen onSignIn={vi.fn()} authError="Session expired" />)
    expect(screen.getByText('Session expired')).toBeInTheDocument()
  })

  it('calls signIn when the button is clicked', () => {
    vi.mocked(signIn).mockResolvedValue(undefined)
    render(<LoginScreen onSignIn={vi.fn()} />)
    fireEvent.click(screen.getByText('Sign in with Microsoft'))
    expect(signIn).toHaveBeenCalledOnce()
  })

  it('shows a loading label immediately after click', () => {
    // setLoading(true) is called synchronously before the await in handleSignIn,
    // so the button text updates within the same React flush as the click
    vi.mocked(signIn).mockResolvedValue(undefined)
    render(<LoginScreen onSignIn={vi.fn()} />)
    const btn = screen.getByText('Sign in with Microsoft').closest('button')
    fireEvent.click(btn)
    expect(screen.getByText('Signing in…')).toBeInTheDocument()
  })

  it('disables the button while signing in', () => {
    vi.mocked(signIn).mockResolvedValue(undefined)
    render(<LoginScreen onSignIn={vi.fn()} />)
    const btn = screen.getByText('Sign in with Microsoft').closest('button')
    fireEvent.click(btn)
    expect(btn).toBeDisabled()
  })
})
