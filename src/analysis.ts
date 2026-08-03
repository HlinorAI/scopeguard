import { parse } from 'yaml'
import rulesText from './rules.yaml?raw'
import { detectPilotChannel, parsePilotExport } from './connectors'
import type { ConnectorMessage, MessageRole, PilotChannel } from './connectors'

export type SourceKind = 'scope' | 'messages' | 'unknown'
export type SourceFormat = 'txt' | 'md' | 'eml' | 'json' | 'pdf' | 'docx' | 'unknown'
export type ScopeMatch = 'included' | 'excluded' | 'ambiguous' | 'none'

export type SourceDocument = {
  id: string
  name: string
  kind: SourceKind
  format: SourceFormat
  content: string
  channel?: PilotChannel
}

export type Finding = {
  id: string
  type: string
  title: string
  excerpt: string
  source: string
  scope: string
  scopeMatch: ScopeMatch
  hours: string
  confidence: number
  severity: 'high' | 'medium' | 'low'
  reviewed: boolean
  decision: 'pending' | 'change_request' | 'in_scope'
}

export type AnalysisResult = {
  findings: Finding[]
  scopeItemsCount: number
  messagesCompared: number
  messagesWithScopeBasis: number
  scopeCoverage: number
  hoursAtRisk: string
  unsupportedSources: string[]
}

export type SourceValidation = {
  errors: string[]
  warnings: string[]
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
  author?: string
  role?: MessageRole
}

type RuleConfig = {
  id: string
  type: string
  pattern: string
  titleStyle: 'subject_not_in_scope' | 'changes_expectation' | 'extra_revision' | 'unpriced_commitment'
  severity: Finding['severity']
  confidence: number
  minHours: number
  maxHours: number
  scopeTerms: string[]
}

type Rule = Omit<RuleConfig, 'pattern'> & { pattern: RegExp }

export const MAX_SOURCE_BYTES = 10 * 1024 * 1024

