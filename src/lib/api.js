export async function callClaude({ apiKey, model, maxTokens, system, user }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens || 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  return data.content.map(b => b.text || '').join('')
}

export async function callClaudeJSON(opts) {
  const text = await callClaude({ ...opts, system: (opts.system || '') + '\n\nOutput ONLY valid JSON. No markdown fences, no prose, no explanation.' })
  return JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim())
}
