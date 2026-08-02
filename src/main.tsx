import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { analyzeSources, demoSources, parseSourceFile } from './analysis'
import type { Finding, SourceDocument } from './analysis'
import { buildChangeRequest, buildReviewReport } from './report'
import { loadWorkspace, saveWorkspace } from './storage'
import './styles.css'
const projectNames = ['Acme launch site', 'Northstar rebrand', 'Wavelength app']
const initialAnalysis = analyzeSources(demoSources)
const tourStorageKey = 'scopeguard-onboarding-complete'
const persistedWorkspace = loadWorkspace()

function App() {
  const [activeProject, setActiveProject] = useState(persistedWorkspace?.projectName ?? projectNames[0])
  const [filter, setFilter] = useState<'all' | 'high' | 'unreviewed'>('all')
  const [findings, setFindings] = useState<Finding[]>(persistedWorkspace?.findings ?? initialAnalysis.findings)
  const [sources, setSources] = useState<SourceDocument[]>(persistedWorkspace?.sources ?? demoSources)
  const [analysis, setAnalysis] = useState(persistedWorkspace?.analysis ?? initialAnalysis)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [analysisReady, setAnalysisReady] = useState(true)
  const [sourceError, setSourceError] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>(persistedWorkspace?.reviewNotes ?? {})
  const [isDragging, setIsDragging] = useState(false)
  const [isTourOpen, setIsTourOpen] = useState(() => !hasCompletedTour())
  const [tourStep, setTourStep] = useState(0)
  const [savedAt, setSavedAt] = useState<string | null>(persistedWorkspace?.savedAt ?? null)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const changeRequestFindings = useMemo(() => findings.filter((finding) => finding.decision === 'change_request'), [findings])

  useEffect(() => {
    setSavedAt(saveWorkspace({ projectName: activeProject, sources, findings, analysis, reviewNotes }))
  }, [activeProject, analysis, findings, reviewNotes, sources])

  const visibleFindings = useMemo(() => {
    if (filter === 'high') return findings.filter((finding) => finding.severity === 'high')
    if (filter === 'unreviewed') return findings.filter((finding) => !finding.reviewed)
    return findings
  }, [filter, findings])

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const parsed = await Promise.all(Array.from(files).map(async (file) => {
      try {
        return { source: await parseSourceFile(file) }
      } catch (error) {
        return { error: error instanceof Error ? error.message : `${file.name}: could not parse this source` }
      }
    }))
    const nextSources = parsed.flatMap((result) => result.source ? [result.source] : [])
    const errors = parsed.flatMap((result) => result.error ? [result.error] : [])
    if (nextSources.length) setSources((current) => [...current, ...nextSources])
    setSourceError(errors.length ? errors.join(' ') : null)
    setAnalysisReady(false)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(event.target.files)
    event.target.value = ''
  }

  const runAnalysis = () => {
    if (sources.length < 2) {
      setSourceError('Add one scope document and one communication export before running analysis.')
      return
    }
    setIsAnalysing(true)
    setAnalysisReady(false)
    window.setTimeout(() => {
      const nextAnalysis = analyzeSources(sources)
      setAnalysis(nextAnalysis)
      setFindings((current) => nextAnalysis.findings.map((finding) => ({
        ...finding,
        reviewed: current.find((previous) => previous.id === finding.id)?.reviewed ?? false,
        decision: current.find((previous) => previous.id === finding.id)?.decision ?? 'pending',
      })))
      setIsAnalysing(false)
      setAnalysisReady(true)
    }, 350)
  }

  const openReview = (id: string) => {
    setReviewingId((current) => current === id ? null : id)
  }

  const decideFinding = (id: string, decision: Finding['decision']) => {
    setFindings((current) => current.map((finding) => (
      finding.id === id ? { ...finding, reviewed: true, decision } : finding
    )))
    setReviewingId(null)
  }

  const reopenFinding = (id: string) => {
    setFindings((current) => current.map((finding) => (
      finding.id === id ? { ...finding, reviewed: false, decision: 'pending' } : finding
    )))
    setReviewingId(id)
  }

  const exportReport = () => {
    downloadText(`${toFileSlug(activeProject)}-scopeguard-report.md`, buildReviewReport(activeProject, sources, analysis, findings))
    showExportNotice('Report downloaded')
  }

  const exportChangeRequests = () => {
    const content = changeRequestFindings.map((finding) => buildChangeRequest(finding, activeProject, reviewNotes[finding.id])).join('\n\n---\n\n')
    downloadText(`${toFileSlug(activeProject)}-change-requests.md`, content)
    showExportNotice(`${changeRequestFindings.length} change request${changeRequestFindings.length === 1 ? '' : 's'} downloaded`)
  }

  const showExportNotice = (message: string) => {
    setExportNotice(message)
    window.setTimeout(() => setExportNotice(null), 2400)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">S</div>
          <div>
            <div className="brand-name">ScopeGuard</div>
            <div className="brand-caption">margin protection</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Workspace</div>
          <button className="workspace-switcher" type="button">
            <span className="workspace-avatar">N</span>
            <span className="workspace-copy"><strong>Northstar Studio</strong><small>Agency workspace</small></span>
            <span className="chevron" aria-hidden="true">⌄</span>
          </button>
        </div>

        <nav className="project-nav" aria-label="Projects">
          <div className="sidebar-label">Projects <span>03</span></div>
          {projectNames.map((project, index) => (
            <button
              className={`project-item ${project === activeProject ? 'is-active' : ''}`}
              key={project}
              onClick={() => setActiveProject(project)}
              type="button"
            >
              <span className={`project-dot dot-${index + 1}`} />
              <span>{project}</span>
              {index === 0 && <span className="project-count">04</span>}
            </button>
          ))}
          <button className="new-project" type="button"><span>+</span> New project</button>
        </nav>

        <div className="sidebar-footer">
          <div className="privacy-note"><span className="lock-mark" aria-hidden="true">◆</span><span><strong>Local-first</strong><small>Your files stay private</small></span></div>
          <div className="user-row"><span className="user-avatar">AN</span><span><strong>Andre</strong><small>Owner</small></span><button type="button" aria-label="Open account menu">···</button></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Projects</span><b>/</b><strong>{activeProject}</strong></div>
          <div className="topbar-actions"><span className="saved-status" title={savedAt ? `Last saved ${new Date(savedAt).toLocaleTimeString()}` : 'Not saved yet'}><i /> Saved locally</span>{exportNotice && <span className="export-notice" role="status">{exportNotice}</span>}<button className="help-button" onClick={() => { setTourStep(0); setIsTourOpen(true) }} type="button" aria-label="Replay onboarding tour" title="Replay onboarding tour">?</button></div>
        </header>

        <div className="content-wrap">
          <section className="page-intro" data-tour="intro">
            <div>
              <p className="eyebrow">PROJECT REVIEW · 14 MAY 2026</p>
              <h1>Keep the work<br /><em>inside the lines.</em></h1>
              <p className="intro-copy">ScopeGuard compares what was agreed with what is now being asked — before the margin disappears.</p>
            </div>
            <div className="intro-actions"><button className="quiet-button" onClick={exportReport} type="button">Export report <span>↗</span></button>{changeRequestFindings.length > 0 && <button className="quiet-button" onClick={exportChangeRequests} type="button">Change requests <span>↗</span></button>}<button className="primary-button" data-tour="analysis" onClick={runAnalysis} type="button">{isAnalysing ? 'Analysing…' : 'Run analysis'} <span>→</span></button></div>
          </section>

          <section className="status-strip" aria-label="Analysis status">
            <div className="status-intro"><span className={`status-icon ${analysisReady ? 'ready' : ''}`}>{analysisReady ? '✓' : '…'}</span><div><strong>{analysisReady ? 'Analysis complete' : 'Ready to analyse'}</strong><span>{analysisReady ? `Compared ${analysis.messagesCompared} messages against ${analysis.scopeItemsCount} scope items` : `${sources.length} source${sources.length === 1 ? '' : 's'} loaded · Run analysis to compare them`}</span></div></div>
            <div className="status-metrics"><div><span>Scope coverage</span><strong>{analysis.scopeCoverage}%</strong></div><div><span>Hours at risk</span><strong className="orange-text">{analysis.hoursAtRisk}</strong></div><div><span>Unreviewed</span><strong>{findings.filter((finding) => !finding.reviewed).length}</strong></div></div>
          </section>

          <section className="workspace-grid">
            <div className="evidence-column" data-tour="findings">
              <div className="section-heading"><div><p className="eyebrow">EVIDENCE REVIEW</p><h2>Potential scope drift</h2></div><div className="filter-tabs" role="tablist" aria-label="Finding filters">{(['all', 'high', 'unreviewed'] as const).map((item) => <button className={filter === item ? 'is-active' : ''} key={item} onClick={() => setFilter(item)} role="tab" type="button">{item === 'all' ? 'All findings' : item === 'high' ? 'High risk' : 'Unreviewed'}</button>)}</div></div>
              <div className="finding-list">
                {visibleFindings.map((finding) => <FindingCard
                  finding={finding}
                  isReviewing={reviewingId === finding.id}
                  key={finding.id}
                  note={reviewNotes[finding.id] ?? ''}
                  onDecide={decideFinding}
                  onNoteChange={(note) => setReviewNotes((current) => ({ ...current, [finding.id]: note }))}
                  onOpenReview={openReview}
                  onReopen={reopenFinding}
                />)}
                {!visibleFindings.length && <div className="empty-state"><strong>Nothing waiting here.</strong><span>Every finding in this view has been reviewed.</span></div>}
              </div>
            </div>

            <aside className="source-panel" data-tour="sources">
              <div className="section-heading source-heading"><div><p className="eyebrow">PROJECT SOURCES</p><h2>What we compared</h2></div><span className="source-count">{sources.length}/04</span></div>
              <div className="source-list">{sources.map((source) => <div className="source-file" key={source.id}><span className={`file-icon ${source.kind === 'scope' ? 'pdf' : 'json'}`}>{source.format.toUpperCase()}</span><div><strong>{source.name}</strong><small>{sourceKindLabel(source.kind)} · local source</small></div><span className="file-check">✓</span></div>)}</div>
              <div className={`drop-zone ${isDragging ? 'is-dragging' : ''}`} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleFiles(event.dataTransfer.files) }}>
                <input accept=".txt,.md,.eml,.json" className="visually-hidden" onChange={handleFileChange} ref={fileInput} type="file" multiple />
                <span className="upload-symbol">+</span><strong>Add a source</strong><small>TXT, MD, EML or JSON · <button onClick={() => fileInput.current?.click()} type="button">browse</button></small>
              </div>
              {sourceError && <div className="source-error" role="alert">{sourceError}</div>}
              <div className="privacy-callout" data-tour="privacy"><span>◆</span><div><strong>Private by default</strong><p>Files are processed locally in this prototype. No client data leaves your workspace.</p></div></div>
            </aside>
          </section>
        </div>
      </main>
      <OnboardingTour isOpen={isTourOpen} onClose={() => { setIsTourOpen(false); markTourComplete() }} onStepChange={setTourStep} stepIndex={tourStep} />
    </div>
  )
}

