# Deploy LMSOld admin to production (EC2 + domain)

Target example: **https://admin.digitechpro.in** on an EC2 host where **this repo** is already cloned from GitHub (`https://github.com/Renjithcse/lmsSchoolPortal.git`).

The public domain is **not hard-coded**. Default remains digitechpro; override with **`LMSOLD_PUBLIC_URL`** (canonical, same idea as lms-web’s `LMS_APP_URL`).

LMSOld runs as **one** Docker service:

| Service | Image | Host port | Role |
|---------|-------|-----------|------|
| `lmsold-app` | `Dockerfile` | **3001** (loopback) | Express API + `/uploads` + CRA SPA |

The admin SPA (`env=live`) calls **relative** `/api/` and media under `/uploads/`. Host TLS (Caddy/nginx) proxies the whole origin to `:3001` so the browser stays same-origin (simple CORS + cookies).

Mongo is external (host or Atlas). Do **not** split into separate frontend/backend containers.

**Secrets stay on the server** in `.env` at the repo root. Never commit `.env`, bake it into the image, or put real passwords in compose `environment:` (compose `environment` would override `env_file`).

## Public domain env vars

| Variable | Role | Default |
|----------|------|---------|
| **`LMSOLD_PUBLIC_URL`** | **Canonical** public origin for admin (scheme + host). Used by `./deploy.sh` (print, Caddy generate, optional `.env` sync). | `https://admin.digitechpro.in` |
| `ADMIN_DOMAIN` | Host-only shorthand if `LMSOLD_PUBLIC_URL` is unset → `https://$ADMIN_DOMAIN` | — |
| **`FRONTEND_URL`** | Runtime CORS + Secure cookies (loaded from `.env` via compose `env_file`) | Must match browser origin / `LMSOLD_PUBLIC_URL` |
| `LMS_APP_URL` | Sibling lms-web origin when generating **combined** Caddy | `https://lms.digitechpro.in` |
| `LMS_DOMAIN` | Host-only shorthand if `LMS_APP_URL` is unset | — |
| `SYNC_FRONTEND_URL=1` | Rewrite `.env` `FRONTEND_URL` to `LMSOLD_PUBLIC_URL` | off |
| `WRITE_CADDY=1` | Write `deploy/caddy/Caddyfile*.generated` (default on) | on |
| `INSTALL_CADDY=1` | `sudo cp` generated file → `/etc/caddy/Caddyfile` + reload | off |
| `CADDY_MODE` | `combined` (default) or `admin` — which generated file to install | `combined` |

Prefer **one** deploy-time var: **`LMSOLD_PUBLIC_URL`**. Keep **`FRONTEND_URL`** in `.env` equal to it.

## Layout

Clone once; subsequent deploys pull + rebuild:

| Path | Role |
|------|------|
| `schoolbackend/` | Express API source (built into the image) |
| `SchoolPortalAdmin/` | CRA admin UI source (built into the image) |
| `Dockerfile`, `docker-compose.admin.yml`, `deploy.sh`, `deploy/`, `docs/` | Deploy / ops files |

`./deploy.sh` runs `git pull --ff-only` (unless `SKIP_GIT_PULL=1`), then builds and starts the combined image. It also prints the public domain and (by default) writes Caddyfiles for that host.

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Docker Engine + Compose plugin | `docker compose version` |
| Git | Repo already cloned; deploy uses `git pull --ff-only` |
| Source tree | `schoolbackend/` + `SchoolPortalAdmin/` (from the clone) |
| MongoDB | Reachable from the container (usually host port `27017` via `host.docker.internal`) |
| DNS | A record for your admin host → EC2 public IP |
| TLS reverse proxy | Caddy (preferred) or nginx — see [`deploy/`](../deploy/) |
| Security group | Inbound **80** and **443**. Prefer **not** opening **3001** publicly when TLS terminates on the host |

## 0. First-time clone (once per server)

```bash
cd ~/Projects   # or wherever you keep apps
git clone https://github.com/Renjithcse/lmsSchoolPortal.git
cd lmsSchoolPortal
```

Keep `.env` only on the server (never commit it). After the first clone, use `./deploy.sh` for updates — it pulls from origin before rebuilding.

## 1. Server `.env` (create/edit on EC2 only)

```bash
cd ~/Projects/lmsSchoolPortal   # this repo root
cp .env.example .env
nano .env
```

Set at least:

```text
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://admin.digitechpro.in
MONGO_URI=mongodb://USER:PASS@host.docker.internal:27017/nwis?authSource=admin
ACCESS_TOKEN_SECRET=<long-random-string>
REFRESH_TOKEN_SECRET=<long-random-string>
```

