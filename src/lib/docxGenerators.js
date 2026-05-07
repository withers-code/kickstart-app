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
    user: `Generate DoD/DoR content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Method: ${ctx.method} | Sprint: ${ctx.sprint} | Scope: ${ctx.scope}${ctx.instructions?.['dod-dor'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['dod-dor']}` : ''}${ctx.examples?.['dod-dor']?.text ? `\n\nEXAMPLE — match this quality and format:\n${ctx.examples['dod-dor'].text.slice(0, 4000)}` : ''}
Return JSON: {ready:[12 specific testable criteria strings],done:[14 criteria strings],sprintDone:[6 criteria strings],releaseDone:[8 criteria strings]}`,
  })
}

async function fetchRequirements(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate requirements doc content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Tech: ${ctx.tech} | Scope: ${ctx.scope}${ctx.instructions?.['requirements'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['requirements']}` : ''}${ctx.examples?.['requirements']?.text ? `\n\nEXAMPLE — match this quality and format:\n${ctx.examples['requirements'].text.slice(0, 4000)}` : ''}
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
    user: `Generate handover log content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Tech: ${ctx.tech} | Scope: ${ctx.scope}${ctx.instructions?.['handover'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['handover']}` : ''}${ctx.examples?.['handover']?.text ? `\n\nEXAMPLE — match this quality and format:\n${ctx.examples['handover'].text.slice(0, 4000)}` : ''}
Return JSON: {keyContacts:[{name,role,org,email,notes} x6],workstreams:[{name,status,priority,nextAction,owner} x5],topRisks:[string x3],relationshipContext:string,techNotes:string,outstandingActions:[{action,owner,due,priority} x5]}`,
  })
}

async function fetchChecklist(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate project checklist content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Tech: ${ctx.tech} | Scope: ${ctx.scope}${ctx.instructions?.['project-checklist'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['project-checklist']}` : ''}${ctx.examples?.['project-checklist']?.text ? `\n\nEXAMPLE — match this quality and format:\n${ctx.examples['project-checklist'].text.slice(0, 4000)}` : ''}
Return JSON: {governance:[8 items],teamAccess:[8 items],requirements:[7 items],technical:[8 items],testing:[5 items],changeManagement:[5 items],preGoLive:[10 items]}`,
  })
}

async function fetchTechSpec(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate tech spec content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Tech: ${ctx.tech} | Scope: ${ctx.scope}${ctx.instructions?.['tech-spec'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['tech-spec']}` : ''}${ctx.examples?.['tech-spec']?.text ? `\n\nEXAMPLE — match this quality and format:\n${ctx.examples['tech-spec'].text.slice(0, 4000)}` : ''}
Return JSON: {purpose:string,architectureDesc:string,components:[{name,technology,purpose,owner} x6],decisions:[{decision,chosen,rationale,alternatives} x5],integrations:[{system,method,auth,format,owner} x4],security:[6 check items],nfrs:[{nfr,requirement,approach} x5],openQuestions:[{question,owner,date,resolution} x5]}`,
  })
}

async function fetchUAT(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate UAT guide content for: Project: ${ctx.pname} | Client: ${ctx.cname} | Scope: ${ctx.scope}${ctx.instructions?.['uat-guide'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['uat-guide']}` : ''}${ctx.examples?.['uat-guide']?.text ? `\n\nEXAMPLE — match this quality and format:\n${ctx.examples['uat-guide'].text.slice(0, 4000)}` : ''}
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
      [[ctx.dm,'Kickstart','Delivery Manager','Y'],['[Name]',ctx.cname,'[Role]','']], ctx.theme.primary), space(),
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
      [['Client test lead','','',''],['Client sign-off authority','','',''],['Kickstart DM',ctx.dm,'','']], ctx.theme.primary),
  ], ctx.theme)
}

export async function genDocxClientRequest(ctx) {
  return buildDocx([
    h1(`Client Request Template — ${ctx.pname}`),
    p('Use this template to submit all new requests to Kickstart.', { italic: true }), space(),
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
    h2('6. Kickstart use only'),
    makeTable(['Field','Value'], [2500,7026],
      [['Received by',ctx.dm],['Jira ticket ID',''],['Estimated effort',''],['Target sprint',''],['Status','Triage / Accepted / Deferred / Rejected']], ctx.theme.primary),
  ], ctx.theme)
}