function FindingCard({
  finding,
  isReviewing,
  note,
  onDecide,
  onNoteChange,
  onOpenReview,
  onReopen,
}: {
  finding: Finding
  isReviewing: boolean
  note: string
  onDecide: (id: string, decision: Finding['decision']) => void
  onNoteChange: (note: string) => void
  onOpenReview: (id: string) => void
  onReopen: (id: string) => void
}) {
  return <article className={`finding-card ${finding.reviewed ? 'is-reviewed' : ''}`}>
    <div className="finding-topline"><span className={`severity-dot ${finding.severity}`} /><span className="finding-type">{finding.type}</span><span className="finding-id">{finding.id}</span></div>
    <h3>{finding.title}</h3>
    <blockquote>{finding.excerpt}</blockquote>
    <div className="finding-meta"><span><b>Source</b>{finding.source}</span><span><b>Scope basis</b>{finding.scope}</span></div>
    <div className="finding-bottom"><div className="finding-estimate"><span>Estimated exposure</span><strong>{finding.hours}</strong><span className={`confidence ${finding.confidence > 90 ? 'strong' : ''}`}>{finding.confidence}% confidence</span></div>{finding.reviewed ? <div className="review-state"><span className={`decision-badge ${finding.decision}`}>{decisionLabel(finding.decision)}</span><button className="reopen-button" onClick={() => onReopen(finding.id)} type="button">Reopen</button></div> : <button className="review-button" data-tour="review-action" onClick={() => onOpenReview(finding.id)} type="button">{isReviewing ? 'Close review' : 'Review finding →'}</button>}</div>
    {isReviewing && !finding.reviewed && <div className="review-panel"><label htmlFor={`review-note-${finding.id}`}>Decision note <span>optional</span></label><textarea id={`review-note-${finding.id}`} onChange={(event) => onNoteChange(event.target.value)} placeholder="Why should the team act on this finding?" value={note} /><div className="review-actions"><button className="in-scope-button" onClick={() => onDecide(finding.id, 'in_scope')} type="button">Mark in scope</button><button className="change-request-button" onClick={() => onDecide(finding.id, 'change_request')} type="button">Create change request <span>→</span></button></div></div>}
  </article>
}

