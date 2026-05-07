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
  // Delivery
  { id: 'status-report',    name: 'Weekly status report',       desc: 'RAG status, progress & next steps',         type: 'pptx' },
  { id: 'change-request',   name: 'Change request',             desc: 'Change control form & impact assessment',   type: 'docx' },
  { id: 'sprint-review',    name: 'Sprint review',              desc: 'Demo outcomes, velocity & feedback',        type: 'docx' },
  // Closure
  { id: 'lessons-learned',  name: 'Lessons learned',            desc: 'What worked, what to improve next time',    type: 'docx' },
  { id: 'project-closure',  name: 'Project closure report',     desc: 'Formal close-out with deliverables sign-off',type: 'docx' },
]

export const XLSX_ARTS = [
  { id: 'raid',         name: 'RAID log',        desc: 'Risks, assumptions, issues & dependencies', type: 'xlsx' },
  { id: 'stakeholder',  name: 'Stakeholder map', desc: 'Power/interest grid & contact register',    type: 'xlsx' },
  { id: 'raci',         name: 'RACI matrix',     desc: 'Roles & responsibilities across workstreams',type: 'xlsx' },
  { id: 'project-plan', name: 'Project plan',    desc: 'Milestones, phases & delivery timeline',    type: 'xlsx' },
  { id: 'decision-log', name: 'Decision log',    desc: 'Decisions & rationale tracker',             type: 'xlsx' },
  { id: 'comms-plan',   name: 'Comms plan',      desc: 'Stakeholder communication schedule',        type: 'xlsx' },
]

export const PPT_ARTS = [
  { id: 'kick-off-deck', name: 'Kick-off Deck', desc: 'Project kickoff presentation slides', type: 'pptx' },
  { id: 'delivery-report', name: 'Delivery Report', desc: 'Project status & delivery slides', type: 'pptx' },
]

export const EXT_ARTS = [
  { id: 'confluence', name: 'Confluence space',    desc: 'Full baseline space — Rovo prompt + wiki markup fallback', type: 'prompt' },
  { id: 'jira-sow',   name: 'Jira tickets from SoW', desc: 'Decompose SoW into Epics / Stories / Tasks via Rovo',   type: 'prompt' },
]

export const ALL_ARTS = [...DOCX_ARTS, ...XLSX_ARTS, ...PPT_ARTS, ...EXT_ARTS]

export const PHASES = [
  {
    id: 'initiation',
    label: 'Initiation',
    desc: 'Set the project up for success from day one',
    artIds: ['kick-off-deck', 'requirements', 'dod-dor', 'tech-spec', 'raid', 'stakeholder', 'raci', 'project-plan', 'comms-plan', 'client-request', 'confluence', 'jira-sow'],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    desc: 'Track progress, manage change and keep stakeholders informed',
    artIds: ['status-report', 'meeting-notes', 'retrospective', 'sprint-review', 'change-request', 'decision-log', 'uat-guide'],
  },
  {
    id: 'closure',
    label: 'Closure',
    desc: 'Close out cleanly and capture knowledge for next time',
    artIds: ['project-closure', 'lessons-learned', 'handover', 'delivery-report', 'project-checklist'],
  },
]

