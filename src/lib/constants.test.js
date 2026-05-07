import { ALL_ARTS, DOCX_ARTS, XLSX_ARTS, PPT_ARTS, EXT_ARTS, PHASES, DEFAULT_INSTRUCTIONS, THEME_PRESETS } from './constants.js'

const STATIC_ARTS = new Set(['meeting-notes', 'retrospective', 'client-request', 'change-request', 'sprint-review'])

describe('ALL_ARTS', () => {
  it('is the union of all sub-arrays', () => {
    expect(ALL_ARTS.length).toBe(DOCX_ARTS.length + XLSX_ARTS.length + PPT_ARTS.length + EXT_ARTS.length)
  })

  it('has no duplicate IDs', () => {
    const ids = ALL_ARTS.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every artefact has id, name, desc, and a valid type', () => {
    for (const art of ALL_ARTS) {
      expect(art.id, 'missing id').toBeTruthy()
      expect(art.name, `${art.id} missing name`).toBeTruthy()
      expect(art.desc, `${art.id} missing desc`).toBeTruthy()
      expect(['docx', 'xlsx', 'pptx', 'prompt'], `${art.id} invalid type`).toContain(art.type)
    }
  })
})

describe('PHASES', () => {
  it('has exactly three phases: initiation, delivery, closure', () => {
    expect(PHASES.map(p => p.id)).toEqual(['initiation', 'delivery', 'closure'])
  })

  it('every artId in a phase references a real artefact', () => {
    const validIds = new Set(ALL_ARTS.map(a => a.id))
    for (const phase of PHASES) {
      for (const id of phase.artIds) {
        expect(validIds.has(id), `"${id}" in phase "${phase.id}" not found in ALL_ARTS`).toBe(true)
      }
    }
  })

  it('every artefact appears in at least one phase', () => {
    const phaseIds = new Set(PHASES.flatMap(p => p.artIds))
    for (const art of ALL_ARTS) {
      expect(phaseIds.has(art.id), `"${art.id}" is not in any phase`).toBe(true)
    }
  })
})

describe('DEFAULT_INSTRUCTIONS', () => {
  it('has an entry for every AI-generated artefact', () => {
    const aiArts = ALL_ARTS.filter(a => !STATIC_ARTS.has(a.id))
    for (const art of aiArts) {
      expect(DEFAULT_INSTRUCTIONS, `Missing DEFAULT_INSTRUCTIONS entry for "${art.id}"`).toHaveProperty(art.id)
      expect(DEFAULT_INSTRUCTIONS[art.id].length, `Instruction for "${art.id}" is too short`).toBeGreaterThan(20)
    }
  })
})

describe('THEME_PRESETS', () => {
  it('every preset has primary, secondary, accent, and label', () => {
    for (const [key, preset] of Object.entries(THEME_PRESETS)) {
      expect(preset, `${key} missing primary`).toHaveProperty('primary')
      expect(preset, `${key} missing secondary`).toHaveProperty('secondary')
      expect(preset, `${key} missing accent`).toHaveProperty('accent')
      expect(preset, `${key} missing label`).toHaveProperty('label')
    }
  })

  it('colour values are hex strings', () => {
    for (const preset of Object.values(THEME_PRESETS)) {
      expect(preset.primary).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
