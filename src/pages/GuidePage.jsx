import React from 'react'
import { Zap, Palette, Layers, Share2, Settings } from 'lucide-react'

function GuideCard({ icon: Icon, title, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--rl2)', padding: '16px 20px', boxShadow: 'var(--sh)', marginBottom: 12 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        {Icon && <Icon size={15} color="var(--purple)" />}
        {title}
      </h3>
      {children}
    </div>
  )
}

const li = { fontSize: 13, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 3 }

export default function GuidePage() {
  return (
    <div>
      <GuideCard icon={Zap} title="What this tool creates">
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>
          This tool uses Claude to generate <strong>real, fully-populated project documents</strong> — not templates. Every artefact is tailored to your project using the context you enter.
        </p>
        <ul style={{ paddingLeft: 16 }}>
          <li style={li}><strong>Word documents (.docx)</strong> — DoD/DoR, Requirements, Meeting notes, Handover log, Retrospective, Project checklist, Tech spec, UAT guide, Client request form — branded with your colours, proper tables and headings</li>
          <li style={li}><strong>Spreadsheets (.xlsx)</strong> — RAID log, Stakeholder map, RACI matrix, Project plan, Decision log, Comms plan — styled with your theme, multiple sheets</li>
          <li style={li}><strong>Atlassian prompts</strong> — Confluence space structure and Jira ticket decomposition — copy into Rovo to create pages and tickets directly in Atlassian</li>
        </ul>
      </GuideCard>

      <GuideCard icon={Palette} title="Uploading a PowerPoint theme">
        <ul style={{ paddingLeft: 16 }}>
          <li style={li}>Upload any <code>.pptx</code> or <code>.potx</code> file — the primary colour is extracted and applied to all document headers and table headings.</li>
          <li style={li}>You can also set hex codes manually for Primary and Secondary colours.</li>
          <li style={li}>Five built-in presets cover Sprint Reply's palette plus common client styles.</li>
          <li style={li}>Theme colours appear as heading colours and table header backgrounds in Word docs, and column header fills in spreadsheets.</li>
        </ul>
      </GuideCard>

      <GuideCard icon={Layers} title="Using the Atlassian prompts">
        <ul style={{ paddingLeft: 16 }}>
          <li style={li}><strong>Confluence space:</strong> copy the generated prompt → open Atlassian Rovo → paste and run. Section 2 is Confluence wiki markup you can paste directly (Edit → Insert → Markup).</li>
          <li style={li}><strong>Jira from SoW:</strong> paste your Statement of Work in <strong>API &amp; settings</strong>, then generate. Copy the full prompt into Rovo — it creates Epics, Stories and Tasks with acceptance criteria directly in Jira.</li>
          <li style={li}>Both prompts are pre-filled with your project name, methodology and sprint length.</li>
        </ul>
      </GuideCard>

      <GuideCard icon={Share2} title="Sharing this app">
        <ul style={{ paddingLeft: 16 }}>
          <li style={li}>This is a hosted web app — share the URL directly with your team. No installation needed.</li>
          <li style={li}>Each user adds their own Anthropic API key in <strong>API &amp; settings</strong>. Keys are stored in the browser and never shared.</li>
          <li style={li}>To update prompt logic or add new artefacts, update the source files in the <code>src/lib/</code> folder and re-deploy.</li>
        </ul>
      </GuideCard>

      <GuideCard icon={Settings} title="Maintainer guidance">
        <ul style={{ paddingLeft: 16 }}>
          <li style={li}>One or two practice leads should own this deployment. Fork or clone the repo and push changes via GitHub → Vercel auto-deploys.</li>
          <li style={li}>Artefact definitions live in <code>src/lib/constants.js</code>. Prompt text and document structure live in <code>src/lib/docxGenerators.js</code>, <code>xlsxGenerators.js</code>, and <code>atlassianGenerators.js</code>.</li>
          <li style={li}>Adding a new artefact: add to <code>constants.js</code>, write a generator function, wire it up in <code>GeneratePage.jsx</code>.</li>
        </ul>
      </GuideCard>
    </div>
  )
}
