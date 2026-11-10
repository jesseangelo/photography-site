#!/usr/bin/env bash
# Deploy jesseangelo.com (test + production share this bucket/distribution for now)
# Run from the site/ folder on a machine logged into Jesse's AWS account.
set -euo pipefail

BUCKET="jesseangelo-site"
DIST_ID="E35CI1D6PUFL2O"

npm run build

# Web-size copies for upload (dist only; public/ originals untouched)
bash scripts/optimize-images.sh

# App shell + assets: normal caching
aws s3 sync dist/ "s3://${BUCKET}" --delete --exclude "data/*"
# Project data: no-cache so JSON edits show up immediately
aws s3 sync dist/data/ "s3://${BUCKET}/data/" --delete --cache-control "no-cache"

aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths "/*" > /dev/null
echo "Deployed and invalidation requested. Check https://test.jesseangelo.com/"