// ─── Delivery artefacts ───────────────────────────────────────────────────────

async function fetchStatusReport(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate weekly status report content. Project: ${ctx.pname} | Client: ${ctx.cname} | Scope: ${ctx.scope} | Team: ${ctx.team}${ctx.instructions?.['status-report'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['status-report']}` : ''}
Return JSON: {
  overallRag:"Green|Amber|Red",
  executiveSummary:string,
  progressItems:[string x6-8],
  plannedItems:[string x5-6],
  risks:[{risk:string,rag:"Green|Amber|Red",mitigation:string,owner:string} x4],
  decisions:[{decision:string,owner:string,dueDate:string} x3],
  milestones:[{milestone:string,plannedDate:string,status:"On Track|At Risk|Complete|Delayed"} x5]
}`,
  })
}

export async function genDocxStatusReport(ctx, opts) {
  const d = await fetchStatusReport(ctx, opts)
  return buildDocx([
    h1(`Weekly Status Report — ${ctx.pname}`), space(),
    makeTable(['Field','Value'], [2500,7026], [
      ['Project', ctx.pname], ['Client', ctx.cname],
      ['Report date', new Date().toLocaleDateString('en-GB')],
      ['Reporting period', '[Week of DD/MM/YYYY]'],
      ['Delivery manager', ctx.dm], ['Overall status', d.overallRag || 'Green'],
    ], ctx.theme.primary), space(),
    h2('Executive summary'), p(d.executiveSummary || ''), space(),
    h2('Progress this period'), ...(d.progressItems || []).map(bullet), space(),
    h2('Planned next period'), ...(d.plannedItems || []).map(bullet), space(),
    h2('Risks & issues'),
    makeTable(['Risk / Issue', 'RAG', 'Mitigation', 'Owner'], [3500, 900, 3500, 1626],
      (d.risks || []).map(r => [r.risk, r.rag, r.mitigation, r.owner]), ctx.theme.primary), space(),
    h2('Decisions required'),
    makeTable(['Decision', 'Owner', 'Due'], [5000, 2000, 2526],
      (d.decisions || []).map(dec => [dec.decision, dec.owner, dec.dueDate || '']), ctx.theme.primary), space(),
    h2('Milestone tracker'),
    makeTable(['Milestone', 'Planned date', 'Status'], [4500, 2000, 3026],
      (d.milestones || []).map(m => [m.milestone, m.plannedDate, m.status]), ctx.theme.primary), space(),
    h2('Distribution'),
    makeTable(['Name', 'Role', 'Organisation'], [3000, 3000, 3526],
      [[ctx.dm, 'Delivery Manager', 'Sprint Reply'], ['[Name]', '[Role]', ctx.cname || '[Client]']], ctx.theme.primary),
  ], ctx.theme)
}

export async function genDocxChangeRequest(ctx) {
  return buildDocx([
    h1(`Change Request — ${ctx.pname}`), space(),
    makeTable(['Field', 'Value'], [2500, 7026], [
      ['Project', ctx.pname], ['Client', ctx.cname],
      ['CR Number', 'CR-[XXX]'], ['Date raised', new Date().toLocaleDateString('en-GB')],
      ['Raised by', '[NAME / ROLE]'], ['Status', 'Draft'],
      ['Priority', 'High / Medium / Low'],
    ], ctx.theme.primary), space(),
    h2('1. Change description'),
    p('[Describe the change being requested — what is changing, from what to what]'), space(),
    h2('2. Business justification'),
    p('[Why is this change needed? What business or delivery risk does it address?]'), space(),
    h2('3. Impact assessment'),
    makeTable(['Impact area', 'Detail', 'Level (High / Med / Low)'], [2500, 4500, 2526], [
      ['Scope', '', ''], ['Schedule', '', ''], ['Cost', '', ''],
      ['Quality / risk', '', ''], ['Dependencies', '', ''], ['Resource', '', ''],
    ], ctx.theme.primary), space(),
    h2('4. Options considered'),
    makeTable(['Option', 'Description', 'Pros', 'Cons', 'Recommended?'], [800, 2800, 2000, 2000, 1926], [
      ['1', 'Do nothing', '', '', ''],
      ['2', '[Recommended option]', '', '', 'Yes'],
      ['3', '[Alternative]', '', '', ''],
    ], ctx.theme.primary), space(),
    h2('5. Recommendation'),
    p('[Summarise the recommended approach and rationale]'), space(),
    h2('6. Approvals'),
    makeTable(['Role', 'Name', 'Decision (Approve / Reject / Defer)', 'Date', 'Signature'], [2000, 2000, 2800, 1200, 1526], [
      ['Delivery Manager', ctx.dm, '', '', ''],
      ['Client Lead', '', '', '', ''],
      ['Sponsor', '', '', '', ''],
    ], ctx.theme.primary),
  ], ctx.theme)
}

