import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat,
} from 'docx'
import { callClaudeJSON } from './api.js'

// ─── Style helpers ────────────────────────────────────────────────────────────
function hexClean(h) { return (h || '4F46E5').replace('#', '').toUpperCase() }

function makeStyles(theme) {
  const primary = hexClean(theme.primary)
  return {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, color: primary, font: 'Calibri' },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, color: primary, font: 'Calibri' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Calibri' },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  }
}

function makeNumbering() {
  return {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
      { reference: 'checklist', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '\u25A1', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ],
  }
}

const pageProps = () => ({
  page: {
    size: { width: 11906, height: 16838 },
    margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
  },
})

// ─── Element helpers ──────────────────────────────────────────────────────────
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' }
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder }

function hdrCell(text, w, themeHex) {
  return new TableCell({
    borders: allBorders,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: hexClean(themeHex), type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text || ''), bold: true, color: 'FFFFFF', font: 'Calibri', size: 20 })] })],
  })
}

function dataCell(text, w, shade) {
  return new TableCell({
    borders: allBorders,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: shade ? 'F5F5F5' : 'FFFFFF', type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text || ''), font: 'Calibri', size: 20 })] })],
  })
}

function makeTable(headers, colWidths, rows, themeHex) {
  const total = colWidths.reduce((a, b) => a + b, 0)
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => hdrCell(h, colWidths[i], themeHex)) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => dataCell(cell, colWidths[ci], ri % 2 === 0)),
      })),
    ],
  })
}

const h1 = text => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] })
const h2 = text => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] })
const h3 = text => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] })
const p = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, font: 'Calibri', size: 22, ...opts })] })
const bullet = text => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text, font: 'Calibri', size: 22 })] })
const check = text => new Paragraph({ numbering: { reference: 'checklist', level: 0 }, children: [new TextRun({ text, font: 'Calibri', size: 22 })] })
const space = () => new Paragraph({ children: [new TextRun('')] })

function docControl(ctx) {
  return [
    makeTable(['Field', 'Value'], [3000, 5500], [
      ['Project', ctx.pname], ['Client', ctx.cname], ['Version', '1.0'],
      ['Date', new Date().toLocaleDateString('en-GB')], ['Prepared by', ctx.dm], ['Status', 'Draft'],
    ], ctx.theme.primary),
    space(),
  ]
}

async function buildDocx(content, theme) {
  const doc = new Document({
    styles: makeStyles(theme),
    numbering: makeNumbering(),
    sections: [{ properties: pageProps(), children: content }],
  })
  return Packer.toBlob(doc)
}

// ─── AI Data fetchers ─────────────────────────────────────────────────────────
async function fetchDoD(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate DoD/DoR content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Method: ${ctx.method} | Sprint: ${ctx.sprint} | Scope: ${ctx.scope}${ctx.instructions?.['dod-dor'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['dod-dor']}` : ''}
Return JSON: {ready:[12 specific testable criteria strings],done:[14 criteria strings],sprintDone:[6 criteria strings],releaseDone:[8 criteria strings]}`,
  })
}

async function fetchRequirements(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate requirements doc content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Tech: ${ctx.tech} | Scope: ${ctx.scope}${ctx.instructions?.['requirements'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['requirements']}` : ''}
Return JSON: {purpose:string,inScope:[5-7 items],outScope:[4-5 items],assumptions:[6 items],
stakeholders:[{name,role,requirements} x5],
functional:[{id,category,priority(Must|Should|Could|Wont),requirement,acceptance,status} x18 items],
nonfunctional:[{id,type,description,target,verification} x8],
openQuestions:[{id,question,owner,date,resolution} x5]}`,
  })
}

