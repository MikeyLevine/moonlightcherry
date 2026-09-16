#!/usr/bin/env bash
# Daily backup: a Postgres dump + a tarball of the media storage directory,
# both timestamped, kept for 14 days locally. This only protects against
# local disk failure if BACKUP_REMOTE_DEST also copies these off this
# machine — set it to an rclone/rsync destination (e.g. "r2:mc-backups" or
# "user@otherhost:/backups") or backups are only as safe as this one disk.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/srv/moonlightcherry/backups}"
MEDIA_DIR="${MEDIA_STORAGE_DIR:-/srv/moonlightcherry/storage/media}"
# Production uses its own database inside the same Postgres container/instance
# dev already uses — never dev's "moonlightcherry" database. Set explicitly
# in .env so a missing/wrong var doesn't silently back up the wrong thing.
PGDATABASE="${POSTGRES_DB:?Set POSTGRES_DB in .env (e.g. moonlightcherry_prod)}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "==> Dumping database ($PGDATABASE)"
docker exec moonlightcherry-postgres-1 pg_dump -U moonlightcherry "$PGDATABASE" \
  | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"

echo "==> Archiving media storage"
tar -czf "$BACKUP_DIR/media-$STAMP.tar.gz" -C "$(dirname "$MEDIA_DIR")" "$(basename "$MEDIA_DIR")"

if [ -n "${BACKUP_REMOTE_DEST:-}" ]; then
  echo "==> Syncing to $BACKUP_REMOTE_DEST"
  rclone copy "$BACKUP_DIR/db-$STAMP.sql.gz" "$BACKUP_REMOTE_DEST"
  rclone copy "$BACKUP_DIR/media-$STAMP.tar.gz" "$BACKUP_REMOTE_DEST"
else
  echo "==> BACKUP_REMOTE_DEST not set — backup is LOCAL ONLY, not off-site."
fi

echo "==> Pruning backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime "+$RETENTION_DAYS" -delete

echo "==> Done: $BACKUP_DIR/db-$STAMP.sql.gz, $BACKUP_DIR/media-$STAMP.tar.gz"
