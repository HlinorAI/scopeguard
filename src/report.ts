import type { AnalysisResult, Finding, SourceDocument } from './analysis'

export function buildReviewReport(projectName: string, sources: SourceDocument[], analysis: AnalysisResult, findings: Finding[]): string {
  const reviewed = findings.filter((finding) => finding.reviewed)
  const changeRequests = reviewed.filter((finding) => finding.decision === 'change_request')
  const inScope = reviewed.filter((finding) => finding.decision === 'in_scope')

  return [
    `# ScopeGuard review — ${projectName}`,
    '',
    `Generated: ${new Date().toLocaleString('en-GB')}`,
    '',
    '## Summary',
    '',
    `- Sources compared: ${sources.length}`,
    `- Messages compared: ${analysis.messagesCompared}`,
    `- Messages with scope basis: ${analysis.messagesWithScopeBasis ?? 0}/${analysis.messagesCompared} (${analysis.scopeCoverage}%)`,
    `- Estimated hours at risk: ${analysis.hoursAtRisk}`,
    `- Commercial risks: ${analysis.commercialRiskCount}`,
    `- Findings: ${findings.length}`,
    `- Reviewed: ${reviewed.length}`,
    `- Change requests: ${changeRequests.length}`,
    `- Marked in scope: ${inScope.length}`,
    '',
    '## Sources',
    '',
    ...sources.map((source) => `- ${source.name} — ${source.kind} / ${source.format}`),
    '',
    '## Findings',
    '',
    ...findings.flatMap((finding) => [
      `### ${finding.id} — ${finding.title}`,
      '',
      `- Decision: ${decisionText(finding)}`,
      `- Category: ${finding.category === 'commercial_risk' ? 'Commercial risk' : 'Scope drift'}`,
      `- Severity: ${finding.severity}`,
      `- Estimated exposure: ${finding.hours}`,
      `- Rule signal: ${finding.confidence}%`,
      `- Source: ${finding.source}`,
      `- Scope match: ${finding.scopeMatch}`,
      `- Scope basis: ${finding.scope}`,
      '',
      `> ${finding.excerpt.replace(/^“|”$/g, '')}`,
      '',
    ]),
  ].join('\n')
}

export function buildChangeRequest(finding: Finding, projectName: string, note?: string): string {
  return [
    `# Change request — ${finding.title}`,
    '',
    `Project: ${projectName}`,
    `Finding: ${finding.id}`,
    `Estimated exposure: ${finding.hours}`,
    '',
    '## Client evidence',
    '',
    `> ${finding.excerpt.replace(/^“|”$/g, '')}`,
    '',
    '## Scope basis',
    '',
    finding.scope,
    '',
    '## Requested action',
    '',
    finding.category === 'commercial_risk'
      ? 'Confirm order status, owner and next action before continuing work.'
      : 'Confirm scope, price and delivery impact before accepting the work.',
    ...(note ? ['', '## Review note', '', note] : []),
  ].join('\n')
}

function decisionText(finding: Finding): string {
  if (finding.decision === 'change_request') return 'Change request'
  if (finding.decision === 'in_scope') return 'Marked in scope'
  return 'Unreviewed'
}
