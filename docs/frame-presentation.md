# Frame Presentation — Wireframe & Spec v1

Date: 2026-11-10
Status: Implemented on the local `frames-v1` branch, pending Jesse's
review. Source of truth for code: GitHub repo `jesseangelo/photography-site`
(first commit 9ca5308).

## Idea

Merge the launched jesseangelo.com with what worked in The Curtain POC.
A project is no longer a page of stacked units; it is a **sequence of frames**
the visitor scrolls through vertically. Each frame is an authored screen.
Transitions between frames are punctuation, not decoration: they exist to
enhance the photographs and the sequence between them.

The Curtain's time labels were content, not structure. A frame may carry an
optional label, but no project is required to have one.

## Principles (confirmed by Jesse, Nov 10, 2026)

1. **Phone-first.** Phones are a primary traffic source. Every frame is
   designed at phone width first, then enhanced for desktop — never the
   reverse.
2. **Vertical scroll is canonical.** No horizontal scroll-jacking. Frames
   live in normal document flow (good for phones, deep links, SEO, and
   accessibility).
3. **Soft snap, story mode only.** Story mode may use gentle scroll-snap
   (`proximity`, never `mandatory`). Gallery mode never snaps.
4. **Enhancement, not rigidity.** Interactivity serves the photographs.
   Any rule in this spec can be broken per-frame when the sequence earns it.
5. **Captions are per-frame opt-in, default off.** This deliberately relaxes
   the Nov 5, 2026 "no visible captions" decision: a caption appears only
   where it does narrative work. Image titles remain alt text / admin labels.
6. **Simple admin.** Multi-image layouts are pre-composited by Jesse in
   Photoshop and uploaded as a single image. The admin never learns what a
   diptych is; it only ever handles one image per photo frame.

## Presentation modes (project-level)

Set once per project in a `presentation` block; frames inherit and may
override individually.

| Setting | `story` mode | `gallery` mode |
|---|---|---|
| Scroll | Vertical, soft snap on full-height frames | Vertical, free flow |
| Theme default | Dark (`ink`) | Light (`paper`) |
| Default transition | `fade` (project may choose `throughBlack`) | `cut` |
| Frame height | Title/section frames full screen; photos auto | All auto |
| Captions | Opt-in per frame | Opt-in per frame |
| Progress UI | Optional hairline + section label | None |
| End block | End frame / auto colophon | Existing project footer + pager |

A simple gallery is therefore not a separate feature: it is a title frame
(or plain header) plus photo frames, in gallery mode.

### Index visibility

The public Projects shelf carries only serious, completed work. An index
entry may carry `"hidden": true`: the project stays off the home index but
still opens by direct URL. That is the treatment for work that is serious
but unfinished (Edgelands) and for work that is complete but book-only
(Evening Walks With Pancho).

## Frame types

Common fields for every frame:

- `type` — one of the types below.
- `enter` — transition into this frame: `cut` | `fade` | `throughBlack` |
  `rise` | `reveal`. Defaults to the project default.
- `tone` — `paper` | `ink` | inherit. Background the frame sits on.
- `label` — optional admin-only note (never rendered).

