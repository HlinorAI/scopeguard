export type PilotChannel = 'slack' | 'gmail' | 'whatsapp'

export type ConnectorMessage = {
  text: string
  source: string
}

export function detectPilotChannel(name: string, content: string): PilotChannel | undefined {
  const lowerName = name.toLowerCase()
  if (/slack/.test(lowerName)) return 'slack'
  if (/whatsapp/.test(lowerName)) return 'whatsapp'
  if (/gmail|email|inbox|takeout|mbox/.test(lowerName) || /^(from|subject|date):/im.test(content)) return 'gmail'
  if (/^\[?\d{1,4}[./-]\d{1,2}[./-]\d{1,4},\s+\d{1,2}:\d{2}/m.test(content)) return 'whatsapp'
  return undefined
}

export function parsePilotExport(channel: PilotChannel, name: string, content: string): ConnectorMessage[] {
  if (channel === 'slack') return parseJsonMessages(name, content)
  if (channel === 'gmail') return parseEmail(name, content)
  return parseWhatsApp(name, content)
}

function parseJsonMessages(name: string, content: string): ConnectorMessage[] {
  try {
    const parsed: unknown = JSON.parse(content)
    const entries = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.messages) ? parsed.messages : []
    return entries.flatMap((entry, index) => {
      if (typeof entry === 'string') return [{ text: entry.trim(), source: `${formatSourceName(name)} · message ${index + 1}` }]
      if (!isRecord(entry)) return []
      const text = firstText(entry, ['text', 'message', 'body', 'content'])
      if (!text) return []
      const channel = firstText(entry, ['channel', 'source', 'type'])
      const date = firstText(entry, ['date', 'ts', 'timestamp'])
      return [{ text, source: [channel, date].filter(Boolean).join(' · ') || `${formatSourceName(name)} · message ${index + 1}` }]
    })
  } catch {
    return []
  }
}

function parseEmail(name: string, content: string): ConnectorMessage[] {
  const lines = content.split(/\r?\n/)
  const subject = lines.find((line) => /^subject:/i.test(line))?.replace(/^subject:\s*/i, '').trim()
  const date = lines.find((line) => /^date:/i.test(line))?.replace(/^date:\s*/i, '').trim()
  const bodyStart = lines.findIndex((line) => line.trim() === '')
  const body = lines.slice(bodyStart + 1).join('\n').trim()
  if (!body) return []
  return [{ text: subject ? `${subject}: ${body}` : body, source: [formatSourceName(name), date].filter(Boolean).join(' · ') }]
}

function parseWhatsApp(name: string, content: string): ConnectorMessage[] {
  const messages: ConnectorMessage[] = []
  const messageStart = /^(?:\[)?\d{1,4}[./-]\d{1,2}[./-]\d{1,4},\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?(?:\])?\s*(?:-\s*)?([^:]+):\s*(.*)$/i
  let current: ConnectorMessage | undefined

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(messageStart)
    if (match) {
      if (current?.text) messages.push(current)
      current = { text: match[2].trim(), source: `${formatSourceName(name)} · ${match[1].trim()}` }
    } else if (current && line.trim()) {
      current.text = `${current.text}\n${line.trim()}`.trim()
    }
  }

  if (current?.text) messages.push(current)
  if (messages.length) return messages

  return content.split(/\n\s*\n|\r?\n/).map((text, index) => text.trim()).filter(Boolean).map((text, index) => ({
    text,
    source: `${formatSourceName(name)} · message ${index + 1}`,
  }))
}

function firstText(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (Array.isArray(value)) {
      const text = value.map((part) => {
        if (typeof part === 'string') return part
        if (isRecord(part) && typeof part.text === 'string') return part.text
        return ''
      }).join('').trim()
      if (text) return text
    }
  }
  return undefined
}

function formatSourceName(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
