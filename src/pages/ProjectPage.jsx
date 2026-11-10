import { Link, useParams } from 'react-router-dom'
import { useProjects } from '../App'
import Unit from '../components/Unit'

export default function ProjectPage() {
  const { slug } = useParams()
  const { projects, loading, error } = useProjects()
  if (loading) return <p className="status">Loading…</p>
  if (error) return <p className="status">Couldn’t load the projects. {error}</p>
  const i = projects.findIndex(p => p.slug === slug)
  if (i === -1) return <p className="status">Project not found. <Link to="/">Back to the index</Link></p>
  const project = projects[i]
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
