import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

type Finding = {
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

const initialFindings: Finding[] = [
  {
    id: 'SG-014',
    type: 'NEW DELIVERABLE',
    title: 'Partner dashboard is not in the agreed scope',
    excerpt: '“Can we also add a lightweight dashboard for partners before launch?”',
    source: 'Slack · #acme-launch · 14 May, 10:42',
    scope: 'SOW §2.1 · Public marketing site',
    hours: '32–40h',
    confidence: 94,
    severity: 'high',
    reviewed: false,
  },
  {
    id: 'SG-011',
    type: 'ACCEPTANCE CRITERIA',
    title: '“Real-time” status changes the delivery expectation',
    excerpt: '“The status should update instantly without refreshing the page.”',
    source: 'Email · Alex → Studio · 13 May, 16:08',
    scope: 'SOW §3.2 · Daily status sync',
    hours: '8–12h',
    confidence: 82,
    severity: 'medium',
    reviewed: false,
  },
  {
    id: 'SG-008',
    type: 'EXTRA REVISION',
    title: 'Fourth revision round requested on homepage',
    excerpt: '“One last pass on the headline and hero direction, then we are done.”',
    source: 'Slack · #acme-launch · 12 May, 09:17',
    scope: 'SOW §4.4 · Two revision rounds',
    hours: '4–6h',
    confidence: 98,
    severity: 'high',
    reviewed: true,
  },
  {
    id: 'SG-005',
    type: 'UNPRICED COMMITMENT',
    title: 'Analytics implementation was promised in a follow-up',
    excerpt: '“We will make sure the new funnel is tracked end to end.”',
    source: 'Email · Studio → Alex · 09 May, 11:24',
    scope: 'No matching clause found',
    hours: '6–10h',
    confidence: 71,
    severity: 'medium',
    reviewed: false,
  },
]

const projectNames = ['Acme launch site', 'Northstar rebrand', 'Wavelength app']

function App() {
  const [activeProject, setActiveProject] = useState(projectNames[0])
  const [filter, setFilter] = useState<'all' | 'high' | 'unreviewed'>('all')
  const [findings, setFindings] = useState(initialFindings)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [analysisReady, setAnalysisReady] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(['Acme_SOW_v3.pdf', 'acme-slack-export.json'])
  const [isDragging, setIsDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const visibleFindings = useMemo(() => {
    if (filter === 'high') return findings.filter((finding) => finding.severity === 'high')
    if (filter === 'unreviewed') return findings.filter((finding) => !finding.reviewed)
    return findings
  }, [filter, findings])

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return
    setUploadedFiles((current) => [...current, ...Array.from(files).map((file) => file.name)])
    setAnalysisReady(false)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
    event.target.value = ''
  }

  const runAnalysis = () => {
    if (uploadedFiles.length < 2) return
    setIsAnalysing(true)
    setAnalysisReady(false)
    window.setTimeout(() => {
      setIsAnalysing(false)
      setAnalysisReady(true)
    }, 1200)
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
            <div className="status-intro"><span className={`status-icon ${analysisReady ? 'ready' : ''}`}>{analysisReady ? '✓' : '…'}</span><div><strong>{analysisReady ? 'Analysis complete' : 'Ready to analyse'}</strong><span>{analysisReady ? 'Compared 38 messages against 12 scope items' : 'Add a scope document and a communication export'}</span></div></div>
            <div className="status-metrics"><div><span>Scope coverage</span><strong>92%</strong></div><div><span>Hours at risk</span><strong className="orange-text">50–68h</strong></div><div><span>Unreviewed</span><strong>{findings.filter((finding) => !finding.reviewed).length}</strong></div></div>
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
              <div className="section-heading source-heading"><div><p className="eyebrow">PROJECT SOURCES</p><h2>What we compared</h2></div><span className="source-count">{uploadedFiles.length}/04</span></div>
              <div className="source-list">{uploadedFiles.map((file, index) => <div className="source-file" key={`${file}-${index}`}><span className={`file-icon ${file.endsWith('.pdf') ? 'pdf' : 'json'}`}>{file.endsWith('.pdf') ? 'PDF' : 'JSON'}</span><div><strong>{file}</strong><small>{file.endsWith('.pdf') ? 'Scope document · 1.2 MB' : 'Communication export · 486 KB'}</small></div><span className="file-check">✓</span></div>)}</div>
              <div className={`drop-zone ${isDragging ? 'is-dragging' : ''}`} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleFiles(event.dataTransfer.files) }}>
                <input accept=".pdf,.txt,.md,.eml,.json,.docx" className="visually-hidden" onChange={handleFileChange} ref={fileInput} type="file" multiple />
                <span className="upload-symbol">+</span><strong>Add a source</strong><small>Drop files here or <button onClick={() => fileInput.current?.click()} type="button">browse</button></small>
              </div>
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

export default App

createRoot(document.getElementById('root')!).render(<App />)
