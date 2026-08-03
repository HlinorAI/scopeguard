import { describe, expect, it } from 'vitest'
import { analyzeSources, demoSources, parseSourceFile, validateSources } from '../src/analysis'
import { detectPilotChannel, parsePilotExport } from '../src/connectors'

describe('pilot channel adapters', () => {
  it('detects Slack, Gmail and WhatsApp exports', () => {
    expect(detectPilotChannel('slack-export.json', '[]')).toBe('slack')
    expect(detectPilotChannel('gmail-message.eml', 'From: client@example.com\nSubject: Scope\n')).toBe('gmail')
    expect(detectPilotChannel('WhatsApp Chat.txt', '[02.08.26, 10:02:11] Client: hello')).toBe('whatsapp')
  })

  it('normalizes Slack JSON messages', () => {
    const messages = parsePilotExport('slack', 'slack-export.json', JSON.stringify([
      { channel: '#launch', user: 'Client', date: '2026-08-02', text: 'Can we add a dashboard?' },
    ]))

    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      text: 'Can we add a dashboard?',
      source: '#launch · 2026-08-02',
      author: 'Client',
      role: 'client',
    })
    expect(messages[0]?.id).toBeTruthy()
  })

  it('normalizes Gmail EML content', () => {
    const messages = parsePilotExport('gmail', 'gmail-message.eml', [
      'From: client@example.com',
      'Subject: New request',
      'Date: Sun, 02 Aug 2026 10:00:00 +0000',
      '',
      'Can we add a partner dashboard?',
    ].join('\n'))

    expect(messages[0]?.text).toBe('New request: Can we add a partner dashboard?')
    expect(messages[0]?.source).toContain('gmail-message · Sun, 02 Aug 2026')
  })

  it('normalizes WhatsApp messages and multiline content', () => {
    const messages = parsePilotExport('whatsapp', 'WhatsApp Chat.txt', [
      '[02.08.26, 10:02:11] Client: One last pass on the headline.',
      'Please also check the mobile layout.',
      '[02.08.26, 10:04:00] Studio: We will review it today.',
    ].join('\n'))

    expect(messages).toHaveLength(2)
    expect(messages[0]?.text).toContain('Please also check the mobile layout.')
    expect(messages[1]?.source).toContain('Studio')
  })

  it('falls back to a plain-text Slack export', () => {
    const messages = parsePilotExport('slack', 'slack-export.txt', [
      '2026-08-02 10:02 | Client | Can we add a dashboard?',
      '2026-08-02 10:04 | Studio | We will review it today.',
    ].join('\n'))

    expect(messages).toHaveLength(2)
    expect(messages[0]).toMatchObject({ text: 'Can we add a dashboard?', author: 'Client', role: 'client' })
  })

  it('decodes a simple multipart email and keeps the sender', () => {
    const messages = parsePilotExport('gmail', 'gmail-message.eml', [
      'From: client@example.com',
      'Subject: New request',
      'Date: Sun, 02 Aug 2026 10:00:00 +0000',
      'Content-Type: multipart/alternative; boundary="pilot-boundary"',
      '',
      '--pilot-boundary',
      'Content-Type: text/plain',
      '',
      'Can we add a partner dashboard?',
      '--pilot-boundary--',
    ].join('\n'))

    expect(messages[0]).toMatchObject({
      text: 'New request: Can we add a partner dashboard?',
      author: 'client@example.com',
      role: 'client',
    })
  })
})