async function fetchHandover(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate handover log content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Tech: ${ctx.tech} | Scope: ${ctx.scope}${ctx.instructions?.['handover'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['handover']}` : ''}
Return JSON: {keyContacts:[{name,role,org,email,notes} x6],workstreams:[{name,status,priority,nextAction,owner} x5],topRisks:[string x3],relationshipContext:string,techNotes:string,outstandingActions:[{action,owner,due,priority} x5]}`,
  })
}

async function fetchChecklist(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate project checklist content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Tech: ${ctx.tech} | Scope: ${ctx.scope}${ctx.instructions?.['project-checklist'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['project-checklist']}` : ''}
Return JSON: {governance:[8 items],teamAccess:[8 items],requirements:[7 items],technical:[8 items],testing:[5 items],changeManagement:[5 items],preGoLive:[10 items]}`,
  })
}

async function fetchTechSpec(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate tech spec content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Tech: ${ctx.tech} | Scope: ${ctx.scope}${ctx.instructions?.['tech-spec'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['tech-spec']}` : ''}
Return JSON: {purpose:string,architectureDesc:string,components:[{name,technology,purpose,owner} x6],decisions:[{decision,chosen,rationale,alternatives} x5],integrations:[{system,method,auth,format,owner} x4],security:[6 check items],nfrs:[{nfr,requirement,approach} x5],openQuestions:[{question,owner,date,resolution} x5]}`,
  })
}

async function fetchUAT(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate UAT guide content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Scope: ${ctx.scope}${ctx.instructions?.['uat-guide'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['uat-guide']}` : ''}
Return JSON: {entryCriteria:[7 items],exitCriteria:[6 items]}`,
  })
}

// ─── Document builders ────────────────────────────────────────────────────────
export async function genDocxDoD(ctx, opts) {
  const d = await fetchDoD(ctx, opts)
  return buildDocx([
    h1(`Definition of Done & Ready — ${ctx.pname}`), space(),
    ...docControl(ctx),
    h2('Definition of Ready'), p('A ticket is Ready when ALL of the following criteria are met:', { italic: true }), space(),
    ...(d.ready || []).map(check), space(),
    h2('Definition of Done'), p('A ticket is Done when ALL of the following are true:', { italic: true }), space(),
    ...(d.done || []).map(check), space(),
    h2('Sprint Done'), p('The sprint is complete when:', { italic: true }), space(),
    ...(d.sprintDone || []).map(check), space(),
    h2('Release Done'), p('A release is ready for production when:', { italic: true }), space(),
    ...(d.releaseDone || []).map(check), space(),
    h2('Change Log'),
    makeTable(['Version','Date','Author','Change'], [1500,2000,3000,3026],
      [['1.0', new Date().toLocaleDateString('en-GB'), ctx.dm, 'Initial version']], ctx.theme.primary),
  ], ctx.theme)
}

export async function genDocxRequirements(ctx, opts) {
  const d = await fetchRequirements(ctx, opts)
  return buildDocx([
    h1(`Requirements Document — ${ctx.pname}`), space(),
    ...docControl(ctx),
    h2('1. Introduction'), h3('1.1 Purpose'), p(d.purpose || ''), space(),
    h3('1.2 Scope'),
    p('In scope:', { bold: true }), ...(d.inScope || []).map(bullet), space(),
    p('Out of scope:', { bold: true }), ...(d.outScope || []).map(bullet), space(),
    h3('1.3 Assumptions'), ...(d.assumptions || []).map((a, i) => p(`${i+1}. ${a}`)), space(),
    h2('2. Stakeholders'),
    makeTable(['Stakeholder','Role','Primary requirements'], [2800,2800,3926],
      (d.stakeholders || []).map(s => [s.name, s.role, s.requirements]), ctx.theme.primary), space(),
    h2('3. Functional requirements'),
    makeTable(['REQ-ID','Category','Priority','Requirement','Acceptance criteria','Status'], [1000,1400,1100,3500,3000,1026],
      (d.functional || []).map(r => [r.id,r.category,r.priority,r.requirement,r.acceptance,r.status||'Draft']), ctx.theme.primary), space(),
    h2('4. Non-functional requirements'),
    makeTable(['NFR-ID','Type','Description','Target','Verification'], [1000,1400,3200,2000,1926],
      (d.nonfunctional || []).map(r => [r.id,r.type,r.description,r.target,r.verification]), ctx.theme.primary), space(),
    h2('5. Open questions'),
    makeTable(['OQ-ID','Question','Owner','Date raised','Resolution'], [1000,3500,2000,1400,1626],
      (d.openQuestions || []).map(q => [q.id,q.question,q.owner,q.date||'',q.resolution||'Open']), ctx.theme.primary), space(),
    h2('6. Sign-off'),
    makeTable(['Role','Name','Date','Signature'], [2500,3000,2000,2026],
      [['Delivery Manager',ctx.dm,'',''],['Client Lead','','',''],['Technical Lead','','','']], ctx.theme.primary),
  ], ctx.theme)
}