export async function genDocxSprintReview(ctx) {
  return buildDocx([
    h1(`Sprint Review — ${ctx.pname}`), space(),
    makeTable(['Field', 'Value'], [2500, 7026], [
      ['Sprint', '[SPRINT NUMBER]'], ['Project', ctx.pname], ['Client', ctx.cname],
      ['Review date', '[DATE]'], ['Sprint goal', '[GOAL]'], ['Facilitator', ctx.dm],
    ], ctx.theme.primary), space(),
    h2('Sprint metrics'),
    makeTable(['Metric', 'Planned', 'Actual'], [4500, 2000, 3026], [
      ['Story points committed', '', ''], ['Story points completed', '', ''],
      ['Stories completed', '', ''], ['Stories carried over', '', ''],
      ['Bugs raised / closed', '', ''], ['Velocity vs. 3-sprint average', '', ''],
    ], ctx.theme.primary), space(),
    h2('Demo outcomes'),
    makeTable(['Story / Feature', 'Demo owner', 'Outcome', 'Stakeholder feedback'], [2800, 2000, 1700, 3026], [
      ['[Story]', '', 'Pass / Fail / Deferred', ''],
      ['[Story]', '', '', ''],
      ['[Story]', '', '', ''],
    ], ctx.theme.primary), space(),
    h2('Backlog health'),
    makeTable(['Metric', 'Value', 'Notes'], [3000, 2000, 4526], [
      ['Total backlog items', '', ''], ['Ready for next sprint', '', ''],
      ['Blocked items', '', ''], ['Velocity trend (3 sprint avg)', '', ''],
    ], ctx.theme.primary), space(),
    h2('Stakeholder feedback'),
    makeTable(['Feedback item', 'Raised by', 'Category', 'Action'], [3000, 2000, 2000, 2526], [
      ['', '', 'Enhancement / Bug / Query', ''],
      ['', '', '', ''],
    ], ctx.theme.primary), space(),
    h2('Next sprint planning notes'),
    p('[Key items, priorities and constraints for the next sprint]'), space(),
    makeTable(['#', 'Item', 'Owner', 'Priority'], [500, 5500, 2000, 1526], [
      ['1', '', '', ''], ['2', '', '', ''], ['3', '', '', ''],
    ], ctx.theme.primary),
  ], ctx.theme)
}

// ─── Closure artefacts ────────────────────────────────────────────────────────

async function fetchLessonsLearned(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate lessons learned content. Project: ${ctx.pname} | Client: ${ctx.cname} | Method: ${ctx.method} | Tech: ${ctx.tech} | Scope: ${ctx.scope}${ctx.instructions?.['lessons-learned'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['lessons-learned']}` : ''}
Return JSON: {
  projectSummary:string,
  wentWell:[{area:string,description:string,impact:string,recommendation:string} x6],
  improvements:[{area:string,issue:string,rootCause:string,recommendation:string} x6],
  keyRisks:[string x4],
  processImprovements:[string x5],
  teamRecommendations:[string x4]
}`,
  })
}

