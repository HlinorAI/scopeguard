export type SourceKind = 'scope' | 'messages' | 'unknown'
export type SourceFormat = 'txt' | 'md' | 'eml' | 'json' | 'pdf' | 'docx' | 'unknown'

export type SourceDocument = {
  id: string
  name: string
  kind: SourceKind
  format: SourceFormat
  content: string
}

export type Finding = {
  id: string
  type: string
  title: string
  excerpt: string
  source: string
  scope: string
  hours: string
  confidence: number
  severity: 'high' | 'medium' | 'low'
  reviewed: boolean
}

export type AnalysisResult = {
  findings: Finding[]
  scopeItemsCount: number
  messagesCompared: number
  scopeCoverage: number
  hoursAtRisk: string
  unsupportedSources: string[]
}

type ScopeItem = {
  id: string
  section: string
  text: string
  excluded: boolean
}

type MessageRecord = {
  id: string
  text: string
  source: string
}

type Rule = {
  type: string
  pattern: RegExp
  title: (text: string) => string
  severity: Finding['severity']
  confidence: number
  minHours: number
  maxHours: number
  scopeTerms: string[]
}

const rules: Rule[] = [
  {
    type: 'NEW DELIVERABLE',
    pattern: /dashboard|partner portal|mobile app|new page|additional integration|new integration/i,
    title: (text) => `${extractSubject(text)} is not in the agreed scope`,
    severity: 'high',
    confidence: 94,
    minHours: 32,
    maxHours: 40,
    scopeTerms: ['dashboard', 'partner', 'marketing site', 'integration'],
  },
  {
    type: 'ACCEPTANCE CRITERIA',
    pattern: /real[- ]?time|instantly|without (refreshing|reloading)|pixel[- ]perfect|live updates/i,
    title: (text) => `${extractSubject(text)} changes the delivery expectation`,
    severity: 'medium',
    confidence: 82,
    minHours: 8,
    maxHours: 12,
    scopeTerms: ['status', 'sync', 'acceptance', 'criteria'],
  },
  {
    type: 'EXTRA REVISION',
    pattern: /one more pass|one last pass|another revision|fourth revision|additional revision|extra round/i,
    title: () => 'An additional revision round was requested',
    severity: 'high',
    confidence: 98,
    minHours: 4,
    maxHours: 6,
    scopeTerms: ['revision', 'round'],
  },
  {
    type: 'UNPRICED COMMITMENT',
    pattern: /\b(we will|we'll|we can|make sure|add)\b/i,
    title: () => 'A delivery commitment appears without a matching price',
    severity: 'medium',
    confidence: 71,
    minHours: 6,
    maxHours: 10,
    scopeTerms: ['analytics', 'tracking', 'commitment', 'price'],
  },
]

export const demoSources: SourceDocument[] = [
  {
    id: 'demo-sow',
    name: 'Acme_SOW_v3.txt',
    kind: 'scope',
    format: 'txt',
    content: `# Acme launch site

## SOW §2.1 — Public marketing site
- Public marketing site
- Responsive desktop and mobile layouts

## SOW §3.2 — Daily status sync
- Daily status sync

## SOW §4.4 — Two revision rounds
- Two revision rounds

## SOW §2.2 — Excluded work
- No partner dashboard
- No analytics implementation`,
  },
  {
    id: 'demo-messages',
    name: 'acme-slack-export.json',
    kind: 'messages',
    format: 'json',
    content: JSON.stringify([
      { channel: '#acme-launch', user: 'Alex', date: '14 May, 10:42', text: 'Can we also add a lightweight dashboard for partners before launch?' },
      { channel: 'Email', user: 'Alex', date: '13 May, 16:08', text: 'The status should update instantly without refreshing the page.' },
      { channel: '#acme-launch', user: 'Alex', date: '12 May, 09:17', text: 'One last pass on the headline and hero direction, then we are done.' },
      { channel: 'Email', user: 'Studio', date: '09 May, 11:24', text: 'We will make sure the new funnel is tracked end to end.' },
    ]),
  },
]

export async function parseSourceFile(file: File): Promise<SourceDocument> {
  const format = getFormat(file.name)

  if (format === 'pdf' || format === 'docx') {
    throw new Error(`${file.name}: PDF/DOCX extraction is the next adapter; use TXT, MD, EML or JSON for now.`)
  }

  const content = await file.text()
  return {
    id: `${file.name}-${file.lastModified}-${file.size}`,
    name: file.name,
    kind: inferKind(file.name, content),
    format,
    content,
  }
}

export function analyzeSources(sources: SourceDocument[]): AnalysisResult {
  const scopeSources = sources.filter((source) => source.kind === 'scope')
  const messageSources = sources.filter((source) => source.kind === 'messages')
  const scopeItems = scopeSources.flatMap((source) => extractScopeItems(source.content))
  const messages = messageSources.flatMap((source) => extractMessages(source))
  const findings = messages.flatMap((message, index) => createFindings(message, index, scopeItems))
  const totalMin = findings.reduce((sum, finding) => sum + parseHours(finding.hours)[0], 0)
  const totalMax = findings.reduce((sum, finding) => sum + parseHours(finding.hours)[1], 0)
  const coverage = scopeItems.length === 0 ? 0 : Math.min(100, Math.round((messages.length / scopeItems.length) * 100))

  return {
    findings,
    scopeItemsCount: scopeItems.length,
    messagesCompared: messages.length,
    scopeCoverage: coverage,
    hoursAtRisk: findings.length ? `${totalMin}–${totalMax}h` : '0h',
    unsupportedSources: sources.filter((source) => source.kind === 'unknown').map((source) => source.name),
  }
}

function inferKind(name: string, content: string): SourceKind {
  const lowerName = name.toLowerCase()
  if (/slack|email|message|thread|chat|linear|jira/.test(lowerName)) return 'messages'
  if (/(^|[-_.])(sow|scope|contract|agreement|brief|proposal)([-_.]|$)/.test(lowerName)) return 'scope'
  if (content.match(/(^|\n)##?\s*(included|excluded|scope|deliverables)/i)) return 'scope'
  if (content.match(/(^|\n)\s*(from|subject|date):/i)) return 'messages'
  return 'unknown'
}

function getFormat(name: string): SourceFormat {
  const extension = name.toLowerCase().split('.').pop()
  if (extension === 'txt') return 'txt'
  if (extension === 'md') return 'md'
  if (extension === 'eml') return 'eml'
  if (extension === 'json') return 'json'
  if (extension === 'pdf') return 'pdf'
  if (extension === 'docx') return 'docx'
  return 'unknown'
}

function extractScopeItems(content: string): ScopeItem[] {
  let currentSection = 'Scope'
  let itemNumber = 0

  return content.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim()
    if (!trimmed) return []
    const heading = trimmed.match(/^#{1,6}\s*(.+)$/)
    if (heading) {
      currentSection = heading[1].trim()
      return []
    }
    const bullet = trimmed.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/)
    if (!bullet || bullet[1].length < 5) return []
    itemNumber += 1
    return [{
      id: `scope-${itemNumber}`,
      section: currentSection,
      text: bullet[1].trim(),
      excluded: /excluded|no |not included|out of scope/i.test(currentSection) || /^(no |not included|excluded)/i.test(bullet[1]),
    }]
  })
}

function extractMessages(source: SourceDocument): MessageRecord[] {
  if (source.format === 'json') return parseJsonMessages(source)
  if (source.format === 'eml') return parseEmail(source)

  return source.content.split(/\n\s*\n|\r?\n/).map((text, index) => text.trim()).filter(Boolean).map((text, index) => ({
    id: `${source.id}-${index}`,
    text,
    source: `${formatSourceName(source.name)} · message ${index + 1}`,
  }))
}

function parseJsonMessages(source: SourceDocument): MessageRecord[] {
  try {
    const parsed: unknown = JSON.parse(source.content)
    const entries = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.messages) ? parsed.messages : []
    return entries.flatMap((entry, index) => {
      if (typeof entry === 'string') return [{ id: `${source.id}-${index}`, text: entry, source: `${formatSourceName(source.name)} · message ${index + 1}` }]
      if (!isRecord(entry)) return []
      const text = firstString(entry, ['text', 'message', 'body', 'content'])
      if (!text) return []
      const channel = firstString(entry, ['channel', 'source', 'type'])
      const date = firstString(entry, ['date', 'ts', 'timestamp'])
      return [{ id: `${source.id}-${index}`, text, source: [channel, date].filter(Boolean).join(' · ') || `${formatSourceName(source.name)} · message ${index + 1}` }]
    })
  } catch {
    return []
  }
}

