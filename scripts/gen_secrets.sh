#!/usr/bin/env bash
# scripts/gen_secrets.sh — Genera todos los secretos necesarios para .env
# Solo necesitas tener openssl instalado (viene en macOS y Linux)
# ------------------------------------------------------------------------------
# USO:
#   bash scripts/gen_secrets.sh >> .env
# O para ver en pantalla:
#   bash scripts/gen_secrets.sh
# ------------------------------------------------------------------------------

set -euo pipefail

echo "# ─── Generado el $(date) ───"
echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n/+=' | cut -c1-24)"
echo "MINIO_ROOT_USER=smartinv_$(openssl rand -hex 4)"
echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n/+=' | cut -c1-24)"
echo "REALTIME_SECRET_KEY_BASE=$(openssl rand -hex 64)"
echo ""
echo "# ⚠️  Agrega manualmente:"
echo "# SUPABASE_ANON_KEY=    (usa: supabase start o supabase status)"
echo "# SUPABASE_SERVICE_KEY= (usa: supabase start o supabase status)"
echo "# GEMINI_API_KEY=       (obtén en: https://aistudio.google.com/apikey)"
