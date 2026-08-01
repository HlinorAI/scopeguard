import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { analyzeSources, demoSources, parseSourceFile } from './analysis'
import type { Finding, SourceDocument } from './analysis'
import './styles.css'
const projectNames = ['Acme launch site', 'Northstar rebrand', 'Wavelength app']
const initialAnalysis = analyzeSources(demoSources)

function App() {
  const [activeProject, setActiveProject] = useState(projectNames[0])
  const [filter, setFilter] = useState<'all' | 'high' | 'unreviewed'>('all')
  const [findings, setFindings] = useState<Finding[]>(initialAnalysis.findings)
  const [sources, setSources] = useState<SourceDocument[]>(demoSources)
  const [analysis, setAnalysis] = useState(initialAnalysis)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [analysisReady, setAnalysisReady] = useState(true)
  const [sourceError, setSourceError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

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
      })))
      setIsAnalysing(false)
      setAnalysisReady(true)
    }, 350)
  }

  const toggleReviewed = (id: string) => {
    setFindings((current) => current.map((finding) => (
      finding.id === id ? { ...finding, reviewed: !finding.reviewed } : finding
    )))
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
          <div className="topbar-actions"><span className="saved-status"><i /> Saved locally</span><button className="help-button" type="button" aria-label="Help">?</button></div>
        </header>

        <div className="content-wrap">
          <section className="page-intro">
            <div>
              <p className="eyebrow">PROJECT REVIEW · 14 MAY 2026</p>
              <h1>Keep the work<br /><em>inside the lines.</em></h1>
              <p className="intro-copy">ScopeGuard compares what was agreed with what is now being asked — before the margin disappears.</p>
            </div>
            <div className="intro-actions"><button className="quiet-button" type="button">Export report <span>↗</span></button><button className="primary-button" onClick={runAnalysis} type="button">{isAnalysing ? 'Analysing…' : 'Run analysis'} <span>→</span></button></div>
          </section>

          <section className="status-strip" aria-label="Analysis status">
            <div className="status-intro"><span className={`status-icon ${analysisReady ? 'ready' : ''}`}>{analysisReady ? '✓' : '…'}</span><div><strong>{analysisReady ? 'Analysis complete' : 'Ready to analyse'}</strong><span>{analysisReady ? `Compared ${analysis.messagesCompared} messages against ${analysis.scopeItemsCount} scope items` : `${sources.length} source${sources.length === 1 ? '' : 's'} loaded · Run analysis to compare them`}</span></div></div>
            <div className="status-metrics"><div><span>Scope coverage</span><strong>{analysis.scopeCoverage}%</strong></div><div><span>Hours at risk</span><strong className="orange-text">{analysis.hoursAtRisk}</strong></div><div><span>Unreviewed</span><strong>{findings.filter((finding) => !finding.reviewed).length}</strong></div></div>
          </section>

          <section className="workspace-grid">
            <div className="evidence-column">
              <div className="section-heading"><div><p className="eyebrow">EVIDENCE REVIEW</p><h2>Potential scope drift</h2></div><div className="filter-tabs" role="tablist" aria-label="Finding filters">{(['all', 'high', 'unreviewed'] as const).map((item) => <button className={filter === item ? 'is-active' : ''} key={item} onClick={() => setFilter(item)} role="tab" type="button">{item === 'all' ? 'All findings' : item === 'high' ? 'High risk' : 'Unreviewed'}</button>)}</div></div>
              <div className="finding-list">
                {visibleFindings.map((finding) => <FindingCard finding={finding} key={finding.id} onToggleReviewed={toggleReviewed} />)}
                {!visibleFindings.length && <div className="empty-state"><strong>Nothing waiting here.</strong><span>Every finding in this view has been reviewed.</span></div>}
              </div>
            </div>

            <aside className="source-panel">
              <div className="section-heading source-heading"><div><p className="eyebrow">PROJECT SOURCES</p><h2>What we compared</h2></div><span className="source-count">{sources.length}/04</span></div>
              <div className="source-list">{sources.map((source) => <div className="source-file" key={source.id}><span className={`file-icon ${source.kind === 'scope' ? 'pdf' : 'json'}`}>{source.format.toUpperCase()}</span><div><strong>{source.name}</strong><small>{sourceKindLabel(source.kind)} · local source</small></div><span className="file-check">✓</span></div>)}</div>
              <div className={`drop-zone ${isDragging ? 'is-dragging' : ''}`} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleFiles(event.dataTransfer.files) }}>
                <input accept=".txt,.md,.eml,.json" className="visually-hidden" onChange={handleFileChange} ref={fileInput} type="file" multiple />
                <span className="upload-symbol">+</span><strong>Add a source</strong><small>TXT, MD, EML or JSON · <button onClick={() => fileInput.current?.click()} type="button">browse</button></small>
              </div>
              {sourceError && <div className="source-error" role="alert">{sourceError}</div>}
              <div className="privacy-callout"><span>◆</span><div><strong>Private by default</strong><p>Files are processed locally in this prototype. No client data leaves your workspace.</p></div></div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  )
}

function FindingCard({ finding, onToggleReviewed }: { finding: Finding; onToggleReviewed: (id: string) => void }) {
  return <article className={`finding-card ${finding.reviewed ? 'is-reviewed' : ''}`}>
    <div className="finding-topline"><span className={`severity-dot ${finding.severity}`} /><span className="finding-type">{finding.type}</span><span className="finding-id">{finding.id}</span></div>
    <h3>{finding.title}</h3>
    <blockquote>{finding.excerpt}</blockquote>
    <div className="finding-meta"><span><b>Source</b>{finding.source}</span><span><b>Scope basis</b>{finding.scope}</span></div>
    <div className="finding-bottom"><div className="finding-estimate"><span>Estimated exposure</span><strong>{finding.hours}</strong><span className={`confidence ${finding.confidence > 90 ? 'strong' : ''}`}>{finding.confidence}% confidence</span></div><button className={`review-button ${finding.reviewed ? 'done' : ''}`} onClick={() => onToggleReviewed(finding.id)} type="button">{finding.reviewed ? 'Reviewed ✓' : 'Review finding →'}</button></div>
  </article>
}

function sourceKindLabel(kind: SourceDocument['kind']): string {
  if (kind === 'scope') return 'Scope document'
  if (kind === 'messages') return 'Communication export'
  return 'Unclassified source'
}

export default App

createRoot(document.getElementById('root')!).render(<App />)
