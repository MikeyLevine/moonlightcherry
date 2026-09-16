#!/usr/bin/env bash
# Restricts ports 80/443 to Cloudflare's published IP ranges only. Without
# this, anyone who finds this server's real IP can hit it directly, bypassing
# Cloudflare entirely — including the CSAM Scanning Tool, which only sees
# traffic that actually passes through Cloudflare's cache. Safe to re-run
# any time Cloudflare's IP ranges change (they do, occasionally).
set -euo pipefail

echo "==> Removing any existing 'Anywhere' rules for 80/443"
sudo ufw delete allow 80/tcp 2>/dev/null || true
sudo ufw delete allow 443/tcp 2>/dev/null || true
sudo ufw delete allow 80/tcp 2>/dev/null || true
sudo ufw delete allow "80,443/tcp" 2>/dev/null || true

echo "==> Fetching current Cloudflare IP ranges"
for ip in $(curl -s https://www.cloudflare.com/ips-v4) $(curl -s https://www.cloudflare.com/ips-v6); do
  sudo ufw allow from "$ip" to any port 80,443 proto tcp
done

echo "==> Done. Current rules:"
sudo ufw status
