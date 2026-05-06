import React, { useState } from 'react'
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
  const meta = PAGE_META[page] || PAGE_META.generate

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar page={page} setPage={setPage} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '13px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{meta.title}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 1 }}>{meta.desc}</div>
          </div>
        </div>
        <div style={{ padding: '24px 28px', maxWidth: 1020, overflowY: 'auto', flex: 1 }}>
          {page === 'generate' && <GeneratePage apiKey={apiKey} model={model} maxTokens={maxTokens} sowText={sowText} />}
          {page === 'guide' && <GuidePage />}
          {page === 'settings' && <SettingsPage apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} maxTokens={maxTokens} setMaxTokens={setMaxTokens} sowText={sowText} setSowText={setSowText} />}
        </div>
      </div>
    </div>
  )
}
