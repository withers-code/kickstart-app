import React, { useState } from 'react'
import { Briefcase, Palette, CheckSquare, Zap } from 'lucide-react'
import { Card, CardTitle, Field, Input, Select, Textarea, Btn, Alert, FormGrid } from '../components/ui.jsx'
import GenerationBanner from '../components/GenerationBanner.jsx'
import SowUploader from '../components/SowUploader.jsx'
import ThemePicker from '../components/ThemePicker.jsx'
import ArtefactGrid from '../components/ArtefactGrid.jsx'
import { ALL_ARTS, THEME_PRESETS } from '../lib/constants.js'
import { genDocxDoD, genDocxRequirements, genDocxMeetingNotes, genDocxHandover, genDocxRetrospective, genDocxChecklist, genDocxTechSpec, genDocxUAT, genDocxClientRequest } from '../lib/docxGenerators.js'
import { genRAID, genStakeholder, genRACI, genProjectPlan, genDecisionLog, genCommsPlan } from '../lib/xlsxGenerators.js'
import { genKickoffDeck, genDeliveryReport } from '../lib/pptxGenerators.js'
import { genConfluencePrompt, genJiraPrompt } from '../lib/atlassianGenerators.js'

const PRESET_SR = THEME_PRESETS['sprint-reply']

