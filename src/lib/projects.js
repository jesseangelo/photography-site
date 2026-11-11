import site from '../data/site.json'

export function slugify(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// End frames reference a book by the slug of its title in site.json.
export function bookForSlug(slug) {
  if (!slug) return null
  return (site.books || []).find(b => slugify(b.title) === slug) || null
}

export const FRAME_TYPES = ['title', 'section', 'text', 'photo', 'pair', 'breath', 'end']
export const FRAME_TRANSITIONS = ['cut', 'fade', 'throughBlack', 'rise', 'reveal']
export const FRAME_WIDTHS = ['narrow', 'standard', 'wide', 'bleed']
export const TEXT_VARIANTS = ['statement', 'interstitial', 'quote']
export const BREATH_SIZES = ['s', 'm', 'l', 'full']
export const FRAME_TONES = ['paper', 'ink']

export async function loadProjects() {
  const idxRes = await fetch('/data/projects-index.json', { cache: 'no-cache' })
  const index = await idxRes.json()
  const projects = []
  for (const entry of index) {
    const res = await fetch(`/data/projects/${entry.file}`, { cache: 'no-cache' })
    const project = await res.json()
    if (entry.hidden) {
      // Non-enumerable on purpose: the app can read it, but it never leaks
      // into admin JSON exports (hidden lives in the index, not the project).
      Object.defineProperty(project, 'hidden', { value: true, enumerable: false })
    }
    projects.push(project)
  }
  return projects
}

export function imageAlt(image) {
  if (!image) return ''
  return image.alt ?? image.title ?? ''
}

export function firstImage(project) {
  for (const frame of project.frames || []) {
    if (frame.type === 'photo' && frame.image) return { src: frame.image.src, title: imageAlt(frame.image) }
    if (frame.type === 'pair' && frame.images && frame.images.length) return { src: frame.images[0].src, title: imageAlt(frame.images[0]) }
    if (frame.type === 'title' && frame.image) return { src: frame.image.src, title: imageAlt(frame.image) }
  }
  for (const unit of project.units || []) {
    if (unit.images && unit.images.length) return unit.images[0]
  }
  return null
}

export function validateProject(data) {
  if (!data || typeof data !== 'object') return 'Not a JSON object.'
  if (Array.isArray(data.frames)) return validateFrames(data.frames)
  if (!Array.isArray(data.units)) return 'Missing "units" or "frames" array.'
  const types = ['single', 'pair', 'wide', 'title', 'text']
  for (let i = 0; i < data.units.length; i++) {
    const u = data.units[i]
    if (!types.includes(u.type)) return `Unit ${i + 1}: type must be one of ${types.join(', ')}.`
    if (u.type === 'title' || u.type === 'text') {
      if (typeof u.text !== 'string') return `Unit ${i + 1}: text units need a "text" string.`
    } else {
      if (!Array.isArray(u.images) || !u.images.length) return `Unit ${i + 1}: image units need an "images" array.`
    }
  }
  return null
}

function validateFrames(frames) {
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i]
    const n = `Frame ${i + 1}`
    if (!FRAME_TYPES.includes(f.type)) return `${n}: type must be one of ${FRAME_TYPES.join(', ')}.`
    if (f.enter && !FRAME_TRANSITIONS.includes(f.enter)) return `${n}: enter must be one of ${FRAME_TRANSITIONS.join(', ')}.`
    if (f.type === 'title' && typeof f.title !== 'string') return `${n}: title frames need a "title" string.`
    if (f.type === 'section' && !f.title && !f.label) return `${n}: section frames need a "title" or a "label".`
    if (f.type === 'text' && typeof f.body !== 'string') return `${n}: text frames need a "body" string.`
    if (f.type === 'photo') {
      if (!f.image || typeof f.image !== 'object') return `${n}: photo frames need an "image" object.`
      if (f.width && !FRAME_WIDTHS.includes(f.width)) return `${n}: width must be one of ${FRAME_WIDTHS.join(', ')}.`
    }
    if (f.type === 'pair' && (!Array.isArray(f.images) || !f.images.length)) return `${n}: pair frames need an "images" array.`
    if (f.type === 'breath' && f.size && !BREATH_SIZES.includes(f.size)) return `${n}: breath size must be one of ${BREATH_SIZES.join(', ')}.`
  }
  return null
}

export function normalizeUnit(unit) {
  const u = { ...unit }
  if (u.type === 'title' || u.type === 'text') {
    return { type: u.type, text: u.text || '' }
  }
  const imgs = (u.images || []).map(im => ({ title: im.title || '', src: im.src || '' }))
  if (u.type === 'pair') {
    while (imgs.length < 2) imgs.push({ title: '', src: '' })
    u.images = imgs.slice(0, 2)
  } else {
    u.images = imgs.slice(0, 1)
    if (!u.images.length) u.images = [{ title: '', src: '' }]
  }
  return u
}

export function normalizeImage(image) {
  if (!image || typeof image !== 'object') return { src: '', alt: '' }
  const out = { ...image }
  out.src = out.src || ''
  if (out.alt == null) out.alt = out.title || ''
  if (out.title != null && out.title === out.alt) delete out.title
  return out
}

export function normalizeFrame(frame) {
  const f = { ...frame }
  if (f.type === 'title') {
    f.title = f.title || ''
    if (f.image) f.image = normalizeImage(f.image)
  } else if (f.type === 'text') {
    f.variant = f.variant || 'statement'
    f.body = f.body || ''
    if (f.image) f.image = normalizeImage(f.image)
  } else if (f.type === 'photo') {
    f.image = normalizeImage(f.image)
    f.width = f.width || 'standard'
  } else if (f.type === 'pair') {
    const imgs = (f.images || []).map(normalizeImage)
    while (imgs.length < 2) imgs.push({ src: '', alt: '' })
    f.images = imgs.slice(0, 2)
  } else if (f.type === 'breath') {
    f.size = f.size || 'm'
  }
  return f
}
