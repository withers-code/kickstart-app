import { callClaude } from './api.js'

export async function genConfluencePrompt(ctx, opts) {
  return callClaude({
    ...opts,
    system: 'You are a senior delivery manager at Sprint Reply. Generate detailed Atlassian Rovo prompts and Confluence wiki markup.',
    user: `Create an Atlassian Rovo prompt to build a full Confluence project space for:
Project: ${ctx.pname} | Client: ${ctx.cname} | DM: ${ctx.dm} | Method: ${ctx.method} | Sprint: ${ctx.sprint} | Scope: ${ctx.scope}${ctx.instructions?.['confluence'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['confluence']}` : ''}

SECTION 1 — ROVO PROMPT (copy into Atlassian Rovo):
Write a complete Rovo prompt that creates these pages with full content:
- Home page (mission, key contacts, project overview, recently-updated macro, links)
- Ways of Working (ceremonies table, team norms, comms channels, onboarding steps)
- Glossary (30 terms relevant to the project and ${ctx.tech})
- Roles & Responsibilities (RACI, team directory)
- Templates folder (meeting notes, decision log, handover log as sub-pages)
- Sprint Tracker parent page with sprint template
- RAID Log, Decisions, Project Timeline pages
Pre-fill: project name "${ctx.pname}", client "${ctx.cname}", methodology "${ctx.method}", sprint "${ctx.sprint}", DM "${ctx.dm}".
Use ${ctx.theme.primary} as the primary colour in panel macros.

SECTION 2 — CONFLUENCE WIKI MARKUP FALLBACK:
Provide complete Confluence storage markup for the Home page — ready to paste into Confluence Edit → Insert → Markup.`,
  })
}

export async function genJiraPrompt(ctx, opts) {
  const sowSection = ctx.sow
    ? `\n\nSTATEMENT OF WORK:\n${ctx.sow}`
    : '\n\n[No SoW provided — generate realistic backlog from scope description]'

  return callClaude({
    ...opts,
    system: 'You are a senior BA at Sprint Reply. Generate Atlassian Rovo prompts and Jira backlogs.',
    user: `Create an Atlassian Rovo prompt to build a full Jira backlog for:
Project: ${ctx.pname} | Client: ${ctx.cname} | Method: ${ctx.method} | Sprint: ${ctx.sprint} | Scope: ${ctx.scope}${sowSection}${ctx.instructions?.['jira-sow'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['jira-sow']}` : ''}

SECTION 1 — ROVO PROMPT:
Rovo should create: Epics (one per workstream), Stories ("As a [persona], I want [action] so that [benefit]"), Tasks, Spikes.
Each story: 3 Gherkin ACs (Given/When/Then), Fibonacci story points, sprint assignment. Stories >8 pts flagged.
Labels: "${ctx.pname}". Sprint length: ${ctx.sprint}.

SECTION 2 — MANUAL BACKLOG:
EPIC | [title] | [description]
  STORY | [title] | As a [persona], I want [action] so that [benefit] | SP: X | Sprint: N
    AC: Given... When... Then...
  TASK | [title] | SP: X | Sprint: N
  SPIKE | [title] | SP: X | Sprint: N

SECTION 3 — SPRINT PLAN SUMMARY:
| Sprint | Stories | Rationale |`,
  })
}
