import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProjects } from '../App'
import Unit from '../components/Unit'
import { ProjectFrames } from '../components/FrameView'

function reducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Story-mode chrome: a scroll progress hairline up top and a compact
// clicker bar at the bottom (frame n / total, current section, prev/next).
function StoryChrome({ containerRef, frames }) {
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(frames.length)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const els = Array.from(container.querySelectorAll('[data-frame-index]'))
    setTotal(els.length)
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) setCurrent(Number(e.target.getAttribute('data-frame-index')) || 0)
      }
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [containerRef, frames])

  const tickingRef = useRef(false)
  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      requestAnimationFrame(() => {
        tickingRef.current = false
        const container = containerRef.current
        if (!container) return
        const totalPx = container.offsetHeight - window.innerHeight
        const done = Math.min(Math.max(window.scrollY - container.offsetTop, 0), Math.max(totalPx, 0))
        setProgress(totalPx > 0 ? (done / totalPx) * 100 : 0)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [containerRef])

  const goTo = n => {
    const container = containerRef.current
    if (!container) return
    const el = container.querySelector(`[data-frame-index="${n}"]`)
    if (el) el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }

  let sectionTitle = null
  for (let i = 0; i <= current && i < frames.length; i++) {
    if (frames[i].type === 'section') sectionTitle = frames[i].title || frames[i].label || sectionTitle
  }

  return (
    <>
      <div className="story-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
      <div className="story-clicker">
        <button onClick={() => goTo(current - 1)} disabled={current <= 0} aria-label="Previous frame">‹</button>
        <span className="story-clicker-label">
          {sectionTitle ? <span className="story-clicker-section">{sectionTitle} · </span> : null}
          {Math.min(current + 1, total)} / {total}
        </span>
        <button onClick={() => goTo(current + 1)} disabled={current >= total - 1} aria-label="Next frame">›</button>
      </div>
    </>
  )
}

function FramesProject({ project, prev, next }) {
  const presentation = project.presentation || {}
  const mode = presentation.mode === 'story' ? 'story' : 'gallery'
  const frames = project.frames || []
  const articleRef = useRef(null)

  useEffect(() => {
    if (mode !== 'story' || presentation.snap === 'off') return
    document.documentElement.classList.add('story-snap')
    return () => document.documentElement.classList.remove('story-snap')
  }, [mode, presentation.snap])

  if (mode === 'story') {
    // The auto-appended colophon counts as a frame for the clicker.
    const chromeFrames = frames.some(f => f.type === 'end') ? frames : [...frames, { type: 'end' }]
    return (
      <article className="project project-story" ref={articleRef}>
        <ProjectFrames project={project} nextProject={next} />
        <StoryChrome containerRef={articleRef} frames={chromeFrames} />
      </article>
    )
  }

  const hasTitleFrame = frames.some(f => f.type === 'title')
  return (
    <article className="project project-gallery">
      <header className="project-header">
        {!hasTitleFrame && <h1>{project.title}</h1>}
        {project.year ? <p className="project-year">{project.year}</p> : null}
        {project.intro ? <p className="project-intro">{project.intro}</p> : null}
        {project.statement ? <p className="project-statement">{project.statement}</p> : null}
      </header>
      <ProjectFrames project={project} nextProject={next} />
      <footer className="project-footer">
        <Link to="/">← All projects</Link>
        <nav className="project-pager">
          <Link to={`/projects/${prev.slug}`}>← {prev.title}</Link>
          <Link to={`/projects/${next.slug}`}>{next.title} →</Link>
        </nav>
      </footer>
    </article>
  )
}

export default function ProjectPage() {
  const { slug } = useParams()
  const { projects, loading, error } = useProjects()
  if (loading) return <p className="status">Loading…</p>
  if (error) return <p className="status">Couldn’t load the projects. {error}</p>
  const i = projects.findIndex(p => p.slug === slug)
  if (i === -1) return <p className="status">Project not found. <Link to="/">Back to the index</Link></p>
  const project = projects[i]

  if (Array.isArray(project.frames)) {
    // Pager cycles the visible shelf only; hidden projects stay reachable
    // by direct URL but are never surfaced as prev/next suggestions.
    const visible = projects.filter(p => !p.hidden)
    const vi = visible.findIndex(p => p.slug === slug)
    const prev = vi >= 0 ? visible[(vi - 1 + visible.length) % visible.length] : visible[visible.length - 1]
    const next = vi >= 0 ? visible[(vi + 1) % visible.length] : visible[0]
    return <FramesProject project={project} prev={prev} next={next} />
  }

  // Legacy units path — unchanged rendering for units-only projects.
  const prev = projects[(i - 1 + projects.length) % projects.length]
  const next = projects[(i + 1) % projects.length]
  const hasTitleUnit = (project.units || []).some(u => u.type === 'title')
  return (
    <article className="project">
      <header className="project-header">
        {!hasTitleUnit && <h1>{project.title}</h1>}
        {project.year ? <p className="project-year">{project.year}</p> : null}
        {project.intro ? <p className="project-intro">{project.intro}</p> : null}
        {project.statement ? <p className="project-statement">{project.statement}</p> : null}
      </header>
      <div className="project-units">
        {(project.units || []).map((u, idx) => <Unit key={idx} unit={u} />)}
      </div>
      <footer className="project-footer">
        <Link to="/">← All projects</Link>
        <nav className="project-pager">
          <Link to={`/projects/${prev.slug}`}>← {prev.title}</Link>
          <Link to={`/projects/${next.slug}`}>{next.title} →</Link>
        </nav>
      </footer>
    </article>
  )
}
