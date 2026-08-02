import { describe, expect, it } from 'vitest'
import type { AnalysisResult, Finding, SourceDocument } from '../src/analysis'
import { buildChangeRequest, buildReviewReport } from '../src/report'

const source: SourceDocument = {
  id: 'scope',
  name: 'scope.txt',
  kind: 'scope',
  format: 'txt',
  content: '# Scope\n- Public marketing site',
}

const analysis: AnalysisResult = {
  findings: [],
  scopeItemsCount: 1,
  messagesCompared: 1,
  scopeCoverage: 100,
  hoursAtRisk: '8–12h',
  unsupportedSources: [],
}

const finding: Finding = {
  id: 'SG-001',
  type: 'NEW DELIVERABLE',
  title: 'Dashboard is not in the agreed scope',
  excerpt: '“Can we add a dashboard?”',
  source: 'Slack · today',
  scope: 'SOW §2.1 · Public marketing site',
  hours: '8–12h',
  confidence: 94,
  severity: 'high',
  reviewed: true,
  decision: 'change_request',
}

describe('review exports', () => {
  it('builds a report with summary and evidence', () => {
    const report = buildReviewReport('Acme launch site', [source], analysis, [finding])

    expect(report).toContain('# ScopeGuard review — Acme launch site')
    expect(report).toContain('- Change requests: 1')
    expect(report).toContain('Dashboard is not in the agreed scope')
  })

  it('builds a change request with the review note', () => {
    const request = buildChangeRequest(finding, 'Acme launch site', 'Confirm price before acceptance.')

    expect(request).toContain('# Change request — Dashboard is not in the agreed scope')
    expect(request).toContain('Confirm price before acceptance.')
  })
})