export async function genDocxMeetingNotes(ctx) {
  return buildDocx([
    h1(`Meeting Notes — ${ctx.pname}`),
    p('Copy this template for each meeting', { italic: true, color: '888888' }), space(),
    makeTable(['Field','Detail'], [2500,7026], [
      ['Project',ctx.pname],['Client',ctx.cname],['Date','[DATE]'],['Time','[TIME] [TIMEZONE]'],
      ['Location / Link','[TEAMS/ZOOM LINK]'],['Facilitator','[NAME]'],['Note taker','[NAME]'],
    ], ctx.theme.primary), space(),
    h2('Attendees'),
    makeTable(['Name','Organisation','Role','Present?'], [3000,2500,2500,1526],
      [[ctx.dm,'Sprint Reply','Delivery Manager','Y'],['[Name]',ctx.cname,'[Role]','']], ctx.theme.primary), space(),
    h2('Agenda'),
    makeTable(['#','Item','Owner','Time'], [500,5500,2000,1526],
      [['1','Introductions / housekeeping','Facilitator','5 min'],['2','[AGENDA ITEM]','[OWNER]','[X min]'],['3','Actions review','All','5 min'],['4','AOB','All','5 min']], ctx.theme.primary), space(),
    h2('Notes'), h3('Item 1: [Title]'), p('[Notes here]'), space(),
    h2('Decisions made'),
    makeTable(['#','Decision','Made by','Date'], [500,5500,2000,1526],
      [['1','[DECISION]','[NAME / ROLE]','[DATE]']], ctx.theme.primary), space(),
    h2('Actions'),
    makeTable(['#','Action','Owner','Due date','Status'], [500,4500,2000,1500,1026],
      [['1','[ACTION ITEM]','[NAME]','[DD/MM/YYYY]','Open']], ctx.theme.primary), space(),
    p(`Notes circulated by: [NAME]  |  Circulated: [DATE]`, { italic: true, color: '888888' }),
  ], ctx.theme)
}