export async function genDocxLessonsLearned(ctx, opts) {
  const d = await fetchLessonsLearned(ctx, opts)
  return buildDocx([
    h1(`Lessons Learned — ${ctx.pname}`), space(), ...docControl(ctx),
    p('Complete at project close-out and share with your delivery practice.', { italic: true }), space(),
    h2('1. Project summary'), p(d.projectSummary || ''), space(),
    h2('2. What went well'),
    makeTable(['Area', 'What worked well', 'Impact', 'Recommendation for next time'], [1800, 3000, 2000, 2726],
      (d.wentWell || []).map(w => [w.area, w.description, w.impact, w.recommendation]), ctx.theme.primary), space(),
    h2('3. Areas for improvement'),
    makeTable(['Area', 'Issue', 'Root cause', 'Recommendation'], [1800, 2800, 2200, 2726],
      (d.improvements || []).map(i => [i.area, i.issue, i.rootCause, i.recommendation]), ctx.theme.primary), space(),
    h2('4. Key risks that materialised'), ...(d.keyRisks || []).map(bullet), space(),
    h2('5. Process improvements recommended'), ...(d.processImprovements || []).map(bullet), space(),
    h2('6. Team recommendations'), ...(d.teamRecommendations || []).map(bullet), space(),
    h2('7. Sign-off'),
    makeTable(['Role', 'Name', 'Signature', 'Date'], [3000, 2500, 2000, 2026], [
      ['Delivery Manager', ctx.dm, '', ''],
      ['Client Lead', '', '', ''],
      ['Practice Lead', '', '', ''],
    ], ctx.theme.primary),
  ], ctx.theme)
}

async function fetchProjectClosure(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate project closure report content. Project: ${ctx.pname} | Client: ${ctx.cname} | Scope: ${ctx.scope} | Tech: ${ctx.tech} | Team: ${ctx.team}${ctx.instructions?.['project-closure'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['project-closure']}` : ''}
Return JSON: {
  executiveSummary:string,
  objectivesDelivered:[{objective:string,status:"Delivered|Partial|Not delivered",notes:string} x5],
  keyDeliverables:[{deliverable:string,status:string,acceptedBy:string,notes:string} x6],
  achievementHighlights:[string x5],
  lessonsHighlights:[string x4],
  outstandingItems:[{item:string,owner:string,targetDate:string,priority:"High|Medium|Low"} x4]
}`,
  })
}

export async function genDocxProjectClosure(ctx, opts) {
  const d = await fetchProjectClosure(ctx, opts)
  return buildDocx([
    h1(`Project Closure Report — ${ctx.pname}`), space(), ...docControl(ctx),
    h2('1. Executive summary'), p(d.executiveSummary || ''), space(),
    h2('2. Objectives delivered'),
    makeTable(['Objective', 'Status', 'Notes'], [4000, 1800, 3726],
      (d.objectivesDelivered || []).map(o => [o.objective, o.status, o.notes]), ctx.theme.primary), space(),
    h2('3. Key deliverables'),
    makeTable(['Deliverable', 'Status', 'Accepted by', 'Notes'], [3200, 1500, 2000, 2826],
      (d.keyDeliverables || []).map(del => [del.deliverable, del.status, del.acceptedBy, del.notes || '']), ctx.theme.primary), space(),
    h2('4. Achievement highlights'), ...(d.achievementHighlights || []).map(bullet), space(),
    h2('5. Lessons learned highlights'), ...(d.lessonsHighlights || []).map(bullet), space(),
    h2('6. Outstanding items & handover'),
    makeTable(['Item', 'Owner', 'Target date', 'Priority'], [4000, 2000, 1800, 1726],
      (d.outstandingItems || []).map(o => [o.item, o.owner, o.targetDate, o.priority]), ctx.theme.primary), space(),
    h2('7. Project sign-off'),
    p('By signing below, all parties confirm the project is formally closed and deliverables accepted.', { italic: true }), space(),
    makeTable(['Role', 'Name', 'Signature', 'Date'], [3000, 2500, 2000, 2026], [
      ['Delivery Manager', ctx.dm, '', ''],
      ['Client Sponsor', '', '', ''],
      ['Client Lead', '', '', ''],
      ['Practice Lead', '', '', ''],
    ], ctx.theme.primary),
  ], ctx.theme)
}

