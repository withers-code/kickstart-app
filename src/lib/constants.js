export const DOCX_ARTS = [
  { id: 'dod-dor',          name: 'Definition of Done & Ready', desc: 'Sprint acceptance criteria & checklists',   type: 'docx' },
  { id: 'requirements',     name: 'Requirements document',      desc: 'Functional & non-functional requirements',  type: 'docx' },
  { id: 'meeting-notes',    name: 'Meeting notes template',     desc: 'Agenda, actions & decisions format',        type: 'docx' },
  { id: 'handover',         name: 'Handover log',               desc: 'Role-based project handover document',      type: 'docx' },
  { id: 'retrospective',    name: 'Retrospective template',     desc: 'Start / Stop / Continue sprint retro',      type: 'docx' },
  { id: 'project-checklist',name: 'Project checklist',          desc: 'Pre-go-live readiness checklist',           type: 'docx' },
  { id: 'tech-spec',        name: 'Technical specification',    desc: 'HLD, architecture & design decisions',      type: 'docx' },
  { id: 'uat-guide',        name: 'UAT guide',                  desc: 'Test plan, scripts & defect log',           type: 'docx' },
  { id: 'client-request',   name: 'Client request template',    desc: 'Structured intake form for new requests',   type: 'docx' },
]

export const XLSX_ARTS = [
  { id: 'raid',         name: 'RAID log',        desc: 'Risks, assumptions, issues & dependencies', type: 'xlsx' },
  { id: 'stakeholder',  name: 'Stakeholder map', desc: 'Power/interest grid & contact register',    type: 'xlsx' },
  { id: 'raci',         name: 'RACI matrix',     desc: 'Roles & responsibilities across workstreams',type: 'xlsx' },
  { id: 'project-plan', name: 'Project plan',    desc: 'Milestones, phases & delivery timeline',    type: 'xlsx' },
  { id: 'decision-log', name: 'Decision log',    desc: 'Decisions & rationale tracker',             type: 'xlsx' },
  { id: 'comms-plan',   name: 'Comms plan',      desc: 'Stakeholder communication schedule',        type: 'xlsx' },
]

export const EXT_ARTS = [
  { id: 'confluence', name: 'Confluence space',    desc: 'Full baseline space — Rovo prompt + wiki markup fallback', type: 'prompt' },
  { id: 'jira-sow',   name: 'Jira tickets from SoW', desc: 'Decompose SoW into Epics / Stories / Tasks via Rovo',   type: 'prompt' },
]

export const ALL_ARTS = [...DOCX_ARTS, ...XLSX_ARTS, ...EXT_ARTS]

export const THEME_PRESETS = {
  'sprint-reply': { primary: '#4F46E5', secondary: '#FFFFFF', accent: '#EEF2FF', label: 'Sprint Reply' },
  'midnight':     { primary: '#1E2761', secondary: '#CADCFC', accent: '#F0F4FF', label: 'Midnight blue' },
  'forest':       { primary: '#2C5F2D', secondary: '#97BC62', accent: '#F4F9F0', label: 'Forest green' },
  'charcoal':     { primary: '#36454F', secondary: '#E8E8E8', accent: '#F7F7F7', label: 'Charcoal' },
  'coral':        { primary: '#F96167', secondary: '#2F3C7E', accent: '#FFF8F8', label: 'Coral & navy' },
}