For a custom domain, set `FRONTEND_URL=https://admin.example.com` (same origin you will put in DNS / Caddy).

Encode `@` in Mongo passwords as `%40`. Use `host.docker.internal`, not `127.0.0.1`, so the container can reach host Mongo.

| Variable | Production value |
|----------|------------------|
| `FRONTEND_URL` | Public `https://…` origin (must be **https** when TLS is live — drives cookie `Secure` + CORS) |
| `MONGO_URI` | Host Mongo via `host.docker.internal`, or Atlas URI |
| `PORT` | `3001` (app listen; matches compose + Caddy upstream) |

Compose loads secrets via `env_file: .env`. It does **not** override `MONGO_URI` or `FRONTEND_URL` — change domain by editing `.env` (and Caddy), then recreate/reload.

## 2. DNS

Create an **A** record for your admin host (default example):

```text
admin.digitechpro.in  →  <EC2 public IPv4>
# or: admin.example.com → <EC2 public IPv4>
```

Wait until `dig +short <admin-host>` returns the EC2 IP before requesting certificates.

## 3. TLS reverse proxy

### Generate Caddy from domain env (recommended for custom domains)

`./deploy.sh` writes:

- `deploy/caddy/Caddyfile.generated` — admin only
- `deploy/caddy/Caddyfile.combined.generated` — lms + admin

```bash
# Digitechpro defaults (no extra env needed):
./deploy.sh

# Custom admin (+ optional lms) hosts, sync .env, install combined Caddy:
LMSOLD_PUBLIC_URL=https://admin.example.com \
LMS_APP_URL=https://lms.example.com \
SYNC_FRONTEND_URL=1 \
INSTALL_CADDY=1 \
CADDY_MODE=combined \
./deploy.sh
```

Site names in the generated file **must** match DNS and `FRONTEND_URL` / lms `APP_URL`.

### Shared host with lms (static digitechpro samples)

One Caddy process must own **:80** and **:443**. Do not also bind docker-proxy or a second nginx/Caddy to those ports.

```bash
# From lmsold/ on the server:
sudo cp deploy/caddy/Caddyfile.combined /etc/caddy/Caddyfile
# or after ./deploy.sh:
# sudo cp deploy/caddy/Caddyfile.combined.generated /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

Default sample routes:

```caddy
lms.digitechpro.in {
	encode gzip
	reverse_proxy 127.0.0.1:3000
}

admin.digitechpro.in {
	encode gzip
	reverse_proxy 127.0.0.1:3001
}
```

Keep the same admin site block in `lms-web/deploy/caddy/Caddyfile` if that copy is what you install on the host.

### Admin-only host

```bash
sudo cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
# or: sudo cp deploy/caddy/Caddyfile.generated /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

### Optional: nginx + certbot

Sample file uses `admin.digitechpro.in`. For another host, replace `server_name` and cert paths (or prefer Caddy generation above).

```bash
sudo cp deploy/nginx/admin.digitechpro.in.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/admin.digitechpro.in.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d admin.digitechpro.in
sudo nginx -t && sudo systemctl reload nginx
```

### Bind app to localhost (recommended with TLS)

Compose publishes `127.0.0.1:3001:3001` by default so only the host proxy can reach the app. If you temporarily need direct IP access during cutover, change to `"3001:3001"` and recreate.

**Do not** map the app to host **:80** — Caddy needs 80/443.

## 4. First-time build

From **this repo root** on the server (after clone + `.env`):

```bash
./deploy.sh
# custom domain:
# LMSOLD_PUBLIC_URL=https://admin.example.com SYNC_FRONTEND_URL=1 ./deploy.sh
# equivalent compose-only:
# git pull --ff-only && docker compose -f docker-compose.admin.yml up -d --build
```

Optional first-time admin user (if empty DB):

```bash
docker exec lmsold-app node seeder/adminSeeder.js
# optional demo fixtures:
# docker exec lmsold-app node seeder/demoSeeder.js
```

There is no Prisma/SQL migrate step (Mongo + Mongoose).

## 5. Verify

```bash
curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/
curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/api/v1/auth/refresh
curl -fsSI https://admin.digitechpro.in   # or your LMSOLD_PUBLIC_URL
# open the public URL and sign in
```

Confirm:

```bash
docker exec lmsold-app printenv FRONTEND_URL NODE_ENV PORT MONGO_URI | sed 's/:.*@/:***@/'
docker compose -f docker-compose.admin.yml ps
docker logs --tail 100 lmsold-app
```

## 6. Subsequent updates

```bash
cd ~/Projects/lmsSchoolPortal
./deploy.sh
```

`deploy.sh` will:

