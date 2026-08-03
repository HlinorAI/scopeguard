import type { AnalysisResult, Finding, SourceDocument } from './analysis'

const storageKey = 'scopeguard-workspace-v3'

export type PersistedWorkspace = {
  version: 3
  projectName: string
  sources: SourceDocument[]
  findings: Finding[]
  analysis: AnalysisResult
  reviewNotes: Record<string, string>
  savedAt: string
}

export function loadWorkspace(): PersistedWorkspace | null {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isPersistedWorkspace(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveWorkspace(workspace: Omit<PersistedWorkspace, 'version' | 'savedAt'>): string | null {
  const savedAt = new Date().toISOString()
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ ...workspace, version: 3, savedAt }))
    return savedAt
  } catch {
    return null
  }
}

function isPersistedWorkspace(value: unknown): value is PersistedWorkspace {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return record.version === 3
    && typeof record.projectName === 'string'
    && Array.isArray(record.sources)
    && Array.isArray(record.findings)
    && typeof record.analysis === 'object'
    && record.analysis !== null
    && typeof record.reviewNotes === 'object'
    && record.reviewNotes !== null
    && typeof record.savedAt === 'string'
}
