import { useState } from 'react'

// One image, never cropped. `image` is { src, alt (or legacy title), w, h,
// mobileSrc? }. Missing files render as a labeled placeholder.
export default function Frame({ image, wide = false, style = undefined, eager = false }) {
  const [failed, setFailed] = useState(false)
  if (!image) return null
  const alt = image.alt ?? image.title ?? ''
  if (!image.src || failed) {
    return (
      <figure className={`frame frame-placeholder ${wide ? 'frame-wide' : ''}`} style={style}>
        <span className="frame-placeholder-title">{alt || 'Untitled'}</span>
        <span className="frame-placeholder-note">image file pending</span>
      </figure>
    )
  }
  const img = (
    <img
      src={image.src}
      alt={alt}
      width={image.w || undefined}
      height={image.h || undefined}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  )
  return (
    <figure className={`frame ${wide ? 'frame-wide' : ''}`} style={style}>
      {image.mobileSrc ? (
        <picture>
          <source media="(max-width: 640px)" srcSet={image.mobileSrc} />
          {img}
        </picture>
      ) : img}
    </figure>
  )
}