1. Resolve / print `LMSOLD_PUBLIC_URL` (default digitechpro)
2. Optionally sync `FRONTEND_URL` and write/install Caddy
3. `git pull --ff-only` (fails safely if local commits diverge)
4. `docker compose -f docker-compose.admin.yml up -d --build`
5. Print compose status + public site URL

Skip pull with `SKIP_GIT_PULL=1`. Do **not** re-seed on every deploy.

After editing only runtime env in `.env` (no code change):

```bash
docker compose -f docker-compose.admin.yml up -d --force-recreate
```

## Changing the public domain on a live server

1. Point DNS A record for the new host at the EC2 IP; wait for propagation.
2. Update and redeploy (one shot):

```bash
cd ~/Projects/lmsSchoolPortal   # lmsold repo root

LMSOLD_PUBLIC_URL=https://admin.example.com \
LMS_APP_URL=https://lms.example.com \
SYNC_FRONTEND_URL=1 \
INSTALL_CADDY=1 \
CADDY_MODE=combined \
./deploy.sh
```

Host-only shorthand:

```bash
ADMIN_DOMAIN=admin.example.com \
LMS_DOMAIN=lms.example.com \
SYNC_FRONTEND_URL=1 \
INSTALL_CADDY=1 \
./deploy.sh
```

3. Confirm:

```bash
docker exec lmsold-app printenv FRONTEND_URL
curl -fsSI https://admin.example.com
```

Manual path (no `INSTALL_CADDY`):

```bash
# edit .env → FRONTEND_URL=https://admin.example.com
LMSOLD_PUBLIC_URL=https://admin.example.com ./deploy.sh
sudo cp deploy/caddy/Caddyfile.combined.generated /etc/caddy/Caddyfile
sudo systemctl reload caddy
docker compose -f docker-compose.admin.yml up -d --force-recreate
```

## Security group checklist

| Port | Purpose |
|------|---------|
| 22 | SSH (restrict to your IP) |
| 80 | HTTP → ACME + redirect to HTTPS |
| 443 | HTTPS (public) |
| 3001 | Prefer closed to the internet when proxying on the host |
| 27017 | Do not expose Mongo publicly |

## Migrating from a split FE/BE attempt

If the server still has `lmsold-backend` / `lmsold-frontend` containers (aborted split):

1. Clone (or re-clone) this repo on the server if it is not already a git checkout.
2. `docker compose -f docker-compose.admin.yml down`
3. Stop leftover containers if needed: `docker rm -f lmsold-backend lmsold-frontend 2>/dev/null || true`
4. Install the single-upstream Caddyfile (`admin` → `:3001` only).
5. `./deploy.sh`
6. Seed/verify as above. Uploads volume name remains `lmsold_uploads`.

## Common pitfalls

| Symptom | Likely cause |
|---------|----------------|
| Login cookie missing / Secure issues | `FRONTEND_URL` is `http://…` while the site is HTTPS (or the reverse). |
| Wrong CORS / cookies after domain move | `.env` `FRONTEND_URL` still old; use `SYNC_FRONTEND_URL=1` or edit `.env`. |
| Caddy cert for wrong host | Site name in Caddyfile ≠ DNS / `LMSOLD_PUBLIC_URL` host — regenerate + reload. |
| Mongo connection refused | `MONGO_URI` still uses `127.0.0.1` / `localhost` inside the container. Use `host.docker.internal`. |
| `:80` already allocated | Another container or docker-proxy published host 80. Stop it; Caddy needs 80/443. |
| HTTPS OK for lms but not admin | Missing `admin` site block in `/etc/caddy/Caddyfile`, or DNS A record missing. |
| SPA loads but API 502 | App down, or Caddy still pointing SPA at old `:3002`. |
| Caddy 502 on admin | Compose not binding `127.0.0.1:3001`, or container crashed (check logs). |
| `git pull` rejected | Local commits or dirty conflict — fix on server or use `SKIP_GIT_PULL=1` after a manual sync. |
| not a git repository | Directory was copied without `.git` — clone `lmsSchoolPortal` instead of rsync-only. |
| Stale code after deploy | Pull failed or was skipped (`SKIP_GIT_PULL=1`) without updating sources. |

## Related

- [`../deploy.sh`](../deploy.sh) — update script (`LMSOLD_PUBLIC_URL`, Caddy generate/install)
- [`../deploy/caddy/`](../deploy/caddy/) · [`../deploy/nginx/admin.digitechpro.in.conf`](../deploy/nginx/admin.digitechpro.in.conf)
- [`../docker-compose.admin.yml`](../docker-compose.admin.yml)
- [`../Dockerfile`](../Dockerfile)
- [`../.env.example`](../.env.example)
