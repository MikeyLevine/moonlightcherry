# Production launch checklist

`dev.moonlightcherry.xyz` keeps working throughout, unchanged — production
runs from a **separate checkout, separate database, separate port**
(`/srv/moonlightcherry/app`, its own Postgres database, port 3001 behind
Caddy) specifically so nothing about actively developing on
`dev.moonlightcherry.xyz` can ever touch the live site.

## Done already (by Claude, in the session that wrote this file)

- [x] Cloned a dedicated production checkout to `/srv/moonlightcherry/app`
      (separate from `/srv/moonlight-cherry` — an unrelated, mostly-empty
      leftover from an earlier abandoned attempt, left untouched).
- [x] Created `moonlightcherry_prod`, a genuinely separate Postgres
      **database and role** (not just a different DB under dev's login) in
      the same Postgres container dev already uses — real credential
      separation, not just data separation.
- [x] Created `/srv/moonlightcherry/storage/media` outside any repo checkout.
- [x] Wrote `/srv/moonlightcherry/app/.env` — fresh `AUTH_SECRET`, the new
      prod DB role/password, `SITE_URL`, `MEDIA_STORAGE_DIR`, and the
      existing Discord/Google OAuth client credentials reused from dev
      (see note below on why that's fine).
- [ ] Turnstile keys — still unset, ships disabled. Add
      `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to that same
      `.env` if you want it on for launch.

Re-running `deploy/deploy.sh` from `/srv/moonlightcherry/app` is how you ship
future updates — it does a `git pull` from there, not from the dev directory.

## Still needed: OAuth redirect URIs (you — dashboard access only you have)

Reusing the *same* Discord/Google OAuth app credentials as dev is fine and
standard — a single OAuth app can have multiple authorized redirect URIs.
Add these to the existing apps (don't remove the existing dev ones):

- Discord Developer Portal: add `https://moonlightcherry.xyz/auth/callback/discord`
- Google Cloud Console: add `https://moonlightcherry.xyz/auth/callback/google`

## 5. First build and start (not internet-facing yet)

```bash
cd /srv/moonlightcherry/app
npm ci
npx prisma generate
npx prisma db push
npm run build

sudo cp deploy/moonlightcherry.service deploy/moonlightcherry-worker.service /etc/systemd/system/
sudo cp deploy/moonlightcherry-backup.service deploy/moonlightcherry-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now moonlightcherry.service
sudo systemctl enable --now moonlightcherry-worker.service
sudo systemctl enable --now moonlightcherry-backup.timer

curl -I http://localhost:3001   # should 200 — confirms the app itself is healthy before Caddy/DNS touch it
```

## 6. DNS & Cloudflare (you, in the Cloudflare dashboard — I can't do this part)

1. Confirm this server's public IP (from your router/ISP) and whether it's
   static. If it can change without notice, this setup breaks silently the
   next time it does — either get a static IP or add a dynamic-DNS updater
   before relying on this for real.
2. Cloudflare DNS: `A` record for `moonlightcherry.xyz` -> that IP,
   **Proxied** (orange cloud). Same for `www.moonlightcherry.xyz`.
3. SSL/TLS settings -> mode **Full (strict)**.
4. SSL/TLS -> Origin Server -> **Create Certificate** (default CA, RSA),
   hostnames `moonlightcherry.xyz` + `www.moonlightcherry.xyz`, 15-year
   validity. Cloudflare shows the private key exactly once — save both
   outputs somewhere before closing that dialog.
5. Confirm the CSAM Scanning Tool (Caching -> Configuration) is still
   enabled — you already did this.

## 7. Install the Origin certificate directly on the server (not pasted into chat)

```bash
sudo mkdir -p /etc/caddy/certs
sudo vi /etc/caddy/certs/moonlightcherry-origin.pem      # paste the certificate
sudo vi /etc/caddy/certs/moonlightcherry-origin-key.pem  # paste the private key
sudo chmod 600 /etc/caddy/certs/moonlightcherry-origin-key.pem
```

## 8. Install and configure Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

sudo cp /srv/moonlightcherry/app/deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 9. Restrict the firewall to Cloudflare only

Traffic that bypasses Cloudflare also bypasses the CSAM scan — this matters,
not just a hardening nice-to-have.

```bash
/srv/moonlightcherry/app/deploy/allow-cloudflare-only.sh
```

## 10. Verify

```bash
curl -I https://moonlightcherry.xyz
curl -I https://www.moonlightcherry.xyz   # should redirect to the bare domain
curl https://moonlightcherry.xyz/robots.txt
journalctl -u moonlightcherry -u moonlightcherry-worker -f
```

Sign in for real through both OAuth providers on the production domain
before calling it launched — redirect URIs are the single most common thing
that looks right in config and still fails at the button.

## 11. Make yourself admin on production

This is a fresh database — your production account isn't ADMINISTRATOR
until you sign in once (creating the row) and this runs against the *prod*
database, not dev's:

```bash
docker exec moonlightcherry-postgres-1 psql -U moonlightcherry -d moonlightcherry_prod \
  -c "UPDATE users SET role='ADMINISTRATOR' WHERE username='daddy';"
```

## Shipping future updates

From `/srv/moonlightcherry/app`:

```bash
./deploy/deploy.sh
```
