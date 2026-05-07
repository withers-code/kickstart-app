import { callClaude, callClaudeJSON } from './api.js'

const mockFetch = vi.fn()
global.fetch = mockFetch

function mockOk(body) {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(body) })
}
function mockFail(message, status = 400) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, json: () => Promise.resolve({ error: { message } }) })
}

beforeEach(() => mockFetch.mockReset())

describe('callClaude', () => {
  it('concatenates text blocks from the response', async () => {
    mockOk({ content: [{ text: 'hello' }, { text: ' world' }] })
    const result = await callClaude({ apiKey: 'k', model: 'm', maxTokens: 10, system: '', user: '' })
    expect(result).toBe('hello world')
  })

  it('throws with the API error message on failure', async () => {
    mockFail('Invalid API key')
    await expect(callClaude({ apiKey: 'bad', model: 'm', maxTokens: 10, system: '', user: '' }))
      .rejects.toThrow('Invalid API key')
  })

  it('falls back to a generic error when no message is returned', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) })
    await expect(callClaude({ apiKey: 'k', model: 'm', maxTokens: 10, system: '', user: '' }))
      .rejects.toThrow('API error 500')
  })

  it('sends the API key and anthropic-version headers', async () => {
    mockOk({ content: [{ text: '' }] })
    await callClaude({ apiKey: 'test-key', model: 'm', maxTokens: 10, system: '', user: '' })
    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['x-api-key']).toBe('test-key')
    expect(headers['anthropic-version']).toBe('2023-06-01')
  })
})

describe('callClaudeJSON', () => {
  it('parses a plain JSON response', async () => {
    mockOk({ content: [{ text: '{"a":1}' }] })
    const result = await callClaudeJSON({ apiKey: 'k', model: 'm', maxTokens: 10, system: '', user: '' })
    expect(result).toEqual({ a: 1 })
  })

  it('strips ` ```json ` markdown fences before parsing', async () => {
    mockOk({ content: [{ text: '```json\n{"b":2}\n```' }] })
    const result = await callClaudeJSON({ apiKey: 'k', model: 'm', maxTokens: 10, system: '', user: '' })
    expect(result).toEqual({ b: 2 })
  })

  it('strips plain ` ``` ` fences before parsing', async () => {
    mockOk({ content: [{ text: '```\n{"c":3}\n```' }] })
    const result = await callClaudeJSON({ apiKey: 'k', model: 'm', maxTokens: 10, system: '', user: '' })
    expect(result).toEqual({ c: 3 })
  })
})
