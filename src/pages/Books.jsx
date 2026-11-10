import site from '../data/site.json'
import { emailAddress } from '../App'

export default function Books() {
  return (
    <div className="books">
      <h1>Books</h1>
      <p className="books-intro">The work is made as books first. To ask about a copy, <a href={`mailto:${emailAddress()}`}>write to me</a>.</p>
      <div className="book-list">
        {site.books.map((b, i) => (
          <article key={i} className="book">
            {b.cover ? <img className="book-cover" src={b.cover} alt={`${b.title} — book cover`} loading="lazy" /> : null}
            <div className="book-body">
              <h2>{b.title}</h2>
              <p className="book-details">{b.details}</p>
              <p>{b.description}</p>
              {b.link ? <p><a href={b.link} target="_blank" rel="noreferrer">View on Blurb →</a></p> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
