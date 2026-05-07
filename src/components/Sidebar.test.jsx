import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from './Sidebar.jsx'

vi.mock('../lib/auth.js', () => ({
  AUTH_ENABLED: false,
  signOut: vi.fn(),
}))

const defaults = {
  page: 'welcome',
  setPage: vi.fn(),
  sidebarOpen: false,
  account: null,
  onSignOut: vi.fn(),
  history: [],
  activeSessionId: null,
  onNewSession: vi.fn(),
  onLoadHistory: vi.fn(),
  onDeleteHistory: vi.fn(),
}

function renderSidebar(props = {}) {
  return render(<Sidebar {...defaults} {...props} />)
}

describe('Sidebar', () => {
  it('renders the app name', () => {
    renderSidebar()
    expect(screen.getByText('Kickstart')).toBeInTheDocument()
  })

  it('clicking the logo calls setPage("welcome")', () => {
    const setPage = vi.fn()
    renderSidebar({ setPage })
    fireEvent.click(screen.getByText('Kickstart'))
    expect(setPage).toHaveBeenCalledWith('welcome')
  })

  it('displays the version number', () => {
    renderSidebar()
    expect(screen.getByText(/^v\d+\.\d+\.\d+/)).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    renderSidebar()
    expect(screen.getByText('Custom instructions')).toBeInTheDocument()
    expect(screen.getByText('How to use')).toBeInTheDocument()
    expect(screen.getByText('API & settings')).toBeInTheDocument()
  })

  it('highlights the active nav item', () => {
    renderSidebar({ page: 'settings' })
    const btn = screen.getByText('API & settings').closest('button')
    expect(btn).toHaveStyle({ fontWeight: '500' })
  })

  it('shows history entries', () => {
    const history = [
      { id: '1', pname: 'Alpha Project', cname: 'ACME', timestamp: new Date().toISOString() },
      { id: '2', pname: 'Beta Project', cname: 'Globex', timestamp: new Date().toISOString() },
    ]
    renderSidebar({ history })
    expect(screen.getByText('Alpha Project')).toBeInTheDocument()
    expect(screen.getByText('Beta Project')).toBeInTheDocument()
  })

  it('calls onLoadHistory when a history entry is clicked', () => {
    const onLoadHistory = vi.fn()
    const entry = { id: '1', pname: 'My Project', cname: '', timestamp: new Date().toISOString() }
    renderSidebar({ history: [entry], onLoadHistory })
    fireEvent.click(screen.getByText('My Project'))
    expect(onLoadHistory).toHaveBeenCalledWith(entry)
  })

  it('calls onNewSession when "New document generation" is clicked', () => {
    const onNewSession = vi.fn()
    renderSidebar({ onNewSession })
    fireEvent.click(screen.getByText('New document generation'))
    expect(onNewSession).toHaveBeenCalledOnce()
  })
})
