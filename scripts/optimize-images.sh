#!/usr/bin/env bash
# Shrink dist/images JPEGs to web size using macOS sips (built in, nothing to install).
# Max 2400px on the long edge, JPEG quality 80. Run AFTER `npm run build`, BEFORE upload.
# Only dist/ is touched — the full-size originals in public/ are never modified.
set -euo pipefail

count=0
while IFS= read -r -d '' f; do
  sips -Z 2400 --setProperty formatOptions 80 "$f" > /dev/null
  count=$((count+1))
done < <(find dist/images -type f -name "*.jpg" -print0)
echo "Optimized ${count} images in dist/images"
du -sh dist/images
