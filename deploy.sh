#!/usr/bin/env bash
# Deploy LMSOld as a single combined Docker service (CRA + Express).
#
# Typical production (TLS via Caddy/nginx on the host):
#   ./deploy.sh
#
# Custom public domain (canonical env — mirrors lms-web's LMS_APP_URL):
#   LMSOLD_PUBLIC_URL=https://admin.example.com ./deploy.sh
#   # or host-only shorthand:
#   ADMIN_DOMAIN=admin.example.com ./deploy.sh
#
# Secrets stay in .env (never committed). See docs/DEPLOY.md.
#
# Safe defaults:
#   - git pull --ff-only (refuses to overwrite local commits)
#   - refuses to run if .env is missing
#   - does not seed (run seed:admin / seed:demo manually when needed)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.admin.yml}"
SKIP_GIT_PULL="${SKIP_GIT_PULL:-0}"
SYNC_FRONTEND_URL="${SYNC_FRONTEND_URL:-0}"
WRITE_CADDY="${WRITE_CADDY:-1}"
INSTALL_CADDY="${INSTALL_CADDY:-0}"
CADDY_MODE="${CADDY_MODE:-combined}" # combined | admin

# Canonical public origin for LMSOld admin (scheme + host, no trailing slash).
# Prefer LMSOLD_PUBLIC_URL. ADMIN_DOMAIN=host is a shorthand → https://$ADMIN_DOMAIN.
DEFAULT_LMSOLD_PUBLIC_URL="https://admin.digitechpro.in"
DEFAULT_LMS_APP_URL="https://lms.digitechpro.in"

if [[ -z "${LMSOLD_PUBLIC_URL:-}" && -n "${ADMIN_DOMAIN:-}" ]]; then
  LMSOLD_PUBLIC_URL="https://${ADMIN_DOMAIN}"
fi
LMSOLD_PUBLIC_URL="${LMSOLD_PUBLIC_URL:-$DEFAULT_LMSOLD_PUBLIC_URL}"
LMSOLD_PUBLIC_URL="${LMSOLD_PUBLIC_URL%/}"

# Optional sibling LMS (lms-web) origin for combined Caddy generation.
if [[ -z "${LMS_APP_URL:-}" && -n "${LMS_DOMAIN:-}" ]]; then
  LMS_APP_URL="https://${LMS_DOMAIN}"
fi
LMS_APP_URL="${LMS_APP_URL:-$DEFAULT_LMS_APP_URL}"
LMS_APP_URL="${LMS_APP_URL%/}"

