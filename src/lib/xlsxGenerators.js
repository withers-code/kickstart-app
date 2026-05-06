import * as XLSX from 'xlsx'
import { callClaudeJSON } from './api.js'

function hexToARGB(hex) {
  return 'FF' + (hex || '#4F46E5').replace('#', '').toUpperCase().padEnd(6, '0')
}

function applyHeaderStyle(ws, ncols, themeHex) {
  for (let c = 0; c < ncols; c++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c })
    if (ws[cell]) {
      ws[cell].s = {
        fill: { fgColor: { rgb: hexToARGB(themeHex) } },
        font: { color: { rgb: 'FFFFFFFF' }, bold: true, sz: 10 },
        alignment: { wrapText: true, vertical: 'center' },
      }
    }
  }
}

function makeWb(sheets) {
  const wb = XLSX.utils.book_new()
  for (const { name, headers, rows, colWidths, theme } of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = colWidths.map(w => ({ wch: w }))
    applyHeaderStyle(ws, headers.length, theme)
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
}

export async function genRAID(ctx, opts) {
  const arr = await callClaudeJSON({
    apiKey: opts.apiKey, model: opts.model, maxTokens: opts.maxTokens,
    system: 'You are a senior delivery manager at Sprint Reply.',
    user: `Generate 20 RAID log entries for: Project: ${ctx.pname} | Client: ${ctx.cname} | Scope: ${ctx.scope}
Return JSON array, each: {id,category(Risk|Assumption|Issue|Dependency),description,impact(High|Medium|Low),probability(High|Medium|Low|N/A),riskScore(High|Medium|Low|N/A),owner,mitigation,status(Open|In Progress|Closed|Accepted),dateRaised,targetClose}`,
  })

  const theme = ctx.theme.primary
  return makeWb([
    {
      name: 'RAID Log',
      headers: ['ID','Category','Description','Impact','Probability','Risk Score','Owner','Mitigation / Action','Status','Date Raised','Target Close'],
      rows: arr.map(r => [r.id,r.category,r.description,r.impact,r.probability,r.riskScore,r.owner,r.mitigation,r.status,r.dateRaised,r.targetClose]),
      colWidths: [8,14,40,10,12,11,18,40,14,13,13],
      theme,
    },
    {
      name: 'Summary',
      headers: ['Category','Total','Open','High Impact'],
      rows: ['Risk','Assumption','Issue','Dependency'].map(c => {
        const items = arr.filter(r => r.category === c)
        return [c, items.length, items.filter(r => r.status === 'Open').length, items.filter(r => r.impact === 'High').length]
      }),
      colWidths: [16,8,8,14],
      theme,
    },
  ])
}

export async function genStakeholder(ctx, opts) {
  const arr = await callClaudeJSON({
    apiKey: opts.apiKey, model: opts.model, maxTokens: opts.maxTokens,
    system: 'You are a senior delivery manager at Sprint Reply.',
    user: `Generate 14 stakeholders for: Project: ${ctx.pname} | Client: ${ctx.cname} | Scope: ${ctx.scope}
JSON array each: {name,role,organisation,influence(High|Medium|Low),interest(High|Medium|Low),attitude(Champion|Supporter|Neutral|Sceptic|Blocker),concerns,engagementApproach,owner,quadrant(Manage Closely|Keep Satisfied|Keep Informed|Monitor)}`,
  })

  const theme = ctx.theme.primary
  return makeWb([
    {
      name: 'Stakeholder Register',
      headers: ['Name','Role','Organisation','Influence','Interest','Attitude','Key Concerns','Engagement Approach','SR Owner','Quadrant'],
      rows: arr.map(r => [r.name,r.role,r.organisation,r.influence,r.interest,r.attitude,r.concerns,r.engagementApproach,r.owner,r.quadrant]),
      colWidths: [20,22,16,11,10,12,35,35,16,18],
      theme,
    },
    {
      name: 'Power-Interest Grid',
      headers: ['Quadrant','Stakeholders'],
      rows: ['Manage Closely','Keep Satisfied','Keep Informed','Monitor'].map(q => [q, arr.filter(r => r.quadrant === q).map(r => r.name).join(', ')]),
      colWidths: [18,60],
      theme,
    },
  ])
}

export async function genRACI(ctx, opts) {
  const data = await callClaudeJSON({
    apiKey: opts.apiKey, model: opts.model, maxTokens: opts.maxTokens,
    system: 'You are a senior delivery manager at Sprint Reply.',
    user: `Generate RACI matrix for: Project: ${ctx.pname} | Client: ${ctx.cname} | Scope: ${ctx.scope}
Return JSON: {roles:[10 role names mix of client and Sprint Reply], activities:[{activity,category,raci:{roleName:"R|A|C|I|""}} x22 activities across Planning,Requirements,Design,Development,Testing,Deployment,Governance]}`,
  })

  const theme = ctx.theme.primary
  return makeWb([
    {
      name: 'RACI Matrix',
      headers: ['Activity', 'Category', ...data.roles],
      rows: data.activities.map(a => [a.activity, a.category, ...data.roles.map(r => (a.raci || {})[r] || '')]),
      colWidths: [40, 18, ...data.roles.map(() => 13)],
      theme,
    },
    {
      name: 'Legend',
      headers: ['Code', 'Meaning'],
      rows: [['R','Responsible — does the work'],['A','Accountable — ultimately answerable'],['C','Consulted — provides input'],['I','Informed — kept up to date']],
      colWidths: [8, 35],
      theme,
    },
  ])
}

export async function genProjectPlan(ctx, opts) {
  const data = await callClaudeJSON({
    apiKey: opts.apiKey, model: opts.model, maxTokens: opts.maxTokens,
    system: 'You are a senior delivery manager at Sprint Reply.',
    user: `Generate project plan for: Project: ${ctx.pname} | Methodology: ${ctx.method} | Sprint: ${ctx.sprint} | Scope: ${ctx.scope}
Return JSON: {phases:[{phase,startWeek,durationWeeks,milestones:[],owner,status(Not Started|In Progress|At Risk|Complete)} x6], assumptions:[string x7]}`,
  })

  const theme = ctx.theme.primary
  return makeWb([
    {
      name: 'Project Plan',
      headers: ['Phase','Start Week','Duration (wks)','End Week','Key Milestones','Owner','Status'],
      rows: (data.phases || []).map(p => [p.phase, p.startWeek, p.durationWeeks, (p.startWeek + p.durationWeeks - 1), (p.milestones || []).join(' | '), p.owner, p.status]),
      colWidths: [24,12,15,10,60,20,14],
      theme,
    },
    {
      name: 'Assumptions',
      headers: ['Planning Assumptions'],
      rows: (data.assumptions || []).map(a => [a]),
      colWidths: [80],
      theme,
    },
  ])
}

export async function genDecisionLog(ctx, opts) {
  const arr = await callClaudeJSON({
    apiKey: opts.apiKey, model: opts.model, maxTokens: opts.maxTokens,
    system: 'You are a senior delivery manager at Sprint Reply.',
    user: `Generate 8 seeded decision log entries for: Project: ${ctx.pname} | Scope: ${ctx.scope}
JSON array each: {id,date,decision,rationale,optionsConsidered,madeBy,impact(High|Medium|Low),status(Open|Agreed|Superseded),reviewDate}`,
  })

  return makeWb([{
    name: 'Decision Log',
    headers: ['ID','Date','Decision','Rationale','Options Considered','Made By','Impact','Status','Review Date'],
    rows: arr.map(r => [r.id,r.date,r.decision,r.rationale,r.optionsConsidered,r.madeBy,r.impact,r.status,r.reviewDate]),
    colWidths: [9,12,40,35,35,20,10,12,13],
    theme: ctx.theme.primary,
  }])
}

export async function genCommsPlan(ctx, opts) {
  const arr = await callClaudeJSON({
    apiKey: opts.apiKey, model: opts.model, maxTokens: opts.maxTokens,
    system: 'You are a senior delivery manager at Sprint Reply.',
    user: `Generate 14 communication activities for: Project: ${ctx.pname} | Client: ${ctx.cname} | Scope: ${ctx.scope}
JSON array each: {audience,communicationType,purpose,frequency,channel,owner,format,notes}`,
  })

  return makeWb([{
    name: 'Comms Plan',
    headers: ['Audience','Communication Type','Purpose','Frequency','Channel','Owner','Format','Notes'],
    rows: arr.map(r => [r.audience,r.communicationType,r.purpose,r.frequency,r.channel,r.owner,r.format,r.notes]),
    colWidths: [20,22,35,14,16,18,16,30],
    theme: ctx.theme.primary,
  }])
}
