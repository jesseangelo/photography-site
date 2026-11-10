# jesseangelo.com — React site

Static React + Vite site. Content is data, not code.

## Pages
- `/` — project index (one cover frame + title per project)
- `/projects/<slug>` — sequenced project page built from units:
  `single` / `pair` (diptych) / `wide` (full-width spread) / `title` (book title page) / `text` (statement page)
- `/books` — the books, with outbound links when provided
- `/about` — bio, statement, exhibitions, email link
- `/admin` — **unlinked** editor (bookmark it). No credentials, cannot publish.

## How content works
- Project JSON lives in `public/data/projects/<slug>.json`, listed in
  `public/data/projects-index.json`. The app fetches it at runtime, so a
  content update is just a new JSON file — no rebuild of the app code.
- Edit in `/admin`: reorder (drag or ↑ ↓), switch unit types, edit titles,
  text pages, filenames; drafts auto-save in that browser. Download the JSON,
  replace the file in `public/data/projects/`, redeploy.
- Images live in `public/images/<slug>/`; each frame's expected filename is
  the `src` field in the JSON. Missing files render as a labeled placeholder.
- About/Books/CV content is in `src/data/site.json` (changes need a rebuild).

## Develop / build
```
npm install
npm run dev      # local dev server
npm run build    # outputs dist/
npm run preview  # serve dist/ locally
```

## Deploy (AWS)
Bucket `jesseangelo-site` (us-west-1) behind CloudFront distribution
`E35CI1D6PUFL2O` (test.jesseangelo.com). From a machine logged into the AWS
account: `./scripts/deploy.sh`

**One-time CloudFront setting (needed for project URLs):** in the
distribution's Custom error responses, map **403 → /index.html (200)** and
**404 → /index.html (200)** so deep links like `/projects/...` and `/admin`
load the app instead of an error. (The S3 origin answers 403 for paths that
aren't real files; the app router takes it from there.)