### 1. `title`
Opens a project. Fields: `title` (required), `subtitle` (optional),
`image` (optional), `label` (optional, e.g. a place or a date — the slot
the Curtain's times used to occupy).

- With image: full-screen frame, image as background, title block anchored
  lower-left, subtle scrim for legibility, small scroll cue.
- Without image: full-screen typographic frame on the frame's tone.

### 2. `section`
A hinge inside a long story. Fields: `label` (optional), `title`
(optional — at least one of label/title required), `note` (optional short
line). Renders smaller than a title frame; gets an anchor so a contents
overlay in story mode can jump to it.

### 3. `text`
Fields: `body` (paragraphs), `variant`, `image` (optional background),
`tone`.

- `statement` — full prose, left-aligned measure (~62ch desktop, full
  measure on phone).
- `interstitial` — a few lines, more air, can center.
- `quote` — one large sentence.
- Background image: text sits on a scrim; on phone, if readability suffers,
  the image moves above the text instead. Readability wins.

### 4. `photo`
Fields: `image` (required), `width`, `caption` (optional), `enter`,
`tone`.

- `width` presets: `narrow` (~720px), `standard` (~1100px), `wide`
  (~1500px), `bleed` (full viewport width).
- `image`: `src`, `w`, `h`, `alt`. Optional `mobileSrc` — an alternate
  crop/export for phones, recommended for wide Photoshop composites that
  would shrink to illegibility on a small screen. Optional `focus`
  (x/y percentages) when the frame crops to fill.
- Caption renders only when `caption` is non-empty.

### 5. `breath`
Silence as a sequencing tool. Fields: `size` — `s` | `m` | `l` | `full`
(screen height), `tone`.

### 6. `end`
Closing frame. Fields (all optional): `text` (closing line), `bookSlug`
(renders the book link/cover from the Books data), `showNext` (default
true). If a story-mode project has no explicit end frame, the renderer
appends an automatic colophon: project title/year, "All projects" link,
and next-project link.

## Transitions

Implemented with IntersectionObserver adding an active class as a frame
enters; no scroll hijacking, no JS-driven scrolling.

- `cut` — no motion. The gallery default.
- `fade` — opacity crossfade.
- `throughBlack` — the Curtain signature: the sequence dips through the
  `ink` tone between frames. Reserved for major beats; overuse flattens it.
- `rise` — frame content rises slightly while fading in.
- `reveal` — image un-clips upward as it enters.

`prefers-reduced-motion`: all transitions degrade to `cut`, snap disables.

## Wireframes

### Story mode — phone (primary)

```
┌──────────────────────┐
│ JA        ☰ / links  │
├──────────────────────┤
│ TITLE (full screen)  │
│  [image]             │
│                      │
│  EDGELANDS           │
│  Where the grid      │
│  meets the prairie   │
│                 ↓    │
├╌ fade through black ╌┤
│ PHOTO — bleed        │
│ [image, full width]  │
├──────────────────────┤
│ BREATH — ink, m      │
├──────────────────────┤
│ TEXT — interstitial  │
│  A few lines,        │
│  lots of air.        │
├──────────────────────┤
│ PHOTO — wide         │
│ [image]              │
│ caption (opt-in)     │
├──────────────────────┤
│ SECTION              │
│  The Grid            │
├──────────────────────┤
│        …             │
├──────────────────────┤
│ END                  │
│  closing line        │
│  [book link]         │
│  Next: NOTBH →       │
└──────────────────────┘
```

### Story mode — desktop

Same column, wider stage: title frame full-viewport; `wide` photos breathe
at ~1500px; text keeps its narrow measure centered in the frame; breath and
section frames gain height. Nothing changes order or gains side rails —
the phone sequence *is* the desktop sequence, with more air.

### Gallery mode (any width)

```
Project header (title, year, intro — normal flow)
PHOTO — standard
PHOTO — narrow
PHOTO — wide        (cut transitions, paper tone, no snap)
Project footer + prev/next pager (as today)
```

## Data model sketch

```json
{
  "slug": "edgelands",
  "title": "Edgelands",
  "year": "2026–",
  "presentation": {
    "mode": "story",
    "theme": "dark",
    "defaultTransition": "fade",
    "snap": "soft"
  },
  "frames": [
    { "type": "title", "title": "Edgelands",
      "subtitle": "Where the grid meets the prairie",
      "image": { "src": "hero.jpg", "w": 2400, "h": 1600, "alt": "…" },
      "enter": "cut" },
    { "type": "photo",
      "image": { "src": "span-01.jpg", "w": 2400, "h": 1350, "alt": "…" },
      "width": "bleed", "enter": "throughBlack" },
    { "type": "breath", "size": "m", "tone": "ink" },
    { "type": "text", "variant": "interstitial", "tone": "ink",
      "body": "It appeared that there was nothing there." },
    { "type": "photo",
      "image": { "src": "composite-01.jpg", "w": 2000, "h": 1200, "alt": "…" },
      "width": "wide", "caption": "One line, only where it earns its place." },
    { "type": "section", "title": "The Grid" },
    { "type": "end", "showNext": true }
  ]
}
```

## Migration from current `units`

The current renderer maps `units` in each project JSON. The frame renderer
accepts both shapes for one release:

| Old unit | New frame |
|---|---|
| `title` | `title` |
| `text` | `text` (variant `statement`) |
| `single` | `photo` (width `standard`) |
| `wide` | `photo` (width `bleed`) |
| `pair` | Legacy — keep rendering as today; new composites replace pairs going forward, admin stops offering `pair` |

Admin changes: unit list becomes frame list (type picker, drag reorder,
transition dropdown, width segmented control, caption field with an enable
toggle, presentation settings panel per project). Validation warnings:
missing image, missing alt, title frame not first (warning only — rule 4).

## Acceptance checks for a first build

- One existing project (suggest NOTBH) renders identically in gallery mode.
- One story-mode demo sequence (Edgelands draft frames) shows title,
  throughBlack photo, breath, interstitial, section, and end on a phone
  viewport and a desktop viewport.
- With reduced-motion on: no snap, no transitions, same reading order.
- Lighthouse-friendly basics: first frame image eager, the rest lazy;
  layout shift zero (frames carry w/h, as pairs already do).

## Open questions

- Contents overlay in story mode (jump-to-section): v1 or later?
- Progress hairline in story mode: DECIDED Nov 10, 2026 — keep it. In the
  Story Mode Demo Jesse singled out the progress bar and the frame
  clicker/inspector as details he loves; both are part of the system.
- Responsive image variants (srcset): current deploy optimizes to a single
  2400px/q80 file. Fine for v1; revisit if story mode makes page weight hurt
  on phones.
