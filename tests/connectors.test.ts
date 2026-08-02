import { describe, expect, it } from 'vitest'
import { analyzeSources, demoSources } from '../src/analysis'
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

    expect(messages).toEqual([
      { text: 'Can we add a dashboard?', source: '#launch · 2026-08-02' },
    ])
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
  })
})
