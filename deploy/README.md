# Production launch checklist

Everything in this directory is a config artifact — none of it is installed
or active until you run the steps below. `dev.moonlightcherry.xyz` keeps
working throughout; none of this touches it.

## 1. DNS & Cloudflare (you, in the Cloudflare dashboard)

1. Confirm you know this server's public IP (from your router/ISP). If your
   ISP doesn't give you a static IP, this whole setup breaks silently the
   next time it changes — either get a static IP from your ISP, or add a
   dynamic-DNS updater (e.g. Cloudflare's own API via a small cron job) before
   relying on this for real. Worth checking now, not after launch.
2. In Cloudflare DNS: create an `A` record for `moonlightcherry.xyz` pointing
   at that IP, **Proxied** (orange cloud). Same for `www.moonlightcherry.xyz`.
3. SSL/TLS settings -> set mode to **Full (strict)**.
4. SSL/TLS -> Origin Server -> **Create Certificate**. Choose the default
   (Cloudflare CA, RSA), list both `moonlightcherry.xyz` and
   `www.moonlightcherry.xyz` as hostnames, 15-year validity. Save the two
   outputs (certificate + private key) — Cloudflare only shows the key once.
5. Confirm the CSAM Scanning Tool (Caching -> Configuration) is enabled —
   you said you've done this already.

## 2. Move media storage outside the app directory

The app currently stores media under `./storage/media` inside the repo — the
project has already lost one test upload this way (an untracked directory
inside a repo checkout isn't durable). Production should use a real path:

```bash
sudo mkdir -p /srv/moonlightcherry/storage/media
sudo chown jovan:jovan /srv/moonlightcherry/storage/media
```

Then set `MEDIA_STORAGE_DIR=/srv/moonlightcherry/storage/media` in production's `.env`.

## 3. Install the Cloudflare Origin certificate

```bash
sudo mkdir -p /etc/caddy/certs
sudo vi /etc/caddy/certs/moonlightcherry-origin.pem      # paste the certificate
sudo vi /etc/caddy/certs/moonlightcherry-origin-key.pem  # paste the private key
sudo chmod 600 /etc/caddy/certs/moonlightcherry-origin-key.pem
```

## 4. Install and configure Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 5. Restrict the firewall to Cloudflare only

Traffic that bypasses Cloudflare also bypasses the CSAM scan — this matters,
not just a hardening nice-to-have.

```bash
./deploy/allow-cloudflare-only.sh
```

## 6. Production `.env`

Copy `.env` to a production version (or edit in place if this host only ever
runs production) with:

- A **different** `AUTH_SECRET` than dev (`openssl rand -base64 32`).
- `POSTGRES_PASSWORD` set to a real generated password, matching the same
  password embedded in `DATABASE_URL` (docker-compose and Prisma each read
  these independently — see the comment in `docker-compose.yml`).
- `MEDIA_STORAGE_DIR=/srv/moonlightcherry/storage/media` (step 2).
- `SITE_URL=https://moonlightcherry.xyz`.
- Real `AUTH_DISCORD_ID`/`SECRET` and `AUTH_GOOGLE_ID`/`SECRET` — **and** add
  `https://moonlightcherry.xyz/auth/callback/discord` and
  `https://moonlightcherry.xyz/auth/callback/google` as authorized redirect
  URIs in the Discord Developer Portal and Google Cloud Console. The
  existing dev redirect URIs should stay as-is.
- `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — worth turning
  on for a public launch; still optional, ships disabled if left unset.

## 7. First deploy

```bash
sudo cp deploy/moonlightcherry.service deploy/moonlightcherry-worker.service /etc/systemd/system/
sudo cp deploy/moonlightcherry-backup.service deploy/moonlightcherry-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload

./deploy/deploy.sh   # installs deps, applies schema, builds, restarts services

sudo systemctl enable --now moonlightcherry.service
sudo systemctl enable --now moonlightcherry-worker.service
sudo systemctl enable --now moonlightcherry-backup.timer
```

## 8. Verify

```bash
curl -I https://moonlightcherry.xyz
curl -I https://www.moonlightcherry.xyz   # should 301 to the bare domain
curl https://moonlightcherry.xyz/robots.txt
journalctl -u moonlightcherry -u moonlightcherry-worker -f
```

Then sign in for real through both OAuth providers on the production domain
before calling it launched — redirect URIs are the single most common thing
that looks right in config and still fails at the button.