usage() {
  cat <<'EOF'
Usage: ./deploy.sh

Run from the lmsold git repo root (this directory), e.g.:
  cd ~/Projects/lmsSchoolPortal && ./deploy.sh

Environment:
  LMSOLD_PUBLIC_URL  Canonical public origin (default: https://admin.digitechpro.in).
                     Drives printed domain, Caddy generation, and optional .env sync.
  ADMIN_DOMAIN       Host-only shorthand if LMSOLD_PUBLIC_URL unset
                     (e.g. admin.example.com → https://admin.example.com).
  LMS_APP_URL        Sibling lms-web origin for combined Caddy
                     (default: https://lms.digitechpro.in).
  LMS_DOMAIN         Host-only shorthand if LMS_APP_URL unset.
  SYNC_FRONTEND_URL  Set to 1 to rewrite FRONTEND_URL in .env to LMSOLD_PUBLIC_URL.
  WRITE_CADDY        Set to 0 to skip writing deploy/caddy/*.generated (default: 1).
  INSTALL_CADDY      Set to 1 to sudo-install the generated Caddyfile to /etc/caddy/
                     and reload caddy (default: 0).
  CADDY_MODE         combined (default) or admin — which generated file INSTALL_CADDY uses.
  COMPOSE_FILE       Compose file (default: docker-compose.admin.yml)
  SKIP_GIT_PULL      Set to 1 to skip git pull --ff-only

Prerequisites:
  - Git (repo already cloned from GitHub)
  - Docker + Compose plugin
  - .env on this host (FRONTEND_URL, MONGO_URI, ACCESS_TOKEN_SECRET, …)
  - MongoDB reachable as configured in that .env
  - Dockerfile (single combined image)

Examples:
  ./deploy.sh
  LMSOLD_PUBLIC_URL=https://admin.example.com SYNC_FRONTEND_URL=1 ./deploy.sh
  ADMIN_DOMAIN=admin.example.com LMS_DOMAIN=lms.example.com INSTALL_CADDY=1 ./deploy.sh
  SKIP_GIT_PULL=1 ./deploy.sh
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

log() { printf '\n==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

# Extract hostname from an origin URL (https://host[:port]/path → host[:port]).
url_host() {
  local u="$1"
  u="${u#http://}"
  u="${u#https://}"
  u="${u%%/*}"
  printf '%s' "$u"
}

command -v git >/dev/null || die "git is required"
command -v docker >/dev/null || die "docker is required"
docker compose version >/dev/null 2>&1 || die "docker compose plugin is required"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || die "not a git repository — clone https://github.com/Renjithcse/lmsSchoolPortal.git onto the server first"

[[ -f "$COMPOSE_FILE" ]] || die "compose file not found: $COMPOSE_FILE (run from lmsold/)"
[[ -f Dockerfile ]] || die "Dockerfile missing (run from lmsold/)"
[[ -f .env ]] || die ".env missing — create it on the server (see docs/DEPLOY.md). Do not commit secrets."

ADMIN_HOST="$(url_host "$LMSOLD_PUBLIC_URL")"
LMS_HOST="$(url_host "$LMS_APP_URL")"
[[ -n "$ADMIN_HOST" ]] || die "could not parse host from LMSOLD_PUBLIC_URL=$LMSOLD_PUBLIC_URL"
[[ -n "$LMS_HOST" ]] || die "could not parse host from LMS_APP_URL=$LMS_APP_URL"

log "Public domain: $LMSOLD_PUBLIC_URL (host: $ADMIN_HOST)"

# Optionally sync runtime FRONTEND_URL to the canonical public URL.
if [[ "$SYNC_FRONTEND_URL" == "1" ]]; then
  if grep -Eq '^[[:space:]]*FRONTEND_URL=' .env; then
    tmp="$(mktemp)"
    # Preserve other lines; replace the last FRONTEND_URL assignment.
    awk -v url="$LMSOLD_PUBLIC_URL" '
      /^[[:space:]]*FRONTEND_URL=/ { last=NR }
      { lines[NR]=$0 }
      END {
        for (i=1; i<=NR; i++) {
          if (i == last) print "FRONTEND_URL=" url
          else print lines[i]
        }
      }
    ' .env >"$tmp"
    mv "$tmp" .env
    log "Synced .env FRONTEND_URL=$LMSOLD_PUBLIC_URL"
  else
    printf '\nFRONTEND_URL=%s\n' "$LMSOLD_PUBLIC_URL" >>.env
    log "Appended FRONTEND_URL=$LMSOLD_PUBLIC_URL to .env"
  fi
fi

# Remind if runtime FRONTEND_URL looks mismatched (non-fatal).
if grep -Eq '^[[:space:]]*FRONTEND_URL=' .env; then
  runtime_url="$(grep -E '^[[:space:]]*FRONTEND_URL=' .env | tail -n1 | cut -d= -f2- | tr -d '[:space:]' | tr -d '"' | tr -d "'")"
  runtime_url="${runtime_url%/}"
  if [[ -n "$runtime_url" && "$runtime_url" != "$LMSOLD_PUBLIC_URL" ]]; then
    printf 'WARNING: .env FRONTEND_URL=%s differs from LMSOLD_PUBLIC_URL=%s\n' "$runtime_url" "$LMSOLD_PUBLIC_URL" >&2
    printf '         CORS + Secure cookies use FRONTEND_URL; they should match the browser origin.\n' >&2
    printf '         Re-run with SYNC_FRONTEND_URL=1 to update .env, or edit FRONTEND_URL manually.\n' >&2
  fi
else
  printf 'WARNING: FRONTEND_URL not found in .env\n' >&2
fi

write_caddy_generated() {
  local out_dir="$ROOT/deploy/caddy"
  mkdir -p "$out_dir"

  local admin_only="$out_dir/Caddyfile.generated"
  local combined="$out_dir/Caddyfile.combined.generated"

  cat >"$admin_only" <<EOF
# Generated by ./deploy.sh — do not edit by hand; regenerate on domain change.
# Admin host: $ADMIN_HOST → 127.0.0.1:3001
#
# Install:
#   sudo cp $admin_only /etc/caddy/Caddyfile
#   sudo systemctl reload caddy
# Or: INSTALL_CADDY=1 CADDY_MODE=admin ./deploy.sh

$ADMIN_HOST {
	encode gzip
	reverse_proxy 127.0.0.1:3001
}
EOF

  cat >"$combined" <<EOF
# Generated by ./deploy.sh — do not edit by hand; regenerate on domain change.
#   $LMS_HOST   → 127.0.0.1:3000  (lms-web)
#   $ADMIN_HOST → 127.0.0.1:3001  (lmsold)
#
# Install:
#   sudo cp $combined /etc/caddy/Caddyfile
#   sudo systemctl reload caddy
# Or: INSTALL_CADDY=1 CADDY_MODE=combined ./deploy.sh

$LMS_HOST {
	encode gzip
	reverse_proxy 127.0.0.1:3000
}

$ADMIN_HOST {
	encode gzip
	reverse_proxy 127.0.0.1:3001
}
EOF

  log "Wrote Caddyfiles for $ADMIN_HOST (lms: $LMS_HOST)"
  printf '  %s\n' "$admin_only"
  printf '  %s\n' "$combined"
}

if [[ "$WRITE_CADDY" == "1" ]]; then
  write_caddy_generated
fi

if [[ "$INSTALL_CADDY" == "1" ]]; then
  [[ "$WRITE_CADDY" == "1" ]] || die "INSTALL_CADDY=1 requires WRITE_CADDY=1"
  case "$CADDY_MODE" in
    combined) src="$ROOT/deploy/caddy/Caddyfile.combined.generated" ;;
    admin)    src="$ROOT/deploy/caddy/Caddyfile.generated" ;;
    *) die "CADDY_MODE must be combined or admin (got: $CADDY_MODE)" ;;
  esac
  [[ -f "$src" ]] || die "generated Caddyfile missing: $src"
  log "Installing $src → /etc/caddy/Caddyfile"
  sudo cp "$src" /etc/caddy/Caddyfile
  sudo systemctl enable --now caddy
  sudo systemctl reload caddy
fi

if [[ "$SKIP_GIT_PULL" != "1" ]]; then
  log "git pull --ff-only"
  git pull --ff-only || die "git pull --ff-only failed — fix local commits/conflicts on the server, or use SKIP_GIT_PULL=1 after a manual sync"
else
  log "Skipping git pull (SKIP_GIT_PULL=1)"
fi

[[ -d schoolbackend ]] || die "schoolbackend/ missing after pull"
[[ -d SchoolPortalAdmin ]] || die "SchoolPortalAdmin/ missing after pull"

log "Build & start combined app (LMSOLD_PUBLIC_URL=$LMSOLD_PUBLIC_URL)"
docker compose -f "$COMPOSE_FILE" up -d --build

log "Compose status"
docker compose -f "$COMPOSE_FILE" ps

log "Done"
printf 'App  (from host): curl -fsS -o /dev/null -w "%%{http_code}\\n" http://127.0.0.1:3001/\n'
printf 'API  (from host): curl -fsS -o /dev/null -w "%%{http_code}\\n" http://127.0.0.1:3001/api/v1/auth/refresh\n'
printf 'Public site:      %s\n' "$LMSOLD_PUBLIC_URL"
printf 'Caddy host:       %s\n' "$ADMIN_HOST"
printf 'Optional seed:    docker exec lmsold-app node seeder/adminSeeder.js\n'
printf 'Docs:             docs/DEPLOY.md\n'
printf 'Note:             Deploy pulls from origin (git pull --ff-only) unless SKIP_GIT_PULL=1.\n'
printf 'Domain change:    LMSOLD_PUBLIC_URL=https://admin.example.com SYNC_FRONTEND_URL=1 INSTALL_CADDY=1 ./deploy.sh\n'
