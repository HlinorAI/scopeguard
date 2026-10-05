import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { analyzeSources, validateSources, type SourceDocument } from '../src/analysis'
import { buildReviewReport } from '../src/report'

// Test-only export projection; the production intake adapter lives in Operator.
const events = JSON.parse(readFileSync(new URL('../examples/mail-hub/communication-events.json', import.meta.url), 'utf8')) as {
  event_id: string; text: string; sender: string; timestamp: string; direction: string
}[]
const scope: SourceDocument = {
  id: 'agreement_example', name: 'agreement.md', kind: 'scope', format: 'md',
  content: readFileSync(new URL('../examples/mail-hub/agreement.md', import.meta.url), 'utf8'),
}
function exportedMessages(items = events): SourceDocument {
  return { id: 'mail_hub_export', name: 'mail-hub-events.json', kind: 'messages', format: 'json', channel: 'slack',
    // Existing generic JSON message parser is reached through the slack channel.
    // This does not claim the browser has a mail_hub channel or network connector.
    content: JSON.stringify(items.map(e => ({ id: e.event_id, text: e.text, user: e.sender,
      channel: 'mail_hub', timestamp: e.timestamp }))) }
}

describe('Mail Hub reference export through the existing public analyzer', () => {
  it('finds an excluded deliverable and exports evidence for human review', () => {
    const sources = [scope, exportedMessages()]
    expect(validateSources(sources).errors).toEqual([])
    const result = analyzeSources(sources)
    expect(result.messagesCompared).toBe(1)
    expect(result.findings).toHaveLength(1)
    const finding = result.findings[0]!
    expect(finding).toMatchObject({ category: 'scope_drift', type: 'NEW DELIVERABLE',
      scopeMatch: 'excluded', decision: 'pending', reviewed: false })
    expect(finding.excerpt).toContain('dashboard')
    expect(finding.scope).toContain('No partner dashboard')
    expect(finding.source).toContain('mail_hub')
    const report = buildReviewReport('Example launch site', sources, result, result.findings)
    expect(report).toContain('dashboard')
    expect(report).toContain('No partner dashboard')
  })

  it('preserves finding identity on repeat export and suppresses an included deliverable', () => {
    const first = analyzeSources([scope, exportedMessages()])
    const replay = analyzeSources([scope, exportedMessages()])
    expect(replay).toEqual(first)
    const included = { ...scope, content: '# Scope\n## Included\n- Partner dashboard' }
    expect(analyzeSources([included, exportedMessages()]).findings).toHaveLength(0)
  })
})
