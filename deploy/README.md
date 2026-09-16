# Production deployment record

`https://moonlightcherry.xyz` is live. This documents what's actually
running and how to operate it — not a forward-looking checklist anymore.
`dev.moonlightcherry.xyz` is untouched and keeps working independently.

## Architecture

- **Separate checkout**: `/srv/moonlightcherry/app`, its own git clone —
  never the dev directory (`/home/jovan/moonlightcherry`), so an active dev
  session editing/building there can never touch the live site.
- **Separate database, separate credentials**: `moonlightcherry_prod`, a
  distinct Postgres *database and role* in the same container dev's
  `moonlightcherry` database already runs in — not just a different
  database under dev's login, a fully separate role/password.
- **Separate port**: the app runs on `3001` (`next start -p 3001`), not
  Next's default `3000`, which dev already occupies on this host.
- **Media storage**: `/srv/moonlightcherry/storage/media`, outside any repo
  checkout — the app directory isn't safe from being wiped by a redeploy.
- **Caddy** terminates TLS using a Cloudflare Origin CA certificate
  (`/etc/caddy/certs/`, 15-year validity) — not Caddy's automatic Let's
  Encrypt, which doesn't work cleanly behind a Cloudflare-proxied record —
  and reverse-proxies to `localhost:3001`. It also serves `/media/*`
  directly off disk, bypassing Node for the actual bytes.
- **Firewall**: ports 80/443 only accept traffic from Cloudflare's published
  IP ranges (`deploy/allow-cloudflare-only.sh`) — traffic that bypasses
  Cloudflare also bypasses the CSAM Scanning Tool, so this isn't optional
  hardening, it's load-bearing for that protection actually working.
- **Backups**: a systemd timer runs `deploy/backup.sh` daily (Postgres dump
  + media tarball, 14-day local retention). `BACKUP_REMOTE_DEST` is unset,
  so this is **local-only** right now — not truly durable against this
  disk failing. Set it to an rclone/rsync destination when that matters.

## A real bug found and fixed during launch verification

`AUTH_URL` wasn't set, and the app generated OAuth callback URLs pointing at
its internal `localhost:3001` bind address instead of the public domain —
`trustHost: true`'s header-based inference isn't reliable enough on its own
behind a reverse proxy, per Auth.js's own deployment docs. Fixed by adding
`AUTH_URL="https://moonlightcherry.xyz/auth"` to production's `.env` and
restarting — confirmed via `/auth/providers` before and after. Dev never hit
this because `next dev -H dev.moonlightcherry.xyz` binds directly to the
real hostname, so there's no proxy/header-inference step to get wrong there.

## Operating this

**Ship an update:**
```bash
cd /srv/moonlightcherry/app && ./deploy/deploy.sh
```
Pulls `main`, installs deps, runs `prisma db push` (this project uses
`db push`, not migration files — no rollback path, applies directly),
rebuilds, restarts both services.

**Logs:**
```bash
journalctl -u moonlightcherry -u moonlightcherry-worker -f
```

**Manual backup / restore test:**
```bash
sudo systemctl start moonlightcherry-backup.service   # runs backup.sh once, outside the daily timer
```

**Make an account admin** (run against `moonlightcherry_prod`, not dev's database):
```bash
docker exec moonlightcherry-postgres-1 psql -U moonlightcherry -d moonlightcherry_prod \
  -c "UPDATE users SET role='ADMINISTRATOR' WHERE username='<username>';"
```

## Still open

- **Turnstile**: `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  are unset — ships disabled. Worth turning on for public signup; add both
  to `/srv/moonlightcherry/app/.env` and restart when ready.
- **Off-site backups**: local-only right now (see above).
- **Static IP / DDNS**: if the server's public IP isn't static, the
  Cloudflare DNS record will silently go stale whenever it changes.
