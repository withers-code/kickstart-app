import React, { useState } from 'react'
import { Lock, Cpu } from 'lucide-react'
import { Card, CardTitle, Field, Input, Select, Textarea, Btn } from '../components/ui.jsx'
import { FormGrid } from '../components/ui.jsx'

export default function SettingsPage({ apiKey, setApiKey, model, setModel, maxTokens, setMaxTokens, sowText, setSowText }) {
  const [draft, setDraft] = useState(apiKey)
  const [saved, setSaved] = useState(!!apiKey)

  function save() {
    if (!draft.trim()) return
    setApiKey(draft.trim())
    localStorage.setItem('sr_api_key', draft.trim())
    setSaved(true)
  }

  function clear() {
    setApiKey('')
    setDraft('')
    localStorage.removeItem('sr_api_key')
    setSaved(false)
  }

  return (
    <div>
      <Card>
        <CardTitle icon={Lock}>Anthropic API key</CardTitle>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 12, lineHeight: 1.6 }}>
          Your key is stored in your browser only and sent directly to Anthropic. Get one at{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple)' }}>console.anthropic.com</a>.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Field label="API key" full>
            <Input
              type="password"
              value={draft}
              onChange={e => { setDraft(e.target.value); setSaved(false) }}
              placeholder="sk-ant-..."
            />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn variant="primary" onClick={save}>Save key</Btn>
          <Btn variant="secondary" onClick={clear}>Clear</Btn>
          {saved && <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ Key saved in your browser</span>}
        </div>
      </Card>

      <Card>
        <CardTitle icon={Cpu}>Model settings</CardTitle>
        <FormGrid cols={2} style={{ marginBottom: 14 }}>
          <Field label="Model">
            <Select value={model} onChange={e => setModel(e.target.value)}>
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (recommended)</option>
              <option value="claude-opus-4-20250514">Claude Opus 4 (highest quality)</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (fastest)</option>
            </Select>
          </Field>
          <Field label="Max tokens per artefact">
            <Select value={String(maxTokens)} onChange={e => setMaxTokens(parseInt(e.target.value))}>
              <option value="2000">2,000 — concise</option>
              <option value="4000">4,000 — standard</option>
              <option value="6000">6,000 — detailed</option>
            </Select>
          </Field>
        </FormGrid>
        <Field label="Statement of Work (for Jira ticket creation)">
          <Textarea
            value={sowText}
            onChange={e => setSowText(e.target.value)}
            rows={8}
            placeholder="Paste your Statement of Work text here — Claude will decompose it into Epics, Stories and Tasks when you generate the Jira artefact..."
          />
        </Field>
      </Card>
    </div>
  )
}
