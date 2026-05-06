import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import GeneratePage from './pages/GeneratePage.jsx'
import GuidePage from './pages/GuidePage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

const PAGE_META = {
  generate: { title: 'Generate documents', desc: 'Fill in context, upload a brand theme, select artefacts — download real .docx and .xlsx files' },
  guide:    { title: 'How to use', desc: 'Guidance on Confluence setup, Jira decomposition, and maintainer tips' },
  settings: { title: 'API & settings', desc: 'API key, model preferences, and Statement of Work' },
}

export default function App() {
  const [page, setPage] = useState('generate')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sr_api_key') || '')
  const [model, setModel] = useState('claude-sonnet-4-20250514')
  const [maxTokens, setMaxTokens] = useState(4000)
  const [sowText, setSowText] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const meta = PAGE_META[page] || PAGE_META.generate

  const handlePageChange = (newPage) => {
    setPage(newPage)
    setSidebarOpen(false) // Close sidebar on mobile after navigation
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar - Hidden on mobile by default */}
      <div style={{
        display: sidebarOpen ? 'block' : 'none',
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 999,
      }} onClick={() => setSidebarOpen(false)} />

      <div style={{
        display: 'flex',
        '@media (min-width: 769px)': { display: 'flex' }
      }}>
        <Sidebar page={page} setPage={handlePageChange} sidebarOpen={sidebarOpen} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, gap: 12 }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: 'none',
              '@media (max-width: 768px)': { display: 'flex' },
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              color: 'var(--text)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="mobile-menu-btn"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.title}</div>
            <div className="description-text" style={{ fontSize: 12, color: 'var(--t3)', marginTop: 1 }}>{meta.desc}</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 'clamp(16px, 5vw, 28px)', overflowY: 'auto', flex: 1, width: '100%' }}>
          <div style={{ maxWidth: 'min(1020px, 100%)', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
            {page === 'generate' && <GeneratePage apiKey={apiKey} model={model} maxTokens={maxTokens} sowText={sowText} setSowText={setSowText} />}
            {page === 'guide' && <GuidePage />}
            {page === 'settings' && <SettingsPage apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} maxTokens={maxTokens} setMaxTokens={setMaxTokens} sowText={sowText} setSowText={setSowText} />}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          nav { position: fixed; left: 0; top: 0; height: 100vh; z-index: 1000; transform: translateX(-100%); transition: transform 0.3s ease; }
          nav[data-open="true"] { transform: translateX(0); }
        }

        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
          nav { position: sticky !important; transform: none !important; width: 232px !important; min-width: 232px !important; }
        }
      `}</style>
    </div>
  )
}