describe('scope analysis', () => {
  it('produces the four findings in the demo fixture', () => {
    const result = analyzeSources(demoSources)

    expect(result.findings).toHaveLength(4)
    expect(result.findings.map((finding) => finding.type)).toEqual([
      'NEW DELIVERABLE',
      'ACCEPTANCE CRITERIA',
      'EXTRA REVISION',
      'UNPRICED COMMITMENT',
    ])
    expect(result.findings[0]?.scopeMatch).toBe('excluded')
    expect(result.scopeCoverage).toBe(100)
  })

  it('suppresses a new deliverable already covered by an included clause', () => {
    const sources = [
      { ...demoSources[0], content: '# Scope\n## Included\n- Partner dashboard' },
      { ...demoSources[1], content: JSON.stringify([{ user: 'Client', text: 'Can we add a partner dashboard?' }]) },
    ]

    expect(analyzeSources(sources).findings).toHaveLength(0)
  })

  it('does not create a finding for a negated request', () => {
    const sources = [
      demoSources[0],
      { ...demoSources[1], content: JSON.stringify([{ user: 'Client', text: 'We are not going to build a dashboard; it is out of scope.' }]) },
    ]

    expect(analyzeSources(sources).findings).toHaveLength(0)
  })

  it('does not invent a scope clause for an unrelated signal', () => {
    const sources = [
      { ...demoSources[0], content: '# Scope\n## Included\n- Public marketing site' },
      { ...demoSources[1], content: JSON.stringify([{ user: 'Client', text: 'Can we add a mobile app?' }]) },
    ]
    const finding = analyzeSources(sources).findings[0]

    expect(finding?.scopeMatch).toBe('none')
    expect(finding?.scope).toBe('No matching clause found')
  })

  it('keeps finding IDs stable when an earlier message is added', () => {
    const scope = demoSources[0]
    const originalMessages = { ...demoSources[1], content: JSON.stringify([{ id: 'message-1', user: 'Client', text: 'Can we add a partner dashboard?' }]) }
    const withEarlierMessage = { ...demoSources[1], content: JSON.stringify([{ id: 'message-0', user: 'Client', text: 'Thanks for the update.' }, { id: 'message-1', user: 'Client', text: 'Can we add a partner dashboard?' }]) }
    const original = analyzeSources([scope, originalMessages]).findings[0]
    const shifted = analyzeSources([scope, withEarlierMessage]).findings.find((finding) => finding.excerpt.includes('partner dashboard'))

    expect(original?.id).toBe(shifted?.id)
  })

  it('requires one scope and one communication source before analysis', () => {
    const validation = validateSources([demoSources[0]])

    expect(validation.errors).toContain('Add at least one communication export from Slack, email or WhatsApp.')
  })

  it('accepts a prose initial order email as the scope source', () => {
    const sources = [
      {
        id: 'initial-order',
        name: 'initial-order.eml',
        kind: 'scope' as const,
        format: 'eml' as const,
        content: [
          'From: client@example.com',
          'Subject: Website order',
          '',
          'We need a public marketing site with a responsive mobile layout.',
        ].join('\n'),
      },
      {
        ...demoSources[1],
        content: JSON.stringify([{ user: 'Client', text: 'Can we add a partner dashboard?' }]),
      },
    ]

    expect(validateSources(sources).errors).toEqual([])
    expect(analyzeSources(sources).scopeItemsCount).toBe(1)
  })

  it('classifies an initial order filename as a scope candidate', async () => {
    const source = await parseSourceFile(new File([
      'From: client@example.com\nSubject: Website order\n\nWe need a public marketing site.',
    ], 'initial-order.eml'))

    expect(source.kind).toBe('scope')
  })

  it('classifies a structured conversation text export as messages', async () => {
    const source = await parseSourceFile(new File([
      '2026-08-03 10:00 | Client | Can we add a dashboard?',
    ], 'conversation.txt'))

    expect(source.kind).toBe('messages')
  })

  it('classifies and reads an RTF order export as a scope source', async () => {
    const source = await parseSourceFile(new File([
      '{\\rtf1\\ansi\\uc0 This is a new order\\par Product: Trail rack\\par Quantity: 1\\par Total cost: 100 CAD}',
    ], '2607-22.md'))

    expect(source.kind).toBe('scope')
    expect(analyzeSources([source, demoSources[1]]).scopeItemsCount).toBeGreaterThan(0)
  })

  it('keeps a cancellation reply email in communications', async () => {
    const source = await parseSourceFile(new File([
      'From: seller@example.com\nSubject: RE: order cancellation\nDate: Sun, 02 Aug 2026\n\nThe order will not proceed. The quoted history mentions a shipping cost and total cost.',
    ], 'RE_order_cancellation.eml'))

    expect(source.kind).toBe('messages')
  })
})
