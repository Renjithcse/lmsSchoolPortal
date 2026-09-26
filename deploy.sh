#!/usr/bin/env bash
# Deploy LMSOld as a single combined Docker service (CRA + Express).
#
# Typical production (TLS via Caddy/nginx on the host):
#   ./deploy.sh
#
# Secrets stay in .env (never committed). See docs/DEPLOY.md.
#
# Safe defaults:
#   - refuses to run if .env is missing
#   - does not seed (run seed:admin / seed:demo manually when needed)
#   - builds from the local schoolbackend/ + SchoolPortalAdmin/ tree (no git pull)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.admin.yml}"
LMSOLD_PUBLIC_URL="${LMSOLD_PUBLIC_URL:-https://admin.digitechpro.in}"

usage() {
  cat <<'EOF'
Usage: ./deploy.sh

Environment:
  LMSOLD_PUBLIC_URL  Expected public origin (default: https://admin.digitechpro.in).
                     Compared to FRONTEND_URL in .env (warning only if they differ).
  COMPOSE_FILE       Compose file (default: docker-compose.admin.yml)

Prerequisites:
  - Docker + Compose plugin
  - .env on this host (FRONTEND_URL, MONGO_URI, ACCESS_TOKEN_SECRET, …)
  - MongoDB reachable as configured in that .env
  - schoolbackend/ and SchoolPortalAdmin/ present for image builds
  - Dockerfile (single combined image)

Examples:
  ./deploy.sh
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

log() { printf '\n==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || die "docker is required"
docker compose version >/dev/null 2>&1 || die "docker compose plugin is required"

[[ -f "$COMPOSE_FILE" ]] || die "compose file not found: $COMPOSE_FILE (run from lmsold/)"
[[ -f Dockerfile ]] || die "Dockerfile missing (run from lmsold/)"
[[ -d schoolbackend ]] || die "schoolbackend/ missing — sync this source tree onto the server"
[[ -d SchoolPortalAdmin ]] || die "SchoolPortalAdmin/ missing — sync this source tree onto the server"
[[ -f .env ]] || die ".env missing — create it on the server (see docs/DEPLOY.md). Do not commit secrets."

# Remind if runtime FRONTEND_URL looks mismatched (non-fatal).
if grep -Eq '^[[:space:]]*FRONTEND_URL=' .env; then
  runtime_url="$(grep -E '^[[:space:]]*FRONTEND_URL=' .env | tail -n1 | cut -d= -f2- | tr -d '[:space:]' | tr -d '"' | tr -d "'")"
  if [[ -n "$runtime_url" && "$runtime_url" != "$LMSOLD_PUBLIC_URL" ]]; then
    printf 'WARNING: .env FRONTEND_URL=%s differs from LMSOLD_PUBLIC_URL=%s\n' "$runtime_url" "$LMSOLD_PUBLIC_URL" >&2
    printf '         CORS + Secure cookies use FRONTEND_URL; they should match the browser origin.\n' >&2
  fi
else
  printf 'WARNING: FRONTEND_URL not found in .env\n' >&2
fi

log "Build & start combined app (public URL expectation: $LMSOLD_PUBLIC_URL)"
docker compose -f "$COMPOSE_FILE" up -d --build

log "Compose status"
docker compose -f "$COMPOSE_FILE" ps

log "Done"
printf 'App  (from host): curl -fsS -o /dev/null -w "%%{http_code}\\n" http://127.0.0.1:3001/\n'
printf 'API  (from host): curl -fsS -o /dev/null -w "%%{http_code}\\n" http://127.0.0.1:3001/api/v1/auth/refresh\n'
printf 'Public site:      %s\n' "$LMSOLD_PUBLIC_URL"
printf 'Optional seed:    docker exec lmsold-app node seeder/adminSeeder.js\n'
printf 'Docs:             docs/DEPLOY.md\n'
printf 'Note:             Sync the whole lmsold/ tree onto the server; deploy does not git-pull nested folders.\n'
