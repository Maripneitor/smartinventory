#!/usr/bin/env bash
# ==============================================================================
# scripts/setup-envs.sh — Distribuidor de Llaves Maestras
# ==============================================================================
# Lee el archivo .env.master de la raíz y genera automáticamente:
#   1. .env                      (Docker Compose / raíz del proyecto)
#   2. supabase/.env             (Edge Functions de Deno)
#   3. apps/vite-web/.env.local  (Frontend Vite)
#
# USO:
#   bash scripts/setup-envs.sh
#
# REQUISITO:
#   Tener .env.master en la raíz del proyecto con tus llaves reales.
# ==============================================================================

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MASTER_FILE=".env.master"

echo ""
echo -e "${BLUE}⚙️  SmartInventory — Configurador de Entornos Locales${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# --- Validar que existe el archivo maestro ---
if [ ! -f "$MASTER_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró '${MASTER_FILE}' en la raíz del proyecto.${NC}"
    echo ""
    echo "   Pasos para solucionarlo:"
    echo "   1. Copia tu archivo maestro de llaves a la raíz del proyecto"
    echo "   2. Renómbralo a '.env.master'"
    echo "   3. Vuelve a ejecutar este script"
    echo ""
    exit 1
fi

echo -e "${YELLOW}📂 Leyendo llaves desde: ${MASTER_FILE}${NC}"
echo ""

# ==============================================================================
# 1. ROOT .env — Docker Compose y configuración general
# ==============================================================================
{
    echo "# ============================================================"
    echo "# SmartInventory — .env (generado por scripts/setup-envs.sh)"
    echo "# Generado el: $(date)"
    echo "# ============================================================"
    echo ""
    echo "# ============ Next ============"
    grep '^NEXT_PUBLIC_BASE_URL=' "$MASTER_FILE" || true
    echo ""
    echo "# Supabase Local (Docker)"
    grep '^NEXT_PUBLIC_SUPABASE_URL=' "$MASTER_FILE" || true
    grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$MASTER_FILE" || true
    echo ""
    echo "# Database Connection (Direct)"
    grep '^DATABASE_URL=' "$MASTER_FILE" || true
    grep '^DB_PASSWORD=' "$MASTER_FILE" || true
    grep '^POSTGRES_PASSWORD=' "$MASTER_FILE" || true
    grep '^JWT_SECRET=' "$MASTER_FILE" || true
    grep '^SUPABASE_ANON_KEY=' "$MASTER_FILE" || true
    grep '^SUPABASE_SERVICE_KEY=' "$MASTER_FILE" || true
    grep '^REALTIME_SECRET_KEY_BASE=' "$MASTER_FILE" || true
    echo ""
    echo "# ============ IA ============"
    grep '^GEMINI_API_KEY=' "$MASTER_FILE" || true
    grep '^GROQ_API_KEY=' "$MASTER_FILE" || true
    grep '^GEMINI_MODEL=' "$MASTER_FILE" || true
    grep '^GROQ_VISION_MODEL=' "$MASTER_FILE" || true
} > .env

echo -e "${GREEN}  ✅ .env${NC} (Docker Compose / raíz) — creado"

# ==============================================================================
# 2. supabase/.env — Edge Functions (Deno) — Solo llaves de IA y Supabase interno
# ==============================================================================
mkdir -p supabase

{
    echo "# ============================================================"
    echo "# SmartInventory — supabase/.env (generado por scripts/setup-envs.sh)"
    echo "# Generado el: $(date)"
    echo "# ============================================================"
    echo ""
    echo "# --- Supabase (local) ---"
    echo "SUPABASE_URL=http://localhost:54321"
    grep '^SUPABASE_ANON_KEY=' "$MASTER_FILE" || true
    grep '^SUPABASE_SERVICE_KEY=' "$MASTER_FILE" | sed 's/SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY/' || true
    echo ""
    echo "# --- AI (Server Side Only) ---"
    grep '^GEMINI_API_KEY=' "$MASTER_FILE" || true
    grep '^GEMINI_MODEL=' "$MASTER_FILE" || true
    echo ""
    grep '^GROQ_API_KEY=' "$MASTER_FILE" || true
    grep '^GROQ_VISION_MODEL=' "$MASTER_FILE" || true
    echo ""
    echo "# AI Config"
    grep '^AI_PROVIDER_PRIMARY=' "$MASTER_FILE" || true
    grep '^AI_PROVIDER_FALLBACK=' "$MASTER_FILE" || true
} > supabase/.env

echo -e "${GREEN}  ✅ supabase/.env${NC} (Edge Functions / Deno) — creado"

# ==============================================================================
# 3. apps/vite-web/.env.local — Frontend Vite (solo variables públicas)
# ==============================================================================
mkdir -p apps/vite-web

{
    echo "# ============================================================"
    echo "# SmartInventory — apps/vite-web/.env.local (generado por scripts/setup-envs.sh)"
    echo "# Generado el: $(date)"
    echo "# ============================================================"
    echo ""
    echo "# Supabase Local (Variables públicas para el navegador)"
    grep '^NEXT_PUBLIC_SUPABASE_URL=' "$MASTER_FILE" || true
    grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$MASTER_FILE" || true
    echo ""
    echo "# Base URL"
    grep '^NEXT_PUBLIC_BASE_URL=' "$MASTER_FILE" || true
} > apps/vite-web/.env.local

echo -e "${GREEN}  ✅ apps/vite-web/.env.local${NC} (Frontend Vite) — creado"

# ==============================================================================
# Resumen final
# ==============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🚀 ¡Todo listo!${NC} Archivos generados:"
echo ""
echo "   📄 .env                      → Docker Compose"
echo "   📄 supabase/.env             → Edge Functions (Deno)"
echo "   📄 apps/vite-web/.env.local  → Frontend (Vite)"
echo ""
echo -e "${YELLOW}💡 Siguiente paso:${NC}"
echo "   docker compose up -d && npm run dev"
echo ""
