import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Frame from './Frame'
import { slugify, bookForSlug } from '../lib/projects'

function reducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function paras(text) {
  return String(text || '').split(/\n\s*\n/).filter(Boolean)
}

function focusPosition(focus) {
  if (!focus || (focus.x == null && focus.y == null)) return undefined
  return `${focus.x ?? 50}% ${focus.y ?? 50}%`
}

// Full-bleed background image for title frames. A missing file simply
// leaves the frame's tone behind (no broken-image icon in a background).
function TitleBg({ image }) {
  const [failed, setFailed] = useState(false)
  if (!image || !image.src || failed) return null
  return (
    <div className="frame-title-bg" aria-hidden="true">
      <img
        src={image.src}
        alt=""
        style={{ objectPosition: focusPosition(image.focus) }}
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function EndContent({ frame, project, nextProject, autoEnd }) {
  const book = bookForSlug(frame.bookSlug)
  return (
    <div className="frame-end-inner">
      {autoEnd && project ? (
        <p className="frame-end-meta">{project.title}{project.year ? ` · ${project.year}` : ''}</p>
      ) : null}
      {frame.text ? paras(frame.text).map((p, i) => <p key={i} className="frame-end-text">{p}</p>) : null}
      {book ? (
        <a className="frame-end-book" href={book.link} target="_blank" rel="noreferrer">
          {book.cover ? <img src={book.cover} alt="" className="frame-end-book-cover" /> : null}
          <span className="frame-end-book-body">
            <span className="frame-end-book-title">{book.title}</span>
            <span className="frame-end-book-note">View the book</span>
          </span>
        </a>
      ) : null}
      <nav className="frame-end-nav">
        <Link to="/">← All projects</Link>
        {frame.showNext !== false && nextProject ? (
          <Link to={`/projects/${nextProject.slug}`}>Next: {nextProject.title} →</Link>
        ) : null}
      </nav>
    </div>
  )
}

export default function FrameView({ frame, index = 0, mode = 'gallery', defaultTransition = 'cut', project = null, nextProject = null, autoEnd = false }) {
  const ref = useRef(null)
  const enter = frame.enter || defaultTransition || 'cut'
  const animated = enter !== 'cut'

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!animated || reducedMotion()) {
      el.classList.add('frame-in')
      return
    }
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          el.classList.add('frame-in')
          io.disconnect()
        }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [animated])

  const story = mode === 'story'
  const tone = frame.tone ? ` tone-${frame.tone}` : ''
  const snap = story && (frame.type === 'title' || frame.type === 'section' || (frame.type === 'breath' && frame.size === 'full'))
  const id = frame.type === 'section' ? (slugify(frame.title || frame.label) || `f-${index + 1}`) : `f-${index + 1}`
  const common = {
    ref,
    id,
    'data-frame-index': index,
    'data-enter': enter,
    'data-snap': snap || undefined,
  }

  if (frame.type === 'title') {
    if (!story) {
      return (
        <section {...common} className={`unit unit-title${tone}`}>
          <h2>{frame.title}</h2>
          {frame.subtitle ? <p className="frame-subtitle">{frame.subtitle}</p> : null}
        </section>
      )
    }
    return (
      <section {...common} className={`frame frame-title-story${frame.image ? ' has-image' : ''}${tone}`}>
        <TitleBg image={frame.image} />
        {frame.image ? <div className="frame-title-scrim" aria-hidden="true" /> : null}
        <div className="frame-title-content">
          {frame.label ? <p className="frame-label">{frame.label}</p> : null}
          <h1 className="frame-title-text">{frame.title}</h1>
          {frame.subtitle ? <p className="frame-subtitle">{frame.subtitle}</p> : null}
        </div>
        <div className="frame-scroll-cue" aria-hidden="true">Scroll ↓</div>
      </section>
    )
  }

  if (frame.type === 'section') {
    return (
      <section {...common} className={`frame frame-section ${story ? 'frame-section-story' : 'frame-section-gallery'}${tone}`}>
        <div className="frame-section-inner">
          {frame.label ? <p className="frame-label">{frame.label}</p> : null}
          {frame.title ? <h2 className="frame-section-title">{frame.title}</h2> : null}
          {frame.note ? <p className="frame-section-note">{frame.note}</p> : null}
        </div>
      </section>
    )
  }

  if (frame.type === 'text') {
    const variant = frame.variant || 'statement'
    const body = paras(frame.body)
    if (!story && variant === 'statement' && !frame.image) {
      return (
        <section {...common} className={`unit unit-text${tone}`}>
          {body.map((p, i) => <p key={i}>{p}</p>)}
        </section>
      )
    }
    return (
      <section {...common} className={`frame frame-text frame-text-${variant}${frame.image ? ' has-bg' : ''}${tone}`}>
        {frame.image ? (
          <div className="frame-text-bg" aria-hidden="true">
            <img src={frame.image.src} alt="" loading="lazy" />
          </div>
        ) : null}
        <div className="frame-text-body">
          {variant === 'quote'
            ? <blockquote className="frame-quote"><p>{body.join(' ')}</p></blockquote>
            : body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>
    )
  }

  if (frame.type === 'photo') {
    const width = frame.width || 'standard'
    const cls = story
      ? `frame frame-photo frame-w-${width}`
      : `frame frame-photo ${width === 'standard' ? 'unit-single' : width === 'narrow' ? 'frame-w-narrow-gallery' : 'unit-wide'}`
    return (
      <section {...common} className={`${cls}${tone}`}>
        <Frame image={frame.image} eager={index === 0} />
        {frame.caption && frame.caption.trim() ? <p className="frame-caption">{frame.caption}</p> : null}
      </section>
    )
  }

  if (frame.type === 'pair') {
    return (
      <section {...common} className={`${story ? 'frame frame-pair-story' : 'unit unit-pair'}${tone}`}>
        {(frame.images || []).slice(0, 2).map((im, i) => {
          const ar = im.w && im.h ? im.w / im.h : 1
          return <Frame key={i} image={im} style={{ flexGrow: ar, flexBasis: 0 }} />
        })}
      </section>
    )
  }

  if (frame.type === 'breath') {
    return <section {...common} className={`frame frame-breath frame-breath-${frame.size || 'm'}${tone}`} aria-hidden="true" />
  }

  if (frame.type === 'end') {
    return (
      <section {...common} className={`frame frame-end ${story ? 'frame-end-story' : 'frame-end-gallery'}${tone}`}>
        <EndContent frame={frame} project={project} nextProject={nextProject} autoEnd={autoEnd} />
      </section>
    )
  }

  return null
}

// Renders a project's whole frame sequence. In story mode, a project with
// no explicit end frame gets an automatic colophon appended.
export function ProjectFrames({ project, nextProject = null }) {
  const presentation = project.presentation || {}
  const mode = presentation.mode === 'story' ? 'story' : 'gallery'
  const defaultTransition = presentation.defaultTransition || (mode === 'story' ? 'fade' : 'cut')
  const frames = project.frames || []
  const hasEnd = frames.some(f => f.type === 'end')
  return (
    <div className={`project-frames project-frames-${mode}`}>
      {frames.map((f, i) => (
        <FrameView
          key={i}
          frame={f}
          index={i}
          mode={mode}
          defaultTransition={defaultTransition}
          project={project}
          nextProject={nextProject}
        />
      ))}
      {mode === 'story' && !hasEnd ? (
        <FrameView
          frame={{ type: 'end' }}
          index={frames.length}
          mode={mode}
          defaultTransition={defaultTransition}
          project={project}
          nextProject={nextProject}
          autoEnd
        />
      ) : null}
    </div>
  )
}
