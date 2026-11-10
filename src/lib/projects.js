export async function loadProjects() {
  const idxRes = await fetch('/data/projects-index.json', { cache: 'no-cache' })
  const index = await idxRes.json()
  const projects = []
  for (const entry of index) {
    const res = await fetch(`/data/projects/${entry.file}`, { cache: 'no-cache' })
    projects.push(await res.json())
  }
  return projects
}

export function firstImage(project) {
  for (const unit of project.units || []) {
    if (unit.images && unit.images.length) return unit.images[0]
  }
  return null
}

export function validateProject(data) {
  if (!data || typeof data !== 'object') return 'Not a JSON object.'
  if (!Array.isArray(data.units)) return 'Missing "units" array.'
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