export async function genDocxHandover(ctx, opts) {
  const d = await fetchHandover(ctx, opts)
  return buildDocx([
    h1(`Handover Log — ${ctx.pname}`), space(), ...docControl(ctx),
    p('Complete a handover entry whenever a team member rotates off the project.', { italic: true }), space(),
    h2('[DATE] | [PERSON] | [ROLE]'), space(),
    h3('1. Role and responsibilities'), p('[What this person owns on the project day-to-day]'), space(),
    h3('2. Current project status'),
    makeTable(['Area','Status (RAG)','Notes'], [2500,2000,5026],
      [['Delivery','Green',''],['Client relationship','Amber',''],['Technical','Green',''],['Budget','Green','']], ctx.theme.primary), space(),
    h3('3. Key contacts'),
    makeTable(['Name','Role','Organisation','Email / Teams','Notes'], [2200,2000,2000,2000,1326],
      (d.keyContacts || []).map(c => [c.name,c.role,c.org,c.email||'',c.notes||'']), ctx.theme.primary), space(),
    h3('4. Open workstreams'),
    makeTable(['Workstream','Status','Priority','Next action','Owner'], [2200,1500,1200,3000,1626],
      (d.workstreams || []).map(w => [w.name,w.status,w.priority,w.nextAction,w.owner||'']), ctx.theme.primary), space(),
    h3('5. Key documents'),
    makeTable(['Document','Location','Notes'], [2500,5000,2026],
      [['Project plan','[Confluence / SharePoint link]',''],['RAID log','[Link]',''],['Requirements','[Link]',''],['Decision log','[Link]',''],['Jira board','[Link]','']], ctx.theme.primary), space(),
    h3('6. Active risks'), p('Top risks the incoming person must know immediately:'), space(),
    ...(d.topRisks || []).map(bullet), space(),
    h3('7. Relationship context'), p(d.relationshipContext || ''), space(),
    h3('8. Technical notes'), p(d.techNotes || ''), space(),
    h3('9. Outstanding actions'),
    makeTable(['Action','Owner','Due','Priority'], [4500,2000,1500,1526],
      (d.outstandingActions || []).map(a => [a.action,a.owner||'',a.due||'',a.priority||'Medium']), ctx.theme.primary), space(),
    h3('10. Sign-off'),
    makeTable(['','Name','Signature','Date'], [2000,3000,2500,2026],
      [['Handing over','[NAME]','',''],['Receiving','[NAME]','',''],['DM / line manager',ctx.dm,'','']], ctx.theme.primary),
  ], ctx.theme)
}

export async function genDocxRetrospective(ctx) {
  return buildDocx([
    h1(`Sprint Retrospective — ${ctx.pname}`), space(),
    makeTable(['Field','Value'], [2500,7026],
      [['Sprint','[SPRINT NUMBER]'],['Date','[DATE]'],['Facilitator','[NAME]'],['Team',ctx.team],['Methodology',ctx.method]], ctx.theme.primary), space(),
    h2('Sprint summary'),
    makeTable(['Metric','Value'], [4500,5026],
      [['Sprint goal','[GOAL]'],['Committed story points','[X]'],['Completed story points','[Y]'],['Velocity vs. average','[+/- Z%]'],['Stories completed','[N]'],['Carried over','[N]'],['Bugs raised','[N]']], ctx.theme.primary), space(),
    h2('Start · Stop · Continue'), space(),
    h3('Start doing'), p('What should we begin doing that we are not doing yet?', { italic: true }),
    makeTable(['#','Item','Raised by','Priority','Owner','Due'], [500,3500,2000,1200,1500,1026],
      [['1','','','','',''],['2','','','','',''],['3','','','','','']], ctx.theme.primary), space(),
    h3('Stop doing'), p('What should we stop doing that is not working?', { italic: true }),
    makeTable(['#','Item','Raised by','Priority','Owner','Due'], [500,3500,2000,1200,1500,1026],
      [['1','','','','',''],['2','','','','','']], ctx.theme.primary), space(),
    h3('Continue doing'), p('What is working well?', { italic: true }),
    makeTable(['#','Item','Raised by'], [500,6000,3026],
      [['1','',''],['2','',''],['3','','']], ctx.theme.primary), space(),
    h2('Team health check'),
    makeTable(['Dimension','Score','Trend','Notes'], [3500,1500,1500,3026],
      [['Team collaboration','/5','→',''],['Technical quality','/5','→',''],['Client relationship','/5','→',''],['Delivery confidence','/5','→',''],['Team wellbeing','/5','→','']], ctx.theme.primary), space(),
    h2('Top 3 actions'),
    makeTable(['#','Action','Owner','Due'], [500,5500,2000,1526],
      [['1','','',''],['2','','',''],['3','','','']], ctx.theme.primary),
  ], ctx.theme)
}