export default function GeneratePage({ apiKey, model, maxTokens, sowText, setSowText, customInstructions, artefactExamples }) {
  const [ctx, setCtx] = useState({
    pname: '', cname: '', dm: '', start: '',
    method: 'Agile Scrum', sprint: '2 weeks', team: '', tech: '', industry: '', scope: '',
  })
  const [theme, setTheme] = useState({ presetKey: 'sprint-reply', primary: PRESET_SR.primary, secondary: PRESET_SR.secondary, accent: PRESET_SR.accent })
  const [uploadedFile, setUploadedFile] = useState(null)
  const [sowFileName, setSowFileName] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [results, setResults] = useState([])
  const [generating, setGenerating] = useState(false)

  const allCount = ALL_ARTS.length

  function toggleArt(id) {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function toggleAll() {
    if (selected.size === allCount) setSelected(new Set())
    else setSelected(new Set(ALL_ARTS.map(a => a.id)))
  }

  const set = (field) => (e) => setCtx(c => ({ ...c, [field]: e.target.value }))

  function handleSowPopulate(fields, fileName) {
    const { sowText: rawSow, ...ctxFields } = fields
    setCtx(c => {
      const merged = { ...c }
      Object.entries(ctxFields).forEach(([k, v]) => { if (v) merged[k] = v })
      return merged
    })
    if (rawSow && setSowText) setSowText(rawSow)
    setSowFileName(fileName)
  }

  function handleSowClear() {
    setSowFileName(null)
    setCtx({ pname: '', cname: '', dm: '', start: '', method: 'Agile Scrum', sprint: '2 weeks', team: '', tech: '', industry: '', scope: '' })
    if (setSowText) setSowText('')
  }

  const opts = { apiKey, model: model || 'claude-sonnet-4-20250514', maxTokens: maxTokens || 4000 }
  const fullCtx = { ...ctx, sow: sowText, theme, instructions: customInstructions, examples: artefactExamples }

  function updateResult(id, patch) {
    setResults(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  async function generateAll() {
    if (!apiKey) { alert('Add your Anthropic API key in Settings first.'); return }
    if (selected.size === 0) { alert('Select at least one artefact.'); return }

    setGenerating(true)
    const arts = ALL_ARTS.filter(a => selected.has(a.id))

    // Initialise all cards as 'working'
    setResults(arts.map(a => ({
      id: a.id, name: a.name, type: a.type, status: 'working',
      projectName: ctx.pname || 'project',
    })))

    // DOCX generators map
    const docxFns = {
      'dod-dor': genDocxDoD, 'requirements': genDocxRequirements,
      'meeting-notes': genDocxMeetingNotes, 'handover': genDocxHandover,
      'retrospective': genDocxRetrospective, 'project-checklist': genDocxChecklist,
      'tech-spec': genDocxTechSpec, 'uat-guide': genDocxUAT,
      'client-request': genDocxClientRequest,
    }
    const xlsxFns = {
      'raid': genRAID, 'stakeholder': genStakeholder, 'raci': genRACI,
      'project-plan': genProjectPlan, 'decision-log': genDecisionLog, 'comms-plan': genCommsPlan,
    }
    const pptxFns = {
      'kick-off-deck': genKickoffDeck, 'delivery-report': genDeliveryReport,
    }

    for (const art of arts) {
      try {
        if (art.type === 'docx') {
          const fn = docxFns[art.id]
          if (!fn) throw new Error('Unknown docx type: ' + art.id)
          const needsOpts = art.id !== 'meeting-notes' && art.id !== 'retrospective' && art.id !== 'client-request'
          const buf = needsOpts ? await fn(fullCtx, opts) : await fn(fullCtx)
          updateResult(art.id, { status: 'done', data: buf })

        } else if (art.type === 'xlsx') {
          const fn = xlsxFns[art.id]
          if (!fn) throw new Error('Unknown xlsx type: ' + art.id)
          const data = await fn(fullCtx, opts)
          updateResult(art.id, { status: 'done', data })

        } else if (art.type === 'pptx') {
          const fn = pptxFns[art.id]
          if (!fn) throw new Error('Unknown pptx type: ' + art.id)
          const buf = await fn(fullCtx, opts)
          updateResult(art.id, { status: 'done', data: buf })

        } else if (art.type === 'prompt') {
          const text = art.id === 'confluence'
            ? await genConfluencePrompt(fullCtx, opts)
            : await genJiraPrompt(fullCtx, opts)
          updateResult(art.id, {
            status: 'prompt', data: text,
            previewText: text.slice(0, 600) + (text.length > 600 ? '\n\n… (full content available via Download / Copy)' : ''),
          })
        }
      } catch (err) {
        updateResult(art.id, { status: 'error', error: err.message })
      }
    }

    setGenerating(false)
  }

  return (
    <div>
      {!apiKey && (
        <Alert variant="amber">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>No API key set. Go to <strong>API &amp; settings</strong> to add your Anthropic key.</span>
        </Alert>
      )}

      {/* 1. Context */}
      <Card>
        <CardTitle icon={Briefcase}>1 · Project context</CardTitle>
        <SowUploader
          opts={opts}
          populated={!!sowFileName}
          fileName={sowFileName}
          onPopulate={handleSowPopulate}
          onClear={handleSowClear}
        />
        <FormGrid cols={2} style={{ marginBottom: 10 }}>
          <Field label="Project name *"><Input value={ctx.pname} onChange={set('pname')} placeholder="e.g. AI Smart Assistant Phase 2" /></Field>
          <Field label="Client name *"><Input value={ctx.cname} onChange={set('cname')} placeholder="e.g. British American Tobacco" /></Field>
          <Field label="Delivery manager"><Input value={ctx.dm} onChange={set('dm')} placeholder="Full name" /></Field>
          <Field label="Project start date"><Input type="date" value={ctx.start} onChange={set('start')} /></Field>
        </FormGrid>
        <FormGrid cols={3} style={{ marginBottom: 10 }}>
          <Field label="Methodology">
            <Select value={ctx.method} onChange={set('method')}>
              <option>Agile Scrum</option>
              <option>Agile Kanban</option>
              <option>Hybrid (Agile + Waterfall)</option>
              <option>Waterfall / Phased</option>
            </Select>
          </Field>
          <Field label="Sprint length">
            <Select value={ctx.sprint} onChange={set('sprint')}>
              <option>1 week</option>
              <option>2 weeks</option>
              <option>3 weeks</option>
              <option>4 weeks</option>
            </Select>
          </Field>
          <Field label="Team size &amp; composition"><Input value={ctx.team} onChange={set('team')} placeholder="e.g. 6 — 2 BAs, 3 devs, 1 DM" /></Field>
        </FormGrid>
        <FormGrid cols={2} style={{ marginBottom: 10 }}>
          <Field label="Key technologies / platforms"><Input value={ctx.tech} onChange={set('tech')} placeholder="e.g. Azure OpenAI, Power Platform, Jira" /></Field>
          <Field label="Client industry"><Input value={ctx.industry} onChange={set('industry')} placeholder="e.g. FMCG / Financial Services" /></Field>
        </FormGrid>
        <Field label="Project scope &amp; brief description *" full>
          <Textarea value={ctx.scope} onChange={set('scope')} rows={3} placeholder="Describe what this project delivers — used to populate all artefacts with relevant, specific content..." />
        </Field>
      </Card>

      {/* 2. Theme */}
      <Card>
        <CardTitle icon={Palette}>2 · Brand theme &amp; colours</CardTitle>
        <ThemePicker theme={theme} setTheme={setTheme} uploadedFile={uploadedFile} setUploadedFile={setUploadedFile} />
      </Card>

      {/* 3. Artefacts */}
      <Card>
        <CardTitle icon={CheckSquare}>3 · Select artefacts</CardTitle>
        <ArtefactGrid selected={selected} onToggle={toggleArt} onToggleAll={toggleAll} />
      </Card>

      {/* Generate */}
      <Btn full variant="primary" disabled={generating} onClick={generateAll}
        style={{ padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>
        {generating
          ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.65s linear infinite' }} /> Generating…</>
          : <><Zap size={14} /> Create all selected artefacts</>
        }
      </Btn>

      <GenerationBanner
        results={results}
        generating={generating}
        projectSlug={(ctx.pname || 'project').replace(/\s+/g, '-')}
        onDismiss={() => setResults([])}
      />
    </div>
  )
}
