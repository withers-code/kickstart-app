import React from 'react'
import { Check, X, Download, Copy, Zap } from 'lucide-react'
import { Spinner, Btn, Alert } from './ui.jsx'

function saveBlob(data, filename, mime) {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ResultCard({ result }) {
  const { id, name, status, type, data, error, previewText } = result
  const projectSlug = (result.projectName || 'project').replace(/\s+/g, '-')

  function download() {
    if (type === 'docx') saveBlob(data, `${projectSlug}-${id}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    else if (type === 'xlsx') saveBlob(data, `${projectSlug}-${id}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    else if (type === 'prompt') saveBlob(data, `${projectSlug}-${id}.txt`, 'text/plain')
  }

  function copyToClipboard() {
    if (typeof data === 'string') navigator.clipboard.writeText(data).then(() => {})
  }

  const typeLabel = type === 'docx' ? '.docx' : type === 'xlsx' ? '.xlsx' : 'prompt'

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--rl2)', overflow: 'hidden', boxShadow: 'var(--sh)' }}>
      {/* Header */}
      <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
        {/* Status dot */}
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: status === 'done' ? 'var(--gl)' : status === 'error' ? 'var(--rl)' : status === 'prompt' ? 'var(--pm)' : 'var(--al)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {status === 'done' && <Check size={11} color="var(--green)" strokeWidth={3} />}
          {status === 'error' && <X size={11} color="var(--red)" strokeWidth={2.5} />}
          {status === 'working' && <Spinner size={11} />}
          {status === 'prompt' && <Zap size={11} color="var(--purple)" />}
        </div>

        <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{name}</span>
        <span style={{
          fontSize: 10, color: 'var(--t3)', background: 'var(--bg)',
          padding: '2px 8px', borderRadius: 10, border: '1px solid var(--border)', fontWeight: 500,
        }}>
          {typeLabel}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px', fontSize: 12, color: 'var(--t2)', lineHeight: 1.7 }}>
        {status === 'working' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)' }}>
            <Spinner size={12} />
            Generating…
          </div>
        )}
        {status === 'done' && (
          <span style={{ color: 'var(--green)', fontWeight: 500 }}>
            ✓ {type === 'docx' ? 'Word document' : 'Spreadsheet'} generated — {projectSlug}-{id}.{type}
          </span>
        )}
        {status === 'prompt' && (
          <>
            <Alert variant="purple">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span>
                {id === 'confluence'
                  ? 'Copy this into Atlassian Rovo to create the full Confluence space. Section 2 is wiki markup you can paste directly into Confluence.'
                  : 'Copy this into Atlassian Rovo to auto-create your Jira backlog. Sections 2 and 3 give a manual backlog and sprint plan.'}
              </span>
            </Alert>
            {previewText && (
              <pre style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11, background: 'var(--bg)',
                border: '1px solid var(--border)', borderRadius: 8, padding: 12,
                overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 260,
              }}>
                {previewText}
              </pre>
            )}
          </>
        )}
        {status === 'error' && (
          <span style={{ color: 'var(--red)' }}>Error: {error}</span>
        )}
      </div>

      {/* Actions */}
      {(status === 'done' || status === 'prompt') && (
        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg)' }}>
          <Btn variant="secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={download}>
            <Download size={13} />
            Download {typeLabel}
          </Btn>
          {type === 'prompt' && (
            <Btn variant="ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={copyToClipboard}>
              <Copy size={13} />
              Copy Rovo prompt
            </Btn>
          )}
        </div>
      )}
    </div>
  )
}
