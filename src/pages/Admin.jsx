import { useEffect, useMemo, useRef, useState } from 'react'
import { useProjects } from '../App'
import { validateProject, normalizeUnit } from '../lib/projects'
import Unit from '../components/Unit'

const TYPES = [
  { id: 'single', label: 'Single' },
  { id: 'pair', label: 'Diptych' },
  { id: 'wide', label: 'Spread' },
  { id: 'title', label: 'Title page' },
  { id: 'text', label: 'Text page' }
]
const draftKey = slug => `ja-admin-draft-${slug}`
const clone = o => JSON.parse(JSON.stringify(o))

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

  useEffect(() => {
    if (!slug && projects.length) setSlug(projects[0].slug)
  }, [projects, slug])

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
  const updateUnit = (i, unit) => {
    const units = project.units.slice()
    units[i] = unit
    save({ ...project, units })
  }
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= project.units.length) return
    const units = project.units.slice()
    ;[units[i], units[j]] = [units[j], units[i]]
    save({ ...project, units })
  }
  const removeUnit = i => save({ ...project, units: project.units.filter((_, idx) => idx !== i) })
  const reorder = (from, to) => {
    if (from === to || from == null) return
    const units = project.units.slice()
    const [moved] = units.splice(from, 1)
    units.splice(to, 0, moved)
    save({ ...project, units })
  }
  const addUnit = () => {
    let unit
    if (addType === 'title' || addType === 'text') {
      unit = { type: addType, text: addTitle }
    } else if (addType === 'pair') {
      unit = { type: 'pair', images: [ { title: addTitle, src: '' }, { title: addPartner, src: '' } ] }
    } else {
      unit = { type: addType, images: [ { title: addTitle, src: '' } ] }
    }
    save({ ...project, units: [...project.units, normalizeUnit(unit)] })
    setAddTitle(''); setAddPartner('')
  }
  const applyJson = () => {
    let data
    try { data = JSON.parse(jsonText) } catch (e) { setJsonMsg(`That JSON doesn’t parse: ${e.message}`); return }
    const problem = validateProject(data)
    if (problem) { setJsonMsg(problem); return }
    data.slug = slug
    data.units = data.units.map(normalizeUnit)
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

  const previewUnits = useMemo(() => project ? project.units : [], [project])

  if (loading) return <p className="status">Loading…</p>
  if (error) return <p className="status">Couldn’t load the projects. {error}</p>
  if (!project) return <p className="status">No projects found.</p>

  return (
    <div className="admin">
      <h1>Admin</h1>
      <p className="admin-note">
        This page is unlinked — you’re here by bookmark. It holds no credentials and can’t publish.
        Edits save as a draft in this browser only. To publish: download the JSON, drop it into
        <code> public/data/projects/</code> in the site project (replacing the old file), and redeploy.
        New image files go in <code>public/images/&lt;project&gt;/</code> with the filename in the unit’s <em>file</em> field.
      </p>

      <div className="admin-switcher">
        {projects.map(p => (
          <button key={p.slug} className={p.slug === slug ? 'active' : ''} onClick={() => setSlug(p.slug)}>{p.title}</button>
        ))}
      </div>

      <section className="admin-fields">
        <label>Title <input value={project.title || ''} onChange={e => updateField('title', e.target.value)} /></label>
        <label>Year <input value={project.year || ''} onChange={e => updateField('year', e.target.value)} /></label>
        <label className="wide-field">Intro <textarea rows={2} value={project.intro || ''} onChange={e => updateField('intro', e.target.value)} /></label>
        <label className="wide-field">Statement <textarea rows={3} value={project.statement || ''} onChange={e => updateField('statement', e.target.value)} /></label>
      </section>

      <section className="admin-units">
        {project.units.map((unit, i) => (
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
                {TYPES.map(t => (
                  <button key={t.id} className={unit.type === t.id ? 'active' : ''}
                    onClick={() => updateUnit(i, normalizeUnit({ ...unit, type: t.id }))}>{t.label}</button>
                ))}
              </div>
              <div className="admin-unit-actions">
                <button onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                <button onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                <button onClick={() => removeUnit(i)} aria-label="Remove">✕</button>
              </div>
            </div>
            {(unit.type === 'title' || unit.type === 'text') ? (
              <textarea className="admin-unit-text" rows={unit.type === 'text' ? 6 : 2}
                value={unit.text || ''} onChange={e => updateUnit(i, { ...unit, text: e.target.value })} />
            ) : (
              <div className="admin-unit-images">
                {(unit.images || []).map((im, j) => (
                  <div key={j} className="admin-image-fields">
                    <input placeholder="Frame title" value={im.title || ''}
                      onChange={e => {
                        const images = unit.images.slice(); images[j] = { ...images[j], title: e.target.value }
                        updateUnit(i, { ...unit, images })
                      }} />
                    <input placeholder="/images/project/file.jpg" value={im.src || ''}
                      onChange={e => {
                        const images = unit.images.slice(); images[j] = { ...images[j], src: e.target.value }
                        updateUnit(i, { ...unit, images })
                      }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="admin-add">
        <h2>Add a unit</h2>
        <div className="admin-add-row">
          <select value={addType} onChange={e => setAddType(e.target.value)}>
            {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input placeholder={addType === 'title' || addType === 'text' ? 'Page text' : 'Frame title'} value={addTitle} onChange={e => setAddTitle(e.target.value)} />
          {addType === 'pair' && <input placeholder="Partner frame title" value={addPartner} onChange={e => setAddPartner(e.target.value)} />}
          <button onClick={addUnit}>Add</button>
        </div>
      </section>

      <section className="admin-preview">
        <h2>Visitor preview</h2>
        <div className="admin-preview-box">
          <h1>{project.title}</h1>
          {project.intro ? <p className="project-intro">{project.intro}</p> : null}
          {previewUnits.map((u, idx) => <Unit key={idx} unit={u} />)}
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
