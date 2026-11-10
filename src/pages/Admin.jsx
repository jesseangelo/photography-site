import { useEffect, useMemo, useRef, useState } from 'react'
import { useProjects } from '../App'
import {
  validateProject, normalizeUnit, normalizeFrame,
  FRAME_TRANSITIONS, FRAME_WIDTHS, TEXT_VARIANTS, BREATH_SIZES
} from '../lib/projects'
import Unit from '../components/Unit'
import { ProjectFrames } from '../components/FrameView'

const TYPES = [
  { id: 'single', label: 'Single' },
  { id: 'pair', label: 'Diptych' },
  { id: 'wide', label: 'Spread' },
  { id: 'title', label: 'Title page' },
  { id: 'text', label: 'Text page' }
]
const FRAME_TYPE_LIST = [
  { id: 'title', label: 'Title' },
  { id: 'section', label: 'Section' },
  { id: 'text', label: 'Text' },
  { id: 'photo', label: 'Photo' },
  { id: 'pair', label: 'Diptych (legacy)' },
  { id: 'breath', label: 'Breath' },
  { id: 'end', label: 'End' }
]
const draftKey = slug => `ja-admin-draft-${slug}`
const clone = o => JSON.parse(JSON.stringify(o))

function defaultFrame(type, text) {
  switch (type) {
    case 'title': return { type: 'title', title: text || 'Untitled' }
    case 'section': return { type: 'section', title: text || '' }
    case 'text': return { type: 'text', variant: 'statement', body: text || '' }
    case 'photo': return { type: 'photo', image: { src: '', alt: text || '' }, width: 'standard' }
    case 'pair': return { type: 'pair', images: [{ src: '', alt: text || '' }, { src: '', alt: '' }] }
    case 'breath': return { type: 'breath', size: 'm' }
    case 'end': return { type: 'end', showNext: true }
    default: return { type: 'photo', image: { src: '', alt: '' }, width: 'standard' }
  }
}

function ImageFields({ image, onChange }) {
  const im = image || {}
  const set = (field, value) => onChange({ ...im, [field]: value })
  return (
    <div className="admin-frame-fields">
      <label className="full">Image file
        <input placeholder="/images/project/file.jpg" value={im.src || ''} onChange={e => set('src', e.target.value)} />
      </label>
      <label>Alt text
        <input placeholder="Describes the image" value={im.alt ?? im.title ?? ''} onChange={e => set('alt', e.target.value)} />
      </label>
      <label>Mobile file (optional)
        <input placeholder="/images/project/file-mobile.jpg" value={im.mobileSrc || ''} onChange={e => set('mobileSrc', e.target.value)} />
      </label>
      <label>Width px
        <input type="number" value={im.w || ''} onChange={e => set('w', e.target.value === '' ? undefined : Number(e.target.value))} />
      </label>
      <label>Height px
        <input type="number" value={im.h || ''} onChange={e => set('h', e.target.value === '' ? undefined : Number(e.target.value))} />
      </label>
    </div>
  )
}

