import Frame from './Frame'

export default function Unit({ unit }) {
  if (unit.type === 'title') {
    return (
      <section className="unit unit-title">
        <h2>{unit.text}</h2>
      </section>
    )
  }
  if (unit.type === 'text') {
    const paras = String(unit.text || '').split(/\n\s*\n/).filter(Boolean)
    return (
      <section className="unit unit-text">
        {paras.map((p, i) => <p key={i}>{p}</p>)}
      </section>
    )
  }
  if (unit.type === 'pair') {
    return (
      <section className="unit unit-pair">
        {(unit.images || []).slice(0, 2).map((im, i) => {
          const ar = im.w && im.h ? im.w / im.h : 1
          return <Frame key={i} image={im} style={{ flexGrow: ar, flexBasis: 0 }} />
        })}
      </section>
    )
  }
  if (unit.type === 'wide') {
    return (
      <section className="unit unit-wide">
        <Frame image={(unit.images || [])[0]} wide />
      </section>
    )
  }
  return (
    <section className="unit unit-single">
      <Frame image={(unit.images || [])[0]} />
    </section>
  )
}
