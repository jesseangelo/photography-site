import { Link } from 'react-router-dom'
import { useProjects, emailAddress } from '../App'
import Frame from '../components/Frame'
import { firstImage } from '../lib/projects'

export default function Home() {
  const { projects, loading, error } = useProjects()
  if (loading) return <p className="status">Loading…</p>
  if (error) return <p className="status">Couldn’t load the projects. {error}</p>
  return (
    <div className="home">
      <section className="home-intro">
        <h1>Photographs, made as books.</h1>
        <p>Sequenced bodies of work from the High Plains, Brooklyn, and the neighborhood at dusk. For prints or books, <a href={`mailto:${emailAddress()}`}>write to me</a>.</p>
      </section>
      <section className="project-index">
        {projects.map(p => {
          const img = firstImage(p)
          return (
            <Link key={p.slug} to={`/projects/${p.slug}`} className="project-card">
              {img ? <Frame image={img} wide /> : null}
              <div className="project-card-meta">
                <h2>{p.title}</h2>
                {p.year ? <span className="project-year">{p.year}</span> : null}
              </div>
              {p.intro ? <p className="project-intro">{p.intro}</p> : null}
            </Link>
          )
        })}
      </section>
    </div>
  )
}
