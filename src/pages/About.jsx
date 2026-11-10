import site from '../data/site.json'
import { emailAddress } from '../App'

export default function About() {
  const email = emailAddress()
  return (
    <div className="about">
      <h1>About</h1>
      {site.portrait ? (
        <figure className="about-portrait">
          <img src={site.portrait} alt="Jesse Angelo" />
        </figure>
      ) : null}
      <div className="about-text">
        {site.about.map((p, i) => (
          i === site.about.length - 1
            ? <blockquote key={i} className="about-quote">{p}</blockquote>
            : <p key={i}>{p}</p>
        ))}
      </div>
      <section className="about-cv">
        <h2>Exhibitions</h2>
        <ul>
          {site.cv.map((c, i) => (
            <li key={i}><span className="cv-year">{c.year}</span> {c.text}</li>
          ))}
        </ul>
      </section>
      <p className="about-contact">Contact: <a href={`mailto:${email}`}>{email}</a></p>
    </div>
  )
}
