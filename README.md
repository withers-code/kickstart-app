# Sprint Reply — Project Kickstart

Generate fully-populated project artefacts in seconds: RAID logs, requirements docs, Word templates, Confluence spaces, Jira backlogs, and more.

## Deploy in one click

### Vercel (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_ORG/sprint-reply-kickstart&project-name=sprint-reply-kickstart&framework=vite)

1. Push this repo to GitHub (your org or personal account)
2. Click the button above
3. Connect your GitHub account and click Deploy
4. Done — your app is live in ~60 seconds

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_ORG/sprint-reply-kickstart)

### Manual deployment (any static host)

```bash
npm install
npm run build
# Upload the dist/ folder to any static host:
# Azure Static Web Apps, AWS S3 + CloudFront, GitHub Pages, etc.
```

## Local development

```bash
npm install
npm run dev        # Starts dev server at http://localhost:5173
```

## How it works

1. Fill in project context (name, client, methodology, scope)
2. Upload a PowerPoint theme or choose a colour preset
3. Select artefacts to generate
4. Click Generate — downloads real .docx and .xlsx files, plus Rovo prompts for Confluence/Jira

Each user adds their own Anthropic API key in the app's Settings panel. Keys are stored in the browser and never sent anywhere except Anthropic's API.

## Project structure

```
src/
  lib/
    api.js              — Anthropic API wrapper
    constants.js        — Artefact definitions and theme presets
    docxGenerators.js   — Word document builders (docx-js)
    xlsxGenerators.js   — Spreadsheet builders (SheetJS)
    atlassianGenerators.js — Confluence/Jira Rovo prompt generators
  components/
    Sidebar.jsx         — Navigation
    ArtefactGrid.jsx    — Artefact selection
    ThemePicker.jsx     — Brand theme upload and colour picker
    ResultCard.jsx      — Individual result download card
    ui.jsx              — Shared UI primitives
  pages/
    GeneratePage.jsx    — Main generate workflow
    GuidePage.jsx       — How to use
    SettingsPage.jsx    — API key and model settings
```

## Adding a new artefact

1. Add definition to `src/lib/constants.js` (DOCX_ARTS, XLSX_ARTS, or EXT_ARTS)
2. Write a generator function in the relevant `*Generators.js` file
3. Wire it up in `src/pages/GeneratePage.jsx` generator maps

## Tech stack

- React + Vite
- docx-js — Word document generation
- SheetJS (xlsx) — Spreadsheet generation
- Lucide React — Icons
- Anthropic Claude API — Content generation