function parseEmail(source: SourceDocument): MessageRecord[] {
  const lines = source.content.split(/\r?\n/)
  const subject = lines.find((line) => /^subject:/i.test(line))?.replace(/^subject:\s*/i, '').trim()
  const date = lines.find((line) => /^date:/i.test(line))?.replace(/^date:\s*/i, '').trim()
  const bodyStart = lines.findIndex((line) => line.trim() === '')
  const body = lines.slice(bodyStart + 1).join('\n').trim()
  return body ? [{ id: source.id, text: subject ? `${subject}: ${body}` : body, source: [formatSourceName(source.name), date].filter(Boolean).join(' · ') }] : []
}

function createFindings(message: MessageRecord, index: number, scopeItems: ScopeItem[]): Finding[] {
  const rule = rules.find((candidate) => candidate.pattern.test(message.text))
  if (!rule) return []
  const scope = findScopeBasis(rule, message.text, scopeItems)
  return [{
    id: `SG-${String(14 - index).padStart(3, '0')}`,
    type: rule.type,
    title: rule.title(message.text),
    excerpt: `“${message.text}”`,
    source: message.source,
    scope,
    hours: `${rule.minHours}–${rule.maxHours}h`,
    confidence: rule.confidence,
    severity: rule.severity,
    reviewed: false,
  }]
}

function findScopeBasis(rule: Rule, text: string, scopeItems: ScopeItem[]): string {
  const terms = [...rule.scopeTerms, ...text.toLowerCase().split(/\W+/).filter((word) => word.length > 5)]
  const match = scopeItems.find((item) => terms.some((term) => item.text.toLowerCase().includes(term)))
  return match ? `${match.section} · ${match.text}` : 'No matching clause found'
}

function extractSubject(text: string): string {
  const subject = text.match(/(?:add|for|about)\s+(?:a\s+|an\s+|the\s+)?([^?.!]+?)(?:\s+before|\s+without|\s+for\s+partners|$)/i)?.[1]
  const cleaned = subject ? subject.trim().replace(/^lightweight\s+/i, '').replace(/\s+$/, '') : 'This request'
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function formatSourceName(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

function firstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (typeof record[key] === 'string' && record[key].trim()) return record[key].trim()
  }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseHours(value: string): [number, number] {
  const matches = value.match(/(\d+)–(\d+)/)
  return matches ? [Number(matches[1]), Number(matches[2])] : [0, 0]
}
