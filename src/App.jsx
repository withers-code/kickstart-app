import React, { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import GeneratePage from './pages/GeneratePage.jsx'
import GuidePage from './pages/GuidePage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import InstructionsPage from './pages/InstructionsPage.jsx'
import WelcomePage from './pages/WelcomePage.jsx'
import LoginScreen from './components/LoginScreen.jsx'
import { AUTH_ENABLED, initAuth } from './lib/auth.js'

const PAGE_META = {
  welcome:      { title: 'Kickstart', desc: 'Project artefact generator' },
  generate:     { title: 'Generate documents', desc: 'Fill in context, upload a brand theme, select artefacts — download real .docx and .xlsx files' },
  instructions: { title: 'Custom instructions', desc: 'Override the default AI prompt for any artefact — saved to this browser' },
  guide:        { title: 'How to use', desc: 'Guidance on Confluence setup, Jira decomposition, and maintainer tips' },
  settings:     { title: 'API & settings', desc: 'API key, model preferences, and Statement of Work' },
}

// localStorage helper — namespaced by userId when auth is active
function lsGet(key, userId, fallback = '') {
  const k = userId ? `${userId}:${key}` : key
  const v = localStorage.getItem(k)
  return v !== null ? v : fallback
}
function lsSet(key, userId, value) {
  const k = userId ? `${userId}:${key}` : key
  localStorage.setItem(k, value)
}
function lsGetJSON(key, userId, fallback) {
  try { return JSON.parse(lsGet(key, userId, null) ?? 'null') ?? fallback } catch { return fallback }
}

export default function App() {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const [account, setAccount] = useState(null)
  const [authReady, setAuthReady] = useState(!AUTH_ENABLED)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    if (!AUTH_ENABLED) { setAuthReady(true); return }
    initAuth()
      .then(acct => { setAccount(acct); setAuthReady(true) })
      .catch(err => { setAuthError(err.message || 'Authentication failed'); setAuthReady(true) })
  }, [])

  const userId = AUTH_ENABLED ? (account?.localAccountId ?? null) : null

  // ── Per-user state ────────────────────────────────────────────────────────────
  const [stateLoaded, setStateLoaded] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('claude-sonnet-4-20250514')
  const [maxTokens, setMaxTokens] = useState(4000)
  const [sowText, setSowText] = useState('')
  const [customInstructions, setCustomInstructions] = useState({})
  const [artefactExamples, setArtefactExamples] = useState({})
  const [projectHistory, setProjectHistory] = useState([])

  // Load state once auth is resolved (or immediately when auth is disabled)
  useEffect(() => {
    if (!authReady) return
    if (AUTH_ENABLED && !userId) return // waiting for sign-in
    setApiKey(lsGet('sr_api_key', userId))
    setModel(lsGet('sr_model', userId) || 'claude-sonnet-4-20250514')
    setMaxTokens(parseInt(lsGet('sr_max_tokens', userId) || '4000'))
    setCustomInstructions(lsGetJSON('sr_artefact_instructions', userId, {}))
    setArtefactExamples(lsGetJSON('sr_artefact_examples', userId, {}))
    setProjectHistory(lsGetJSON('sr_project_history', userId, []))
    setStateLoaded(true)
  }, [authReady, userId])

  // Persist state changes (guard with stateLoaded to avoid clobbering on startup)
  useEffect(() => { if (stateLoaded) lsSet('sr_api_key', userId, apiKey) }, [apiKey, stateLoaded, userId])
  useEffect(() => { if (stateLoaded) lsSet('sr_model', userId, model) }, [model, stateLoaded, userId])
  useEffect(() => { if (stateLoaded) lsSet('sr_max_tokens', userId, String(maxTokens)) }, [maxTokens, stateLoaded, userId])
  useEffect(() => { if (stateLoaded) lsSet('sr_artefact_instructions', userId, JSON.stringify(customInstructions)) }, [customInstructions, stateLoaded, userId])
  useEffect(() => { if (stateLoaded) lsSet('sr_artefact_examples', userId, JSON.stringify(artefactExamples)) }, [artefactExamples, stateLoaded, userId])
  useEffect(() => { if (stateLoaded) lsSet('sr_project_history', userId, JSON.stringify(projectHistory)) }, [projectHistory, stateLoaded, userId])

  // ── Project history helpers ───────────────────────────────────────────────────
  function saveToHistory({ ctx, theme, selected, results }) {
    if (!activeSessionId) return
    setProjectHistory(prev => {
      const entry = {
        id: activeSessionId,
        pname: ctx.pname || 'Untitled',
        cname: ctx.cname || '',
        timestamp: new Date().toISOString(),
        ctx: { ...ctx },
        theme: { ...theme },
        artefactIds: [...selected],
        generatedIds: results.filter(r => r.status === 'done' || r.status === 'prompt').map(r => r.id),
      }
      const existingIdx = prev.findIndex(e => e.id === activeSessionId)
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx] = entry
        return updated
      }
      return [entry, ...prev.slice(0, 49)]
    })
  }

  function deleteFromHistory(id) {
    setProjectHistory(prev => prev.filter(e => e.id !== id))
    if (activeSessionId === id) {
      setActiveSessionId(null)
      setActiveHistoryEntry(null)
      setPage('welcome')
    }
  }

  function handleUpdateSession({ pname, cname }) {
    if (!activeSessionId) return
    setProjectHistory(prev => prev.map(e =>
      e.id === activeSessionId ? { ...e, pname, cname } : e
    ))
  }

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [page, setPage] = useState('welcome')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeHistoryEntry, setActiveHistoryEntry] = useState(null)
  const [activeSessionId, setActiveSessionId] = useState(null)
  const meta = PAGE_META[page] || PAGE_META.welcome

  const handlePageChange = (newPage) => {
    setPage(newPage)
    setSidebarOpen(false)
    if (newPage !== 'generate') {
      setActiveSessionId(null)
      setActiveHistoryEntry(null)
    }
  }

  function handleNewSession() {
    const id = String(Date.now())
    setProjectHistory(prev => [{ id, pname: '', cname: '', timestamp: new Date().toISOString() }, ...prev])
    setActiveSessionId(id)
    setActiveHistoryEntry(null)
    setPage('generate')
    setSidebarOpen(false)
  }

  function handleLoadHistory(entry) {
    setActiveSessionId(entry.id)
    setActiveHistoryEntry(entry.ctx ? entry : null)
    setPage('generate')
    setSidebarOpen(false)
  }

  // ── Render guards ─────────────────────────────────────────────────────────────
  if (AUTH_ENABLED && !authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <span style={{ width: 20, height: 20, border: '2px solid var(--border-mid)', borderTopColor: 'var(--text)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.65s linear infinite' }} />
      </div>
    )
  }

  if (AUTH_ENABLED && !account) {
    return <LoginScreen onSignIn={setAccount} authError={authError} />
  }

  // ── App shell ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile sidebar backdrop */}
      <div style={{
        display: sidebarOpen ? 'block' : 'none',
        position: 'fixed', left: 0, top: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.5)', zIndex: 999,
      }} onClick={() => setSidebarOpen(false)} />

      <div className="sidebar-wrapper">
        <Sidebar page={page} setPage={handlePageChange} sidebarOpen={sidebarOpen} account={account} onSignOut={() => setAccount(null)} history={projectHistory} activeSessionId={activeSessionId} onNewSession={handleNewSession} onLoadHistory={handleLoadHistory} onDeleteHistory={deleteFromHistory} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, gap: 12 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mobile-menu-btn"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--text)', alignItems: 'center', justifyContent: 'center' }}>
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
            {page === 'welcome' && <WelcomePage onNewSession={handleNewSession} />}
            {page === 'generate' && <GeneratePage apiKey={apiKey} model={model} maxTokens={maxTokens} sowText={sowText} setSowText={setSowText} customInstructions={customInstructions} artefactExamples={artefactExamples} activeHistoryEntry={activeHistoryEntry} activeSessionId={activeSessionId} onSaveHistory={saveToHistory} onUpdateSession={handleUpdateSession} />}
            {page === 'instructions' && <InstructionsPage instructions={customInstructions} setInstructions={setCustomInstructions} examples={artefactExamples} setExamples={setArtefactExamples} />}
            {page === 'guide' && <GuidePage />}
            {page === 'settings' && <SettingsPage apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} maxTokens={maxTokens} setMaxTokens={setMaxTokens} sowText={sowText} setSowText={setSowText} />}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          /* Collapse the sidebar wrapper so it takes no space in the flex row */
          .sidebar-wrapper { width: 0 !important; min-width: 0 !important; overflow: visible; flex-shrink: 0; }
          /* !important overrides the inline position:sticky so the nav truly leaves the flow */
          nav { position: fixed !important; left: 0; top: 0; height: 100vh; width: 232px !important; min-width: 232px !important; z-index: 1000; transform: translateX(-100%); transition: transform 0.3s ease; }
          nav[data-open="true"] { transform: translateX(0) !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
          nav { position: sticky !important; transform: none !important; width: 232px !important; min-width: 232px !important; }
          .gen-banner { left: 232px !important; }
        }
      `}</style>
    </div>
  )
}