export async function genDocxChecklist(ctx, opts) {
  const d = await fetchChecklist(ctx, opts)
  return buildDocx([
    h1(`Project Readiness Checklist — ${ctx.pname}`), space(), ...docControl(ctx),
    p('Complete at kick-off and before each major milestone or go-live.', { italic: true }), space(),
    h2('1. Project governance & setup'), ...(d.governance || []).map(check), space(),
    h2('2. Team & access'), ...(d.teamAccess || []).map(check), space(),
    h2('3. Requirements & analysis'), ...(d.requirements || []).map(check), space(),
    h2('4. Technical readiness'), ...(d.technical || []).map(check), space(),
    h2('5. Testing & quality'), ...(d.testing || []).map(check), space(),
    h2('6. Change management'), ...(d.changeManagement || []).map(check), space(),
    h2('7. Pre-go-live'), ...(d.preGoLive || []).map(check), space(),
    h2('Sign-off'),
    makeTable(['Role','Name','Signature','Date'], [3000,2500,2000,2026],
      [['Delivery Manager',ctx.dm,'',''],['Client Lead','','',''],['Technical Lead','','','']], ctx.theme.primary),
  ], ctx.theme)
}

export async function genDocxTechSpec(ctx, opts) {
  const d = await fetchTechSpec(ctx, opts)
  return buildDocx([
    h1(`Technical Specification — ${ctx.pname}`), space(), ...docControl(ctx),
    h2('1. Introduction'), h3('1.1 Purpose'), p(d.purpose || ''), space(),
    h3('1.2 Project context'),
    makeTable(['Field','Value'], [2500,7026],
      [['Project',ctx.pname],['Client',ctx.cname],['Scope',ctx.scope],['Tech stack',ctx.tech],['Methodology',ctx.method]], ctx.theme.primary), space(),
    h2('2. High-level architecture'), p(d.architectureDesc || ''), space(),
    h3('2.1 System components'),
    makeTable(['Component','Technology','Purpose','Owner'], [2500,2500,3000,1526],
      (d.components || []).map(c => [c.name,c.technology,c.purpose,c.owner||'']), ctx.theme.primary), space(),
    h2('3. Technical design decisions'),
    makeTable(['Decision','Option chosen','Rationale','Alternatives'], [2500,2000,3000,2026],
      (d.decisions || []).map(r => [r.decision,r.chosen,r.rationale,r.alternatives||'']), ctx.theme.primary), space(),
    h2('4. Integrations'),
    makeTable(['System','Method','Auth','Data format','Owner'], [2200,1800,2000,1600,1926],
      (d.integrations || []).map(i => [i.system,i.method,i.auth||'',i.format||'',i.owner||'']), ctx.theme.primary), space(),
    h2('5. Security considerations'), ...(d.security || []).map(check), space(),
    h2('6. Non-functional requirements'),
    makeTable(['NFR','Requirement','Approach'], [2200,3500,3826],
      (d.nfrs || []).map(n => [n.nfr,n.requirement,n.approach||'']), ctx.theme.primary), space(),
    h2('7. Environments'),
    makeTable(['Environment','Purpose','URL / endpoint','Access'], [2200,2500,3000,1826],
      [['Development','Active development','','Team'],['Staging','Pre-release testing','','Team + Client'],['Production','Live','','Client']], ctx.theme.primary), space(),
    h2('8. Open questions'),
    makeTable(['#','Question','Owner','Date','Resolution'], [500,4000,2000,1500,1526],
      (d.openQuestions || []).map((q, i) => [String(i+1),q.question,q.owner||'',q.date||'',q.resolution||'Open']), ctx.theme.primary),
  ], ctx.theme)
}

