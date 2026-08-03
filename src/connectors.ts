export type PilotChannel = 'slack' | 'gmail' | 'whatsapp'
export type MessageRole = 'client' | 'team' | 'unknown'

export type ConnectorMessage = {
  id?: string
  text: string
  source: string
  author?: string
  role?: MessageRole
}

export function detectPilotChannel(name: string, content: string): PilotChannel | undefined {
  const lowerName = name.toLowerCase()
  if (/slack/.test(lowerName)) return 'slack'
  if (/whatsapp/.test(lowerName)) return 'whatsapp'
  if (/\.eml$|gmail|email|inbox|takeout|mbox/.test(lowerName) || /^(from|subject|date):/im.test(content)) return 'gmail'
  if (/^\[?\d{1,4}[./-]\d{1,2}[./-]\d{1,4},\s+\d{1,2}:\d{2}/m.test(content)) return 'whatsapp'
  return undefined
}

export function parsePilotExport(channel: PilotChannel, name: string, content: string): ConnectorMessage[] {
  if (channel === 'slack') return parseSlack(name, content)
  if (channel === 'gmail') return parseEmail(name, content)
  return parseWhatsApp(name, content)
}

function parseSlack(name: string, content: string): ConnectorMessage[] {
  const jsonMessages = parseJsonMessages(name, content)
  if (jsonMessages.length) return jsonMessages

  const linePattern = /^\s*(?:\[)?(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}[^|]*)\|\s*([^|]+)\|\s*(.+)$/
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const structured = lines.flatMap((line, index) => {
    const match = line.match(linePattern)
    if (!match) return []
    return [{
      id: stableHash(`${match[1]}|${match[2]}|${match[3]}|${index}`),
      text: match[3].trim(),
      source: `${formatSourceName(name)} · ${match[1].trim()}`,
      author: match[2].trim(),
      role: inferMessageRole(match[2]),
    }]
  })
  if (structured.length) return structured

  return lines.map((text, index) => ({
    id: stableHash(`${text}|${index}`),
    text,
    source: `${formatSourceName(name)} · message ${index + 1}`,
  }))
}

function parseJsonMessages(name: string, content: string): ConnectorMessage[] {
  try {
    const parsed: unknown = JSON.parse(content)
    const entries = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.messages) ? parsed.messages : []
    const occurrences = new Map<string, number>()
    return entries.flatMap((entry, index) => {
      if (typeof entry === 'string' && entry.trim()) {
        const key = entry.trim()
        return [{ id: stableMessageId(key, occurrences), text: key, source: `${formatSourceName(name)} · message ${index + 1}` }]
      }
      if (!isRecord(entry)) return []
      const text = firstText(entry, ['text', 'message', 'body', 'content'])
      if (!text) return []
      const channel = firstText(entry, ['channel', 'source', 'type'])
      const date = firstText(entry, ['date', 'ts', 'timestamp'])
      const author = firstText(entry, ['user', 'author', 'sender', 'from', 'name'])
      const explicitId = firstText(entry, ['id', 'message_id', 'messageId'])
      const id = explicitId || stableMessageId(`${text}|${channel ?? ''}|${date ?? ''}`, occurrences)
      return [{
        id,
        text,
        source: [channel, date].filter(Boolean).join(' · ') || `${formatSourceName(name)} · message ${index + 1}`,
        author,
        role: inferMessageRole(author),
      }]
    })
  } catch {
    return []
  }
}

function parseEmail(name: string, content: string): ConnectorMessage[] {
  const { headers, body } = splitMimePart(content)
  const subject = headers.subject
  const date = headers.date
  const author = headers.from
  const text = selectEmailText(headers['content-type'], headers['content-transfer-encoding'], body)
  if (!text) return []

  const boundary = headers['content-type']?.match(/boundary\s*=\s*"?([^";]+)"?/i)?.[1]
  if (boundary) {
    const parts = content.split(`--${boundary}`).map((part) => splitMimePart(part.replace(/^\s*\n/, '')))
    const preferred = parts.find((part) => /^text\/plain/i.test(part.headers['content-type'] ?? ''))
      ?? parts.find((part) => /^text\/html/i.test(part.headers['content-type'] ?? ''))
    if (preferred) {
      const preferredText = selectEmailText(preferred.headers['content-type'], preferred.headers['content-transfer-encoding'], preferred.body)
      if (preferredText) return [emailMessage(name, subject, date, author, preferredText)]
    }
  }

  return [emailMessage(name, subject, date, author, text)]
}

