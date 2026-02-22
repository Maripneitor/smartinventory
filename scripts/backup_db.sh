#!/usr/bin/env bash
# scripts/backup_db.sh — Backup automático de Postgres + export de Storage
# ------------------------------------------------------------------------------
# USO:
#   bash scripts/backup_db.sh
#   (o programar con cron/GitHub Actions)
#
# REQUIERE: docker, docker compose, mc (MinIO Client) instalados en el host
# ------------------------------------------------------------------------------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker/docker-compose.yml"
ENV_FILE="$PROJECT_DIR/.env"

# Cargar .env
if [[ -f "$ENV_FILE" ]]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
POSTGRES_CONTAINER="smartinventory-db-1"  # ajustar si cambia el nombre

mkdir -p "$BACKUP_DIR"

echo "==> [$(date)] Iniciando backup SmartInventory..."

# ─── 1. Dump de Postgres ──────────────────────────────────────────────────────
DUMP_FILE="$BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz"
echo "--> Dumping Postgres a $DUMP_FILE"
docker exec "$POSTGRES_CONTAINER" \
  pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-smartinventory}" \
  | gzip > "$DUMP_FILE"
echo "    ✓ Postgres dump completado ($(du -sh "$DUMP_FILE" | cut -f1))"

# ─── 2. Rotación: mantener solo los últimos N backups ────────────────────────
KEEP_LAST="${KEEP_LAST:-7}"
echo "--> Rotando backups (mantener últimos $KEEP_LAST)..."
ls -t "$BACKUP_DIR"/postgres_*.sql.gz 2>/dev/null \
  | tail -n +$((KEEP_LAST + 1)) \
  | xargs -r rm --
echo "    ✓ Rotación completada"

echo "==> [$(date)] Backup finalizado. Archivos en: $BACKUP_DIR"

# ─── Opcional: subir backup a MinIO/S3 (descomentar si quieres) ───────────────
# mc alias set myminio http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
# mc cp "$DUMP_FILE" "myminio/smartinventory-backups/$(basename "$DUMP_FILE")"
# echo "    ✓ Backup subido a MinIO"
