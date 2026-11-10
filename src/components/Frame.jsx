import { useState } from 'react'

export default function Frame({ image, wide = false, style = undefined }) {
  const [failed, setFailed] = useState(false)
  if (!image) return null
  if (!image.src || failed) {
    return (
      <figure className={`frame frame-placeholder ${wide ? 'frame-wide' : ''}`} style={style}>
        <span className="frame-placeholder-title">{image.title || 'Untitled'}</span>
        <span className="frame-placeholder-note">image file pending</span>
      </figure>
    )
  }
  return (
    <figure className={`frame ${wide ? 'frame-wide' : ''}`} style={style}>
      <img src={image.src} alt={image.title || ''} loading="lazy" onError={() => setFailed(true)} />
    </figure>
  )
}