const rules = loadRules(rulesText)

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
- No analytics implementation or funnel tracking`,
  },
  {
    id: 'demo-messages',
    name: 'acme-slack-export.json',
    kind: 'messages',
    format: 'json',
    channel: 'slack',
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

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`${file.name}: file is larger than 10 MB. Export a smaller date range for the pilot.`)
  }
  if (format === 'unknown') {
    throw new Error(`${file.name}: unsupported file type. Use TXT, MD, EML or JSON for the pilot.`)
  }
  if (format === 'pdf' || format === 'docx') {
    throw new Error(`${file.name}: PDF/DOCX extraction is not enabled yet; use TXT, MD, EML or JSON for now.`)
  }

  const content = await file.text()
  return {
    id: `${file.name}-${stableHash(content)}`,
    name: file.name,
    kind: inferKind(file.name, content),
    format,
    content,
    channel: detectPilotChannel(file.name, content),
  }
}

export function validateSources(sources: SourceDocument[]): SourceValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const scopeSources = sources.filter((source) => source.kind === 'scope')
  const messageSources = sources.filter((source) => source.kind === 'messages')
  const unknownSources = sources.filter((source) => source.kind === 'unknown')

  if (!scopeSources.length) errors.push('Add at least one scope source (SOW, contract, brief or initial order email). If the agreed scope is in an email, classify that source as Scope document in the source list.')
  if (!messageSources.length) errors.push('Add at least one communication export from Slack, email or WhatsApp.')
  if (unknownSources.length) warnings.push(`Unclassified sources will not be analysed: ${unknownSources.map((source) => source.name).join(', ')}.`)

  if (scopeSources.length && !scopeSources.some((source) => extractScopeItems(source.id, source.content).length)) {
    errors.push('The scope source has no readable deliverables. Use bullet points or a clear initial order email with the requested work.')
  }
  if (messageSources.length && !messageSources.some((source) => extractMessages(source).length)) {
    errors.push('The communication export has no readable messages. Check the export format or reclassify the source.')
  }

  return { errors, warnings }
}

export function analyzeSources(sources: SourceDocument[]): AnalysisResult {
  const scopeSources = sources.filter((source) => source.kind === 'scope')
  const messageSources = sources.filter((source) => source.kind === 'messages')
  const scopeItems = scopeSources.flatMap((source) => extractScopeItems(source.id, source.content))
  const messages = messageSources.flatMap((source) => extractMessages(source))
  const findings = messages.flatMap((message) => createFindings(message, scopeItems))
  const totalMin = findings.reduce((sum, finding) => sum + parseHours(finding.hours)[0], 0)
  const totalMax = findings.reduce((sum, finding) => sum + parseHours(finding.hours)[1], 0)
  const messagesWithScopeBasis = messages.filter((message) => rules.some((rule) => rule.pattern.test(message.text) && findScopeBasis(rule, message.text, scopeItems).status !== 'none')).length
  const coverage = messages.length === 0 ? 0 : Math.round((messagesWithScopeBasis / messages.length) * 100)

  return {
    findings,
    scopeItemsCount: scopeItems.length,
    messagesCompared: messages.length,
    messagesWithScopeBasis,
    scopeCoverage: coverage,
    hoursAtRisk: findings.length ? `${totalMin}–${totalMax}h` : '0h',
    unsupportedSources: sources.filter((source) => source.kind === 'unknown').map((source) => source.name),
  }
}

function inferKind(name: string, content: string): SourceKind {
  const lowerName = name.toLowerCase().replace(/\s+/g, '-')
  const normalizedContent = normalizeDocumentText(content)
  const replyOrCancellationNameSignal = /(^|[-_.])(re|reply|fwd|forward|thread|cancel|cancellation)([-_.]|$)/.test(lowerName)
  const scopeNameSignal = !replyOrCancellationNameSignal
    && /(^|[-_.])(sow|scope|contract|agreement|brief|proposal|order|request|intake|kickoff|requirements?)([-_.]|$)/.test(lowerName)
  const scopeContentSignal = !replyOrCancellationNameSignal && (
    /(^|\n)\s*#{1,6}\s*(included|excluded|scope|deliverables|assumptions|requirements)/im.test(normalizedContent)
      || /\b(new order|order number|shipping cost|total cost|deliverables?)\b/i.test(normalizedContent)
  )
  const messageNameSignal = /slack|email|message|messenger|telegram|whatsapp|facebook|meta|thread|chat|linear|jira/.test(lowerName)
  const messageContentSignal = looksLikeMessageExport(content)
    || /(^|\n)\s*(from|subject|date):/im.test(content)
    || /^\s*(?:\[)?\d{4}[-/.]\d{1,2}[-/.]\d{1,2}[^|]*\|\s*[^|]+\|\s*.+$/m.test(content)

  if (scopeNameSignal || scopeContentSignal) return 'scope'
  if (messageNameSignal || messageContentSignal || detectPilotChannel(name, content)) return 'messages'
  return 'unknown'
}

function looksLikeMessageExport(content: string): boolean {
  try {
    const parsed: unknown = JSON.parse(content)
    const entries = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.messages) ? parsed.messages : []
    return entries.some((entry) => isRecord(entry) && ['text', 'message', 'body', 'content'].some((key) => key in entry))
  } catch {
    return false
  }
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

function extractScopeItems(sourceId: string, content: string): ScopeItem[] {
  const normalizedContent = normalizeDocumentText(content)
  const richText = isRichTextDocument(content)
  let currentSection = 'Scope'
  const occurrences = new Map<string, number>()

  const bulletItems = normalizedContent.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim()
    if (!trimmed) return []
    const heading = trimmed.match(/^#{1,6}\s*(.+)$/)
    if (heading) {
      currentSection = heading[1].trim()
      return []
    }
    const bullet = trimmed.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/)
    if (!bullet || bullet[1].length < 5) return []
    const text = bullet[1].trim()
    const key = normalizeForMatching(text)
    const occurrence = occurrences.get(key) ?? 0
    occurrences.set(key, occurrence + 1)
    return [{
      id: `${sourceId}-scope-${stableHash(`${key}|${occurrence}`)}`,
      section: currentSection,
      text,
      excluded: /excluded|no |not included|out of scope/i.test(currentSection) || /^(no |not included|excluded)/i.test(text),
    }]
  })

  if (bulletItems.length) return bulletItems

  const proseLines = richText
    ? normalizedContent.split(/\r?\n/)
    : normalizedContent.replace(/\r\n/g, '\n').split(/\n\s*\n/).flatMap((block) => block.split(/(?<=[.!?])\s+(?=[A-Z0-9])/))

  return proseLines
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= (richText ? 5 : 16))
    .filter((line) => !/^(title|quantity|weight|cost)$/i.test(line))
    .filter((line) => !/^(from|to|cc|bcc|subject|date|reply-to|mime-version|content-type|content-transfer-encoding|message-id):/i.test(line))
    .filter((line) => !/^[-=]{3,}$/.test(line))
    .filter((line) => !/^>/.test(line))
    .filter((line) => !/^(hi|hello|dear|thanks|thank you|best|regards)[,!]?$/i.test(line))
    .filter((line) => !/@/.test(line))
    .map((text, index) => {
      const key = normalizeForMatching(text)
      const occurrence = occurrences.get(key) ?? 0
      occurrences.set(key, occurrence + 1)
      return {
        id: `${sourceId}-scope-${stableHash(`${key}|${occurrence}|prose`)}`,
        section: 'Initial order',
        text,
        excluded: /excluded|no |not included|out of scope/i.test(text),
      }
    })
}

function isRichTextDocument(content: string): boolean {
  return /^\s*\{\\rtf/i.test(content)
}

function normalizeDocumentText(content: string): string {
  if (!isRichTextDocument(content)) return content

  const destinationWords = new Set([
    'fonttbl', 'colortbl', 'stylesheet', 'info', 'generator', 'pict', 'object', 'filetbl',
    'header', 'footer', 'listtable', 'listoverridetable', 'themedata', 'xmlnstbl', 'datastore',
  ])
  const output: string[] = []
  const stack: boolean[] = []
  let skipGroup = false
  let unicodeFallback = 1
  let skipFallback = 0

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]
    if (character === '{') {
      stack.push(skipGroup)
      continue
    }
    if (character === '}') {
      skipGroup = stack.pop() ?? false
      continue
    }
    if (character !== '\\') {
      if (skipFallback > 0) {
        skipFallback -= 1
      } else if (!skipGroup) {
        output.push(character)
      }
      continue
    }

    const next = content[index + 1]
    if (next === '\\' || next === '{' || next === '}' || next === '~' || next === '-' || next === '_') {
      if (!skipGroup && skipFallback === 0) output.push(next === '~' ? ' ' : next)
      index += 1
      continue
    }
    if (next === "'") {
      const hex = content.slice(index + 2, index + 4)
      if (/^[0-9a-f]{2}$/i.test(hex)) {
        if (!skipGroup && skipFallback === 0) output.push(String.fromCharCode(Number.parseInt(hex, 16)))
        index += 3
        continue
      }
    }

    const control = content.slice(index + 1).match(/^([a-z]+)(-?\d+)? ?/i)
    if (!control) {
      if (next === '*') skipGroup = true
      index += 1
      continue
    }

    const word = control[1].toLowerCase()
    const parameter = control[2] ? Number(control[2]) : undefined
    index += control[0].length
    if (destinationWords.has(word)) skipGroup = true
    if (word === 'uc' && parameter !== undefined) unicodeFallback = Math.max(0, parameter)
    if (word === 'u' && parameter !== undefined) {
      const codePoint = parameter < 0 ? parameter + 65536 : parameter
      if (!skipGroup) output.push(String.fromCharCode(codePoint))
      skipFallback = unicodeFallback
    }
    if (!skipGroup && ['par', 'line', 'cell', 'row'].includes(word)) output.push('\n')
    if (!skipGroup && word === 'tab') output.push('\t')
  }

  return output.join('').replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function extractMessages(source: SourceDocument): MessageRecord[] {
  const channel = source.channel ?? (source.format === 'json' ? 'slack' : source.format === 'eml' ? 'gmail' : undefined)
  if (channel) return parsePilotExport(channel, source.name, source.content).map((message, index) => normalizeMessage(source, message, index))

  return source.content.split(/\n\s*\n|\r?\n/).map((text) => text.trim()).filter(Boolean).map((text, index) => ({
    id: `${source.id}-${stableHash(`${normalizeForMatching(text)}|${index}`)}`,
    text,
    source: `${formatSourceName(source.name)} · message ${index + 1}`,
  }))
}

function normalizeMessage(source: SourceDocument, message: ConnectorMessage, index: number): MessageRecord {
  const text = message.text.trim()
  return {
    id: `${source.id}-${message.id ?? stableHash(`${normalizeForMatching(text)}|${index}`)}`,
    text,
    source: message.source || `${formatSourceName(source.name)} · message ${index + 1}`,
    author: message.author,
    role: message.role,
  }
}

function createFindings(message: MessageRecord, scopeItems: ScopeItem[]): Finding[] {
  return rules.flatMap((rule) => {
    if (!rule.pattern.test(message.text)) return []
    if (rule.id === 'unpriced_commitment' && message.role === 'client') return []
    if (isNegatedSignal(rule, message.text)) return []

    const scopeMatch = findScopeBasis(rule, message.text, scopeItems)
    if (rule.id === 'new_deliverable' && scopeMatch.status === 'included') return []

    const confidence = adjustedConfidence(rule, scopeMatch.status)
    const severity = adjustedSeverity(rule, scopeMatch.status)
    return [{
      id: `SG-${stableHash(`${message.id}|${rule.id}|${normalizeForMatching(message.text)}`)}`,
      type: rule.type,
      title: titleFromRule(rule.titleStyle, message.text),
      excerpt: `“${message.text}”`,
      source: message.author ? `${message.source} · ${message.author}` : message.source,
      scope: scopeMatch.label,
      scopeMatch: scopeMatch.status,
      hours: `${rule.minHours}–${rule.maxHours}h`,
      confidence,
      severity,
      reviewed: false,
      decision: 'pending',
    }]
  })
}

function findScopeBasis(rule: Rule, text: string, scopeItems: ScopeItem[]): { status: ScopeMatch; label: string } {
  const normalizedText = normalizeForMatching(text)
  const textTokens = new Set(tokensFrom(normalizedText))
  const candidates = scopeItems.map((item) => {
    const itemText = normalizeForMatching(`${item.section} ${item.text}`)
    const itemTokens = new Set(tokensFrom(itemText))
    let score = 0

    for (const term of rule.scopeTerms) {
      const variants = expandTerm(term)
      const textMatches = variants.some((variant) => hasTerm(normalizedText, variant))
      const itemMatches = variants.some((variant) => hasTerm(itemText, variant))
      if (textMatches && itemMatches) score += 5
    }
    for (const token of textTokens) {
      if (token.length > 4 && itemTokens.has(token)) score += 1
    }
    if (score > 0 && item.excluded) score += 0.25
    return { item, score }
  }).filter((candidate) => candidate.score > 0)

  if (!candidates.length) return { status: 'none', label: 'No matching clause found' }
  candidates.sort((left, right) => right.score - left.score || Number(right.item.excluded) - Number(left.item.excluded))
  const best = candidates[0]
  const tied = candidates.filter((candidate) => Math.abs(candidate.score - best.score) < 0.01)
  const status: ScopeMatch = tied.length > 1 ? 'ambiguous' : best.item.excluded ? 'excluded' : 'included'
  const prefix = status === 'excluded' ? 'Excluded' : status === 'included' ? 'Included' : 'Ambiguous'
  return { status, label: `${prefix} · ${best.item.section} · ${best.item.text}` }
}

function adjustedConfidence(rule: Rule, scopeMatch: ScopeMatch): number {
  const adjustment = scopeMatch === 'none' ? -15 : scopeMatch === 'ambiguous' ? -20 : scopeMatch === 'included' ? -8 : 0
  return Math.max(35, Math.min(99, rule.confidence + adjustment))
}

function adjustedSeverity(rule: Rule, scopeMatch: ScopeMatch): Finding['severity'] {
  if (rule.id === 'unpriced_commitment' && scopeMatch === 'included') return 'low'
  if (scopeMatch === 'ambiguous' && rule.severity === 'high') return 'medium'
  return rule.severity
}

function isNegatedSignal(rule: Rule, text: string): boolean {
  const match = rule.pattern.exec(text)
  if (!match || match.index === undefined) return false
  const context = text.slice(Math.max(0, match.index - 60), match.index + match[0].length + 80)
  return /\b(?:not|no|never|won't|wouldn't|isn't|aren't|don't|do not|out of scope|not going to|will not)\b/i.test(context)
}

function extractSubject(text: string): string {
  const subject = text.match(/(?:add|for|about)\s+(?:a\s+|an\s+|the\s+)?([^?.!]+?)(?:\s+before|\s+without|\s+for\s+partners|$)/i)?.[1]
  const cleaned = subject ? subject.trim().replace(/^lightweight\s+/i, '').replace(/\s+$/, '') : 'This request'
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function titleFromRule(style: RuleConfig['titleStyle'], text: string): string {
  if (style === 'subject_not_in_scope') return `${extractSubject(text)} is not in the agreed scope`
  if (style === 'changes_expectation') return `${extractSubject(text)} changes the delivery expectation`
  if (style === 'extra_revision') return 'An additional revision round was requested'
  return 'A delivery commitment appears without a matching price'
}

function loadRules(text: string): Rule[] {
  try {
    const parsed: unknown = parse(text)
    if (!isRecord(parsed) || !Array.isArray(parsed.rules)) throw new Error('rules must contain a rules list')
    return parsed.rules.map((value, index) => {
      if (!isRecord(value) || !isRuleConfig(value)) throw new Error(`rule ${index + 1} is invalid`)
      return { ...value, pattern: new RegExp(value.pattern, 'i') }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown YAML error'
    throw new Error(`ScopeGuard rules could not be loaded: ${message}`)
  }
}

function isRuleConfig(value: Record<string, unknown>): value is Record<string, unknown> & RuleConfig {
  return typeof value.id === 'string'
    && typeof value.type === 'string'
    && typeof value.pattern === 'string'
    && typeof value.titleStyle === 'string'
    && ['high', 'medium', 'low'].includes(String(value.severity))
    && typeof value.confidence === 'number'
    && typeof value.minHours === 'number'
    && typeof value.maxHours === 'number'
    && Array.isArray(value.scopeTerms)
    && value.scopeTerms.every((term) => typeof term === 'string')
}

function expandTerm(term: string): string[] {
  const normalized = normalizeForMatching(term)
  const aliases: Record<string, string[]> = {
    analytics: ['analytics', 'track', 'tracked', 'tracking'],
    tracking: ['analytics', 'track', 'tracked', 'tracking'],
    revision: ['revision', 'revisions', 'pass', 'round', 'rounds'],
    round: ['revision', 'revisions', 'pass', 'round', 'rounds'],
  }
  return aliases[normalized] ?? [normalized]
}

function hasTerm(text: string, term: string): boolean {
  const normalized = normalizeForMatching(term)
  return normalized ? new RegExp(`(?:^|\\s)${escapeRegExp(normalized)}(?:$|\\s)`).test(text) : false
}

function normalizeForMatching(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokensFrom(value: string): string[] {
  return value.split(' ').filter((token) => token.length > 2 && !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'will', 'can'].includes(token))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatSourceName(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseHours(value: string): [number, number] {
  const matches = value.match(/(\d+)–(\d+)/)
  return matches ? [Number(matches[1]), Number(matches[2])] : [0, 0]
}

function stableHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