export async function genDocxUAT(ctx, opts) {
  const d = await fetchUAT(ctx, opts)
  return buildDocx([
    h1(`UAT Guide — ${ctx.pname}`), space(), ...docControl(ctx),
    h2('1. UAT overview'),
    makeTable(['Item','Detail'], [3000,6526],
      [['UAT window','[START DATE] – [END DATE]'],['Environment','[UAT ENVIRONMENT URL]'],['Test lead (SR)','[NAME]'],['Test lead ('+ctx.cname+')','[NAME]'],['Sign-off authority','[NAME / ROLE]']], ctx.theme.primary), space(),
    h2('2. Roles and responsibilities'),
    makeTable(['Role','Responsibility','Person'], [3000,4000,2526],
      [['UAT coordinator (SR)','Facilitate UAT, track defects','[NAME]'],['BA (SR)','Support testers, clarify requirements','[NAME]'],['Client test lead','Coordinate testers, escalate blockers','[NAME]'],['Dev team','Fix defects to agreed SLA','[NAME]']], ctx.theme.primary), space(),
    h2('3. Entry criteria'), p('UAT will begin only when ALL of the following are met:'), space(),
    ...(d.entryCriteria || []).map(check), space(),
    h2('4. Exit criteria'), p('UAT is complete when:'), space(),
    ...(d.exitCriteria || []).map(check), space(),
    h2('5. Test script template'),
    makeTable(['Step','Action','Expected result','Actual result','Pass/Fail','Notes'], [700,2500,2500,2000,1000,826],
      [['1','[ACTION]','[EXPECTED]','','',''],['2','','','','','']], ctx.theme.primary), space(),
    h2('6. Defect severity'),
    makeTable(['Severity','Definition','SLA'], [1800,4500,3226],
      [['Critical','System unusable / data loss','Same day'],['High','Major function broken / no workaround','2 business days'],['Medium','Function impaired / workaround exists','Next sprint'],['Low','Cosmetic / minor inconvenience','Backlog']], ctx.theme.primary), space(),
    h2('7. Sign-off'),
    makeTable(['','Name','Signature','Date'], [2500,2500,2500,2026],
      [['Client test lead','','',''],['Client sign-off authority','','',''],['Sprint Reply DM',ctx.dm,'','']], ctx.theme.primary),
  ], ctx.theme)
}

export async function genDocxClientRequest(ctx) {
  return buildDocx([
    h1(`Client Request Template — ${ctx.pname}`),
    p('Use this template to submit all new requests to Sprint Reply.', { italic: true }), space(),
    makeTable(['Field','Value'], [2500,7026],
      [['Request ID','[Auto-assigned by DM]'],['Date submitted','[DATE]'],['Submitted by','[CLIENT NAME, ROLE]'],['Project',ctx.pname],['Priority','Critical | High | Medium | Low']], ctx.theme.primary), space(),
    h2('1. Request summary'),
    makeTable(['Field','Value'], [2500,7026],
      [['Title','[One-line description]'],['Type','New feature | Bug fix | Change | Data request | Access | Other']], ctx.theme.primary), space(),
    h2('2. Detailed description'), p('What do you need? Be as specific as possible.', { italic: true }), p('[FREE TEXT]'), space(),
    h2('3. Business justification'), p('[FREE TEXT]'), space(),
    h2('4. Acceptance criteria'),
    bullet('Given [CONTEXT], when [ACTION], then [EXPECTED OUTCOME]'),
    bullet('[ADD MORE AS NEEDED]'), space(),
    h2('5. Stakeholders and approvals'),
    makeTable(['Role','Name','Approval required?'], [3000,3500,3026],
      [['Business requester','[NAME]','Required'],['Business owner','[NAME]','Required'],['Technical approver','[NAME]','If technical']], ctx.theme.primary), space(),
    h2('6. Sprint Reply use only'),
    makeTable(['Field','Value'], [2500,7026],
      [['Received by',ctx.dm],['Jira ticket ID',''],['Estimated effort',''],['Target sprint',''],['Status','Triage / Accepted / Deferred / Rejected']], ctx.theme.primary),
  ], ctx.theme)
}