export const DEFAULT_INSTRUCTIONS = {
  'dod-dor': 'Generates sprint acceptance criteria in four sections: Definition of Ready (12 criteria for when a ticket can enter a sprint), Definition of Done (14 criteria for ticket completion), Sprint Done (6 criteria for sprint closure), and Release Done (8 criteria for production deployment readiness). Criteria are tailored to your methodology and project scope.',
  'requirements': 'Generates a formal requirements document with: project purpose statement, 5–7 in-scope items, 4–5 out-of-scope items, 6 assumptions, 5-entry stakeholder register, 18 functional requirements with MoSCoW prioritisation and acceptance criteria, 8 non-functional requirements, and 5 open questions.',
  'meeting-notes': 'Produces a reusable meeting notes template (static — no AI generation) with: document control table, attendee register, agenda table, notes sections, decisions log, and actions tracker. Copy and complete for each meeting.',
  'handover': 'Generates a project handover document with: 6 key contacts, 5 open workstreams with RAG status, active risks summary, relationship context notes, technical handover notes, and 5 outstanding actions.',
  'retrospective': 'Produces a sprint retrospective template (static — no AI generation) with: sprint metrics table, Start / Stop / Continue sections with action tracking, and a team health check scorecard across 5 dimensions.',
  'project-checklist': 'Generates a pre-go-live readiness checklist across 7 categories: governance & setup (8 items), team & access (8), requirements (7), technical readiness (8), testing & quality (5), change management (5), and pre-go-live (10 items).',
  'tech-spec': 'Generates a technical specification with: purpose statement, high-level architecture description, 6 system components, 5 architectural decisions with rationale, 4 integrations, 6 security considerations, 5 NFRs, and 5 open questions.',
  'uat-guide': 'Generates a UAT guide with: overview table, roles & responsibilities, 7 entry criteria, 6 exit criteria, test script template, defect severity SLA table, and a sign-off section.',
  'client-request': 'Produces a structured client request intake form (static — no AI generation) with fields for request type, description, business justification, acceptance criteria in Gherkin format, and stakeholder approvals.',
  'raid': 'Generates 20 RAID log entries across Risks, Assumptions, Issues, and Dependencies. Each entry includes impact, probability, risk score, owner, mitigation action, status, and target close date. Includes a summary totals sheet.',
  'stakeholder': 'Generates 14 stakeholders mapped to a power/interest grid. Each entry includes influence, interest, attitude (Champion → Blocker), engagement approach, and quadrant assignment. Includes a grid summary sheet.',
  'raci': 'Generates a RACI matrix with 10 roles and 22 activities across Planning, Requirements, Design, Development, Testing, Deployment, and Governance phases. Includes a legend sheet.',
  'project-plan': 'Generates a 6-phase project plan with start week, duration, key milestones, owner, and status for each phase. Includes a planning assumptions sheet.',
  'decision-log': 'Generates 8 pre-seeded decision log entries relevant to your project scope, each with date, decision, rationale, options considered, decision maker, impact level, status, and review date.',
  'comms-plan': 'Generates 14 communication activities covering key audiences, communication types, purpose, frequency, channel, owner, format, and notes.',
  'kick-off-deck': 'Generates an 8–10 slide kick-off presentation. Slides cover: project overview, objectives & scope, team introductions, delivery methodology, timeline, risks & dependencies, ways of working, and next steps.',
  'delivery-report': 'Generates a 7–9 slide delivery status report. Slides cover: executive summary with RAG status, delivery progress, milestone tracker, risk & issue highlights, team updates, and next period plan.',
  'confluence': 'Generates an Atlassian Rovo prompt to create a full Confluence project space (Home, Ways of Working, Glossary, Roles & Responsibilities, Templates, Sprint Tracker, RAID Log, Decisions, Timeline), plus ready-to-paste wiki markup for the Home page as a fallback.',
  'jira-sow': 'Generates an Atlassian Rovo prompt to decompose your SoW into a full Jira backlog, plus a manual backlog and sprint plan as fallback. Produces Epics per workstream, Stories with Gherkin acceptance criteria and Fibonacci story points, Tasks, and Spikes.',
  'status-report': 'Generates a weekly status report with overall RAG status, executive summary, progress this period (6–8 items), planned next period (5–6 items), risks & issues table (4 entries with RAG), decisions required (3 items), and milestone tracker (5 milestones with On Track / At Risk / Complete / Delayed status).',
  'change-request': 'Produces a structured change request template (static — no AI generation) with fields for CR number, requestor, description, business justification, impact assessment across scope/schedule/cost/quality/risk/resource, options analysis table, recommendation, and approval sign-offs.',
  'sprint-review': 'Produces a sprint review / demo template (static — no AI generation) with sprint overview, velocity & metrics table, demo outcomes table, backlog health summary, stakeholder feedback capture, and next sprint planning notes.',
  'lessons-learned': 'Generates a lessons learned register with project summary, 6 items of what went well (area, description, impact, recommendation for next time), 6 improvement areas (issue, root cause, recommendation), key risks that materialised, process improvement recommendations, and team-level recommendations.',
  'project-closure': 'Generates a formal project closure report with executive summary, objectives delivery table (5 objectives with Delivered / Partial / Not delivered status), key deliverables acceptance table (6 items), achievement highlights, lessons learned highlights, outstanding items for handover, and formal sign-off section.',
}

export const THEME_PRESETS = {
  'sprint-reply': { primary: '#4F46E5', secondary: '#FFFFFF', accent: '#EEF2FF', label: 'Indigo' },
  'midnight':     { primary: '#1E2761', secondary: '#CADCFC', accent: '#F0F4FF', label: 'Midnight blue' },
  'forest':       { primary: '#2C5F2D', secondary: '#97BC62', accent: '#F4F9F0', label: 'Forest green' },
  'charcoal':     { primary: '#36454F', secondary: '#E8E8E8', accent: '#F7F7F7', label: 'Charcoal' },
  'coral':        { primary: '#F96167', secondary: '#2F3C7E', accent: '#FFF8F8', label: 'Coral & navy' },
}