function emailMessage(name: string, subject: string | undefined, date: string | undefined, author: string | undefined, body: string): ConnectorMessage {
  const text = [subject, body].filter(Boolean).join(': ').trim()
  return {
    id: stableHash(`${subject ?? ''}|${date ?? ''}|${body}`),
    text,
    source: [formatSourceName(name), date].filter(Boolean).join(' · '),
    author,
    role: inferMessageRole(author),
  }
}

function parseWhatsApp(name: string, content: string): ConnectorMessage[] {
  const messages: ConnectorMessage[] = []
  const messageStart = /^(?:\[)?\d{1,4}[./-]\d{1,4}[./-]\d{1,4},\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?(?:\])?\s*(?:[-–]\s*)?([^:]+):\s*(.*)$/i
  let current: ConnectorMessage | undefined

  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const match = line.match(messageStart)
    if (match) {
      if (current?.text) messages.push(current)
      current = {
        id: stableHash(`${match[1]}|${match[2]}|${index}`),
        text: match[2].trim(),
        source: `${formatSourceName(name)} · ${match[1].trim()}`,
        author: match[1].trim(),
        role: inferMessageRole(match[1]),
      }
    } else if (current && line.trim()) {
      current.text = `${current.text}\n${line.trim()}`.trim()
    }
  }

  if (current?.text) messages.push(current)
  if (messages.length) return messages

  return content.split(/\n\s*\n|\r?\n/).map((text, index) => text.trim()).filter(Boolean).map((text, index) => ({
    id: stableHash(`${text}|${index}`),
    text,
    source: `${formatSourceName(name)} · message ${index + 1}`,
  }))
}

function splitMimePart(content: string): { headers: Record<string, string>; body: string } {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const headerLines: string[] = []
  let bodyStart = lines.findIndex((line) => line.trim() === '')
  if (bodyStart < 0) bodyStart = lines.length
  for (const line of lines.slice(0, bodyStart)) {
    if (/^[ \t]/.test(line) && headerLines.length) headerLines[headerLines.length - 1] += line.trim()
    else headerLines.push(line)
  }
  const headers: Record<string, string> = {}
  for (const line of headerLines) {
    const separator = line.indexOf(':')
    if (separator <= 0) continue
    headers[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim()
  }
  return { headers, body: lines.slice(bodyStart + 1).join('\n').trim() }
}

function selectEmailText(contentType: string | undefined, transferEncoding: string | undefined, body: string): string {
  const decoded = decodeTransferEncoding(body, transferEncoding)
  if (/^text\/html/i.test(contentType ?? '')) return stripHtml(decoded)
  return decoded.trim()
}

function decodeTransferEncoding(value: string, encoding: string | undefined): string {
  if (/quoted-printable/i.test(encoding ?? '')) {
    const bytes: number[] = []
    const normalized = value.replace(/=\r?\n/g, '')
    for (let index = 0; index < normalized.length; index += 1) {
      if (normalized[index] === '=' && /^[0-9A-F]{2}$/i.test(normalized.slice(index + 1, index + 3))) {
        bytes.push(Number.parseInt(normalized.slice(index + 1, index + 3), 16))
        index += 2
      } else {
        bytes.push(normalized.charCodeAt(index))
      }
    }
    try {
      return new TextDecoder('utf-8').decode(Uint8Array.from(bytes))
    } catch {
      return String.fromCharCode(...bytes)
    }
  }
  if (/base64/i.test(encoding ?? '')) {
    try {
      const binary = globalThis.atob(value.replace(/\s+/g, ''))
      return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))
    } catch {
      return value
    }
  }
  return value
}

function stripHtml(value: string): string {
  return value.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim()
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

function inferMessageRole(author: string | undefined): MessageRole {
  const value = author?.toLowerCase() ?? ''
  if (!value) return 'unknown'
  if (/client|customer|buyer|prospect/.test(value)) return 'client'
  if (/studio|agency|team|owner|designer|developer|manager|account/.test(value)) return 'team'
  return 'unknown'
}

function stableMessageId(value: string, occurrences: Map<string, number>): string {
  const occurrence = occurrences.get(value) ?? 0
  occurrences.set(value, occurrence + 1)
  return stableHash(`${value}|${occurrence}`)
}

function stableHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function formatSourceName(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