type TourStep = {
  target: string
  title: string
  body: string
}

const tourSteps: TourStep[] = [
  { target: 'intro', title: 'Start with the scope', body: 'ScopeGuard compares what was agreed with what clients later ask for. Demo evidence is already loaded so you can see the workflow immediately.' },
  { target: 'sources', title: 'Add the source files', body: 'Upload one scope document and exports from Slack, Gmail or WhatsApp. In this pilot, files are parsed locally in the browser.' },
  { target: 'analysis', title: 'Run the analysis', body: 'When your sources are ready, click Run analysis. ScopeGuard highlights potential scope drift and estimates the exposure.' },
  { target: 'findings', title: 'Read the evidence', body: 'Each finding includes the client quote, original source and scope basis. Start with High risk or Unreviewed.' },
  { target: 'review-action', title: 'Make a decision', body: 'Open a finding, leave an optional note, then mark it In scope or Create change request.' },
  { target: 'privacy', title: 'Private by default', body: 'The open-source pilot processes files in the browser and sends no client content to an external API. Use the ? button any time to replay this tour.' },
]

function OnboardingTour({ isOpen, onClose, onStepChange, stepIndex }: { isOpen: boolean; onClose: () => void; onStepChange: (step: number) => void; stepIndex: number }) {
  const [spotlight, setSpotlight] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const step = tourSteps[stepIndex]

  useEffect(() => {
    if (!isOpen) return
    const updateSpotlight = () => {
      const target = document.querySelector(`[data-tour="${step.target}"]`)
      if (!target) {
        setSpotlight(null)
        return
      }
      target.scrollIntoView({ block: 'center', inline: 'nearest' })
      const rect = target.getBoundingClientRect()
      setSpotlight({ top: Math.max(8, rect.top - 8), left: Math.max(8, rect.left - 8), width: rect.width + 16, height: rect.height + 16 })
    }
    const frame = window.requestAnimationFrame(updateSpotlight)
    window.addEventListener('resize', updateSpotlight)
    window.addEventListener('scroll', updateSpotlight, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', updateSpotlight, true)
    }
  }, [isOpen, step.target])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onStepChange(Math.min(tourSteps.length - 1, stepIndex + 1))
      if (event.key === 'ArrowLeft') onStepChange(Math.max(0, stepIndex - 1))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onStepChange, stepIndex])

  if (!isOpen) return null

  const isLastStep = stepIndex === tourSteps.length - 1
  return <>
    <div className="tour-catcher" aria-hidden="true" />
    {spotlight && <div className="tour-spotlight" aria-hidden="true" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }} />}
    <section aria-labelledby="tour-title" aria-modal="true" className="onboarding-card" role="dialog">
      <div className="onboarding-progress"><span>ScopeGuard tour</span><span>{stepIndex + 1} / {tourSteps.length}</span></div>
      <div className="onboarding-progress-bar"><span style={{ width: `${((stepIndex + 1) / tourSteps.length) * 100}%` }} /></div>
      <h2 id="tour-title">{step.title}</h2>
      <p>{step.body}</p>
      <div className="onboarding-actions"><button className="onboarding-skip" onClick={onClose} type="button">Skip tour</button><div><button className="onboarding-back" disabled={stepIndex === 0} onClick={() => onStepChange(stepIndex - 1)} type="button">Back</button><button className="onboarding-next" onClick={() => isLastStep ? onClose() : onStepChange(stepIndex + 1)} type="button">{isLastStep ? 'Done' : 'Next'} <span>→</span></button></div></div>
    </section>
  </>
}

function hasCompletedTour(): boolean {
  try {
    return window.localStorage.getItem(tourStorageKey) === 'true'
  } catch {
    return false
  }
}

function markTourComplete() {
  try {
    window.localStorage.setItem(tourStorageKey, 'true')
  } catch {
    // The tour remains available from the help button when storage is unavailable.
  }
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function toFileSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'scopeguard'
}

function sourceKindLabel(kind: SourceDocument['kind']): string {
  if (kind === 'scope') return 'Scope document'
  if (kind === 'messages') return 'Communication export'
  return 'Unclassified source'
}

function decisionLabel(decision: Finding['decision']): string {
  if (decision === 'change_request') return 'Change request ✓'
  if (decision === 'in_scope') return 'Marked in scope ✓'
  return 'Reviewed ✓'
}

export default App

createRoot(document.getElementById('root')!).render(<App />)
