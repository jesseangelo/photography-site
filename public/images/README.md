# Image drop-in folders

One folder per project, named by project slug. The filename each frame expects
is in that project's JSON (`public/data/projects/<slug>.json`, the "src" field
of each image). Export sRGB JPEGs at ~2400px on the long edge, name them to
match, and drop them in — no code changes needed. If a filename changes, update
the "src" field in the admin (/admin) and download the JSON.