// ─── Project Initiation Document ─────────────────────────────────────────────
async function fetchPID(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate a Project Initiation Document. Project: ${ctx.pname} | Client: ${ctx.cname} | Scope: ${ctx.scope} | Method: ${ctx.method} | Sprint: ${ctx.sprint} | Team: ${ctx.team} | Tech: ${ctx.tech} | Start: ${ctx.start} | Industry: ${ctx.industry}${ctx.sow ? `\n\nSOW CONTEXT:\n${ctx.sow.slice(0, 4000)}` : ''}${ctx.instructions?.['pid'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['pid']}` : ''}${ctx.examples?.['pid']?.text ? `\n\nEXAMPLE:\n${ctx.examples['pid'].text.slice(0, 3000)}` : ''}
Return JSON:
{
  "purpose": "one-sentence mission statement",
  "background": "2 sentences of business context explaining why this project is needed",
  "objectives": [{"objective":"SMART objective text","successCriteria":"measurable outcome"} x5],
  "inScope": ["item" x6],
  "outOfScope": ["item" x4],
  "assumptions": ["assumption" x5],
  "constraints": ["constraint" x4],
  "dependencies": ["dependency" x3],
  "governance": {
    "sponsor": "Name — Title",
    "steeringMembers": ["Name — Role" x3],
    "deliveryManager": "Name",
    "reviewCadence": "e.g. Weekly Steering call — Mondays 9am"
  },
  "timeline": [{"phase":"phase name","target":"target date or week range","keyDeliverable":"primary outcome"} x5],
  "budget": {"totalBudget":"£XXX,XXX","contingency":"10%","approvedBy":"Name — Title"},
  "risks": [{"risk":"description","impact":"High|Medium|Low","mitigation":"action"} x4],
  "approvals": [{"role":"Project Sponsor"},{"role":"Client Programme Manager"},{"role":"Delivery Manager"},{"role":"Practice Lead"}]
}`,
  })
}

export async function genDocxPID(ctx, opts) {
  const d = await fetchPID(ctx, opts)
  return buildDocx([
    h1(`Project Initiation Document — ${ctx.pname}`), space(), ...docControl(ctx),
    h2('1. Purpose'), p(d.purpose || ''), space(),
    h2('2. Business background'), p(d.background || ''), space(),
    h2('3. Objectives & success criteria'),
    makeTable(['#', 'Objective', 'Success criteria'], [500, 4500, 4526],
      (d.objectives || []).map((o, i) => [`${i + 1}`, o.objective, o.successCriteria]), ctx.theme.primary), space(),
    h2('4. Scope'),
    h3('In scope'), ...(d.inScope || []).map(bullet),
    h3('Out of scope'), ...(d.outOfScope || []).map(bullet), space(),
    h2('5. Assumptions, constraints & dependencies'),
    h3('Assumptions'), ...(d.assumptions || []).map(bullet),
    h3('Constraints'), ...(d.constraints || []).map(bullet),
    h3('Dependencies'), ...(d.dependencies || []).map(bullet), space(),
    h2('6. Governance'),
    makeTable(['Role', 'Name / Detail'], [3000, 6526], [
      ['Project Sponsor', d.governance?.sponsor || ''],
      ['Steering Committee', (d.governance?.steeringMembers || []).join(', ')],
      ['Delivery Manager', d.governance?.deliveryManager || ctx.dm || ''],
      ['Review Cadence', d.governance?.reviewCadence || ''],
    ], ctx.theme.primary), space(),
    h2('7. High-level timeline'),
    makeTable(['Phase', 'Target', 'Key deliverable'], [2500, 2000, 5026],
      (d.timeline || []).map(t => [t.phase, t.target, t.keyDeliverable]), ctx.theme.primary), space(),
    h2('8. Budget summary'),
    makeTable(['Item', 'Value'], [3000, 6526], [
      ['Total approved budget', d.budget?.totalBudget || 'TBC'],
      ['Contingency', d.budget?.contingency || '10%'],
      ['Approved by', d.budget?.approvedBy || ''],
    ], ctx.theme.primary), space(),
    h2('9. Key risks'),
    makeTable(['Risk', 'Impact', 'Mitigation'], [4500, 1200, 3826],
      (d.risks || []).map(r => [r.risk, r.impact, r.mitigation]), ctx.theme.primary), space(),
    h2('10. Approvals'),
    p('By signing below, the named individuals confirm their understanding of and commitment to this project.', { italic: true }), space(),
    makeTable(['Role', 'Name', 'Signature', 'Date'], [3000, 2500, 2000, 2026],
      (d.approvals || []).map(a => [a.role, '', '', '']), ctx.theme.primary),
  ], ctx.theme)
}
