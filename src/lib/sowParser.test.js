import { normaliseFields, extractExampleText } from './sowParser.js'

describe('normaliseFields — method mapping', () => {
  const cases = [
    ['Agile Scrum', 'Agile Scrum'],
    ['scrum', 'Agile Scrum'],
    ['kanban', 'Agile Kanban'],
    ['Agile Kanban', 'Agile Kanban'],
    ['hybrid', 'Hybrid (Agile + Waterfall)'],
    ['waterfall', 'Waterfall / Phased'],
    ['phased delivery', 'Waterfall / Phased'],
    ['', 'Agile Scrum'],
    ['unknown', 'Agile Scrum'],
  ]

  it.each(cases)('"%s" → "%s"', (input, expected) => {
    expect(normaliseFields({ method: input, sprint: '2' }).method).toBe(expected)
  })
})

describe('normaliseFields — sprint mapping', () => {
  const cases = [
    ['1 week', '1 week'],
    ['2 weeks', '2 weeks'],
    ['3 weeks', '3 weeks'],
    ['4 weeks', '4 weeks'],
    ['2', '2 weeks'],
    ['sprint of 3 weeks', '3 weeks'],
    ['', '2 weeks'],
    ['unknown', '2 weeks'],
  ]

  it.each(cases)('"%s" → "%s"', (input, expected) => {
    expect(normaliseFields({ method: '', sprint: input }).sprint).toBe(expected)
  })
})

describe('normaliseFields — pass-through fields', () => {
  it('preserves all other fields unchanged', () => {
    const input = { method: 'scrum', sprint: '2', pname: 'My Project', cname: 'ACME', scope: 'Build a thing' }
    const result = normaliseFields(input)
    expect(result.pname).toBe('My Project')
    expect(result.cname).toBe('ACME')
    expect(result.scope).toBe('Build a thing')
  })
})

describe('extractExampleText', () => {
  it('throws for unsupported file types', async () => {
    const file = { name: 'report.pdf' }
    await expect(extractExampleText(file)).rejects.toThrow('Unsupported type .pdf')
  })
})