function FrameFields({ frame, update }) {
  const set = patch => update({ ...frame, ...patch })
  return (
    <div>
      <div className="admin-frame-fields" style={{ marginBottom: 8 }}>
        <label>Transition in
          <select value={frame.enter || ''} onChange={e => set({ enter: e.target.value || undefined })}>
            <option value="">Project default</option>
            {FRAME_TRANSITIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>Tone
          <select value={frame.tone || ''} onChange={e => set({ tone: e.target.value || undefined })}>
            <option value="">Inherit</option>
            <option value="paper">paper</option>
            <option value="ink">ink</option>
          </select>
        </label>
      </div>

      {frame.type === 'title' && (
        <div className="admin-frame-fields">
          <label className="full">Title
            <input value={frame.title || ''} onChange={e => set({ title: e.target.value })} />
          </label>
          <label>Subtitle
            <input value={frame.subtitle || ''} onChange={e => set({ subtitle: e.target.value })} />
          </label>
          <label>Label
            <input value={frame.label || ''} onChange={e => set({ label: e.target.value })} />
          </label>
          <div className="full"><ImageFields image={frame.image} onChange={image => set({ image })} /></div>
        </div>
      )}

      {frame.type === 'section' && (
        <div className="admin-frame-fields">
          <label>Label
            <input value={frame.label || ''} onChange={e => set({ label: e.target.value })} />
          </label>
          <label>Title
            <input value={frame.title || ''} onChange={e => set({ title: e.target.value })} />
          </label>
          <label className="full">Note
            <input value={frame.note || ''} onChange={e => set({ note: e.target.value })} />
          </label>
        </div>
      )}

      {frame.type === 'text' && (
        <div className="admin-frame-fields">
          <label>Variant
            <select value={frame.variant || 'statement'} onChange={e => set({ variant: e.target.value })}>
              {TEXT_VARIANTS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="full">Body (blank line = new paragraph)
            <textarea rows={6} value={frame.body || ''} onChange={e => set({ body: e.target.value })} />
          </label>
          <div className="full"><ImageFields image={frame.image} onChange={image => set({ image })} /></div>
        </div>
      )}

      {frame.type === 'photo' && (
        <div>
          <div className="admin-unit-head" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--quiet)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Width</span>
            <div className="admin-type-seg">
              {FRAME_WIDTHS.map(w => (
                <button key={w} className={(frame.width || 'standard') === w ? 'active' : ''} onClick={() => set({ width: w })}>{w}</button>
              ))}
            </div>
          </div>
          <ImageFields image={frame.image} onChange={image => set({ image })} />
          <div className="admin-frame-fields" style={{ marginTop: 8 }}>
            <label className="full">Caption (leave empty to hide)
              <input value={frame.caption || ''} onChange={e => set({ caption: e.target.value })} />
            </label>
          </div>
        </div>
      )}

      {frame.type === 'pair' && (
        <div>
          {(frame.images || []).map((im, j) => (
            <div key={j} style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--quiet)', margin: '0 0 6px' }}>Image {j + 1}</p>
              <ImageFields image={im} onChange={image => {
                const images = (frame.images || []).slice()
                images[j] = image
                set({ images })
              }} />
            </div>
          ))}
        </div>
      )}

      {frame.type === 'breath' && (
        <div className="admin-unit-head">
          <span style={{ fontSize: 12, color: 'var(--quiet)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Size</span>
          <div className="admin-type-seg">
            {BREATH_SIZES.map(s => (
              <button key={s} className={(frame.size || 'm') === s ? 'active' : ''} onClick={() => set({ size: s })}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {frame.type === 'end' && (
        <div className="admin-frame-fields">
          <label className="full">Closing text
            <textarea rows={3} value={frame.text || ''} onChange={e => set({ text: e.target.value })} />
          </label>
          <label>Book slug (optional)
            <input placeholder="none-of-this-belongs-here" value={frame.bookSlug || ''} onChange={e => set({ bookSlug: e.target.value })} />
          </label>
          <label className="admin-check">
            <input type="checkbox" checked={frame.showNext !== false} onChange={e => set({ showNext: e.target.checked })} />
            Show next-project link
          </label>
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  const { projects, loading, error } = useProjects()
  const [slug, setSlug] = useState(null)
  const [project, setProject] = useState(null)
  const [jsonText, setJsonText] = useState('')
  const [jsonDirty, setJsonDirty] = useState(false)
  const [jsonMsg, setJsonMsg] = useState('')
  const [dragIdx, setDragIdx] = useState(null)
  const [addType, setAddType] = useState('single')
  const [addTitle, setAddTitle] = useState('')
  const [addPartner, setAddPartner] = useState('')
  const dirtyRef = useRef(false)

  const isFrames = !!project && Array.isArray(project.frames)
  const itemKey = isFrames ? 'frames' : 'units'
  const items = useMemo(() => (project ? (project[itemKey] || []) : []), [project, itemKey])
  const typeList = isFrames ? FRAME_TYPE_LIST : TYPES

  useEffect(() => {
    if (!slug && projects.length) setSlug(projects[0].slug)
  }, [projects, slug])

  useEffect(() => {
    setAddType(isFrames ? 'photo' : 'single')
  }, [isFrames])

  useEffect(() => {
    if (!slug) return
    const published = projects.find(p => p.slug === slug)
    if (!published) return
    let initial = clone(published)
    try {
      const saved = localStorage.getItem(draftKey(slug))
      if (saved) initial = JSON.parse(saved)
    } catch { /* ignore */ }
    setProject(initial)
    setJsonMsg('')
    setJsonDirty(false)
    dirtyRef.current = false
  }, [slug, projects])

  useEffect(() => {
    if (project && !dirtyRef.current) setJsonText(JSON.stringify(project, null, 2))
  }, [project])

  const save = next => {
    setProject(next)
    try { localStorage.setItem(draftKey(next.slug), JSON.stringify(next)) } catch { /* ignore */ }
  }

  const updateField = (field, value) => save({ ...project, [field]: value })
  const updatePresentation = patch =>
    save({ ...project, presentation: { ...(project.presentation || {}), ...patch } })
  const updateItem = (i, item) => {
    const list = items.slice()
    list[i] = item
    save({ ...project, [itemKey]: list })
  }
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const list = items.slice()
    ;[list[i], list[j]] = [list[j], list[i]]
    save({ ...project, [itemKey]: list })
  }
  const removeItem = i => save({ ...project, [itemKey]: items.filter((_, idx) => idx !== i) })
  const reorder = (from, to) => {
    if (from === to || from == null) return
    const list = items.slice()
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved)
    save({ ...project, [itemKey]: list })
  }
  const addItem = () => {
    if (isFrames) {
      save({ ...project, frames: [...items, defaultFrame(addType, addTitle)] })
    } else {
      let unit
      if (addType === 'title' || addType === 'text') {
        unit = { type: addType, text: addTitle }
      } else if (addType === 'pair') {
        unit = { type: 'pair', images: [{ title: addTitle, src: '' }, { title: addPartner, src: '' }] }
      } else {
        unit = { type: addType, images: [{ title: addTitle, src: '' }] }
      }
      save({ ...project, units: [...items, normalizeUnit(unit)] })
    }
    setAddTitle(''); setAddPartner('')
  }
  const applyJson = () => {
    let data
    try { data = JSON.parse(jsonText) } catch (e) { setJsonMsg(`That JSON doesn’t parse: ${e.message}`); return }
    const problem = validateProject(data)
    if (problem) { setJsonMsg(problem); return }
    data.slug = slug
    if (Array.isArray(data.frames)) data.frames = data.frames.map(normalizeFrame)
    else data.units = data.units.map(normalizeUnit)
    save(data)
    setJsonDirty(false); dirtyRef.current = false
    setJsonMsg('Applied. The editor and preview now match the JSON.')
  }
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${slug}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  const reset = () => {
    const published = projects.find(p => p.slug === slug)
    try { localStorage.removeItem(draftKey(slug)) } catch { /* ignore */ }
    setProject(clone(published))
    setJsonDirty(false); dirtyRef.current = false
    setJsonMsg('Reset to the published version.')
  }

  const previewItems = useMemo(() => items, [items])

  if (loading) return <p className="status">Loading…</p>
  if (error) return <p className="status">Couldn’t load the projects. {error}</p>
  if (!project) return <p className="status">No projects found.</p>

  const presentation = project.presentation || {}

  return (
    <div className="admin">
      <h1>Admin</h1>
      <p className="admin-note">
        This page is unlinked — you’re here by bookmark. It holds no credentials and can’t publish.
        Edits save as a draft in this browser only. To publish: download the JSON, drop it into
        <code> public/data/projects/</code> in the site project (replacing the old file), and redeploy.
        New image files go in <code>public/images/&lt;project&gt;/</code> with the filename in the frame’s <em>src</em> field.
        Projects marked <em>hidden</em> stay off the home index but still open by direct URL; that flag lives in
        <code> public/data/projects-index.json</code>, not in the project JSON.
      </p>

      <div className="admin-switcher">
        {projects.map(p => (
          <button key={p.slug} className={p.slug === slug ? 'active' : ''} onClick={() => setSlug(p.slug)}>
            {p.title}{p.hidden ? ' · hidden' : ''}
          </button>
        ))}
      </div>

      <section className="admin-fields">
        <label>Title <input value={project.title || ''} onChange={e => updateField('title', e.target.value)} /></label>
        <label>Year <input value={project.year || ''} onChange={e => updateField('year', e.target.value)} /></label>
        <label className="wide-field">Intro <textarea rows={2} value={project.intro || ''} onChange={e => updateField('intro', e.target.value)} /></label>
        <label className="wide-field">Statement <textarea rows={3} value={project.statement || ''} onChange={e => updateField('statement', e.target.value)} /></label>
      </section>

      {isFrames && (
        <section className="admin-presentation">
          <h2>Presentation</h2>
          <div className="admin-presentation-grid">
            <label>Mode
              <select value={presentation.mode || 'gallery'} onChange={e => updatePresentation({ mode: e.target.value })}>
                <option value="gallery">gallery</option>
                <option value="story">story</option>
              </select>
            </label>
            <label>Theme
              <select value={presentation.theme || (presentation.mode === 'story' ? 'dark' : 'light')} onChange={e => updatePresentation({ theme: e.target.value })}>
                <option value="light">light</option>
                <option value="dark">dark</option>
              </select>
            </label>
            <label>Default transition
              <select value={presentation.defaultTransition || ''} onChange={e => updatePresentation({ defaultTransition: e.target.value || undefined })}>
                <option value="">Mode default</option>
                {FRAME_TRANSITIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>Snap (story mode)
              <select value={presentation.snap || ''} onChange={e => updatePresentation({ snap: e.target.value || undefined })}>
                <option value="">Default</option>
                <option value="soft">soft</option>
                <option value="off">off</option>
              </select>
            </label>
          </div>
        </section>
      )}

      <section className="admin-units">
        {items.map((item, i) => (
          <div
            key={i}
            className="admin-unit"
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => { reorder(dragIdx, i); setDragIdx(null) }}
          >
            <div className="admin-unit-head">
              <span className="admin-unit-num">#{i + 1}</span>
              <div className="admin-type-seg">
                {typeList.map(t => (
                  <button key={t.id} className={item.type === t.id ? 'active' : ''}
                    onClick={() => updateItem(i, isFrames ? normalizeFrame({ ...item, type: t.id }) : normalizeUnit({ ...item, type: t.id }))}>{t.label}</button>
                ))}
              </div>
              <div className="admin-unit-actions">
                <button onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                <button onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                <button onClick={() => removeItem(i)} aria-label="Remove">✕</button>
              </div>
            </div>
            {isFrames ? (
              <FrameFields frame={item} update={item2 => updateItem(i, item2)} />
            ) : (item.type === 'title' || item.type === 'text') ? (
              <textarea className="admin-unit-text" rows={item.type === 'text' ? 6 : 2}
                value={item.text || ''} onChange={e => updateItem(i, { ...item, text: e.target.value })} />
            ) : (
              <div className="admin-unit-images">
                {(item.images || []).map((im, j) => (
                  <div key={j} className="admin-image-fields">
                    <input placeholder="Frame title" value={im.title || ''}
                      onChange={e => {
                        const images = item.images.slice(); images[j] = { ...images[j], title: e.target.value }
                        updateItem(i, { ...item, images })
                      }} />
                    <input placeholder="/images/project/file.jpg" value={im.src || ''}
                      onChange={e => {
                        const images = item.images.slice(); images[j] = { ...images[j], src: e.target.value }
                        updateItem(i, { ...item, images })
                      }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="admin-add">
        <h2>Add a {isFrames ? 'frame' : 'unit'}</h2>
        <div className="admin-add-row">
          <select value={addType} onChange={e => setAddType(e.target.value)}>
            {typeList.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input placeholder={addType === 'title' || addType === 'text' ? 'Page text' : 'Frame title'} value={addTitle} onChange={e => setAddTitle(e.target.value)} />
          {!isFrames && addType === 'pair' && <input placeholder="Partner frame title" value={addPartner} onChange={e => setAddPartner(e.target.value)} />}
          <button onClick={addItem}>Add</button>
        </div>
      </section>

      <section className="admin-preview">
        <h2>Visitor preview</h2>
        <div className="admin-preview-box">
          <h1>{project.title}</h1>
          {project.intro ? <p className="project-intro">{project.intro}</p> : null}
          {isFrames
            ? <ProjectFrames project={project} />
            : previewItems.map((u, idx) => <Unit key={idx} unit={u} />)}
        </div>
      </section>

      <section className="admin-json">
        <h2>JSON</h2>
        <textarea rows={16} value={jsonText} onChange={e => { setJsonText(e.target.value); setJsonDirty(true); dirtyRef.current = true }} />
        {jsonMsg ? <p className="admin-json-msg">{jsonMsg}</p> : null}
        <div className="admin-json-actions">
          <button onClick={applyJson}>Apply JSON</button>
          <button onClick={downloadJson}>Download JSON</button>
          <button onClick={reset}>Reset to published</button>
          {jsonDirty ? <span className="admin-dirty">JSON edited — not yet applied</span> : null}
        </div>
      </section>
    </div>
  )
}
