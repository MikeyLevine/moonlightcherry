#!/usr/bin/env bash
# Deploys the latest main branch: pulls, installs, applies the schema, builds,
# and restarts both services. Run from the repo root on the production host.
#
# Note: this project uses `prisma db push`, not migration files (no
# prisma/migrations directory exists) — consistent with how every phase of
# this project has applied schema changes so far. That means there's no
# migration history/rollback path; a schema change here applies directly.
# Fine at this project's size, worth revisiting if that ever becomes painful.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Pulling latest main"
git pull --ff-only origin main

echo "==> Installing dependencies"
npm ci

echo "==> Applying database schema"
npx prisma generate
npx prisma db push

echo "==> Building"
npm run build

echo "==> Restarting services"
sudo systemctl restart moonlightcherry.service
sudo systemctl restart moonlightcherry-worker.service

echo "==> Done. Tail logs with: journalctl -u moonlightcherry -u moonlightcherry-worker -f"
