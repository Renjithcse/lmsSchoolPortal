# Deploy LMSOld admin to production (EC2 + domain)

Target example: **https://admin.digitechpro.in** on an EC2 host where this `lmsold/` tree is present (`Dockerfile`, `SchoolPortalAdmin/`, `schoolbackend/`).

LMSOld runs as **one** Docker service:

| Service | Image | Host port | Role |
|---------|-------|-----------|------|
| `lmsold-app` | `Dockerfile` | **3001** (loopback) | Express API + `/uploads` + CRA SPA |

The admin SPA (`env=live`) calls **relative** `/api/` and media under `/uploads/`. Host TLS (Caddy/nginx) proxies the whole origin to `:3001` so the browser stays same-origin (simple CORS + cookies).

Mongo is external (host or Atlas). Do **not** split into separate frontend/backend containers.

**Secrets stay on the server** in `.env` at this directory. Never commit `.env`, bake it into the image, or put real passwords in compose `environment:` (compose `environment` would override `env_file`).

## Layout

`lmsold/` is a **plain deploy folder** (single combined image). Sync the whole tree onto the server (rsync/scp/monorepo copy):

| Path | Role |
|------|------|
| `schoolbackend/` | Express API source (built into the image) |
| `SchoolPortalAdmin/` | CRA admin UI source (built into the image) |
| `Dockerfile`, `docker-compose.admin.yml`, `deploy.sh`, `deploy/`, `docs/` | Deploy / ops files |

`./deploy.sh` does **not** run `git pull`. It builds and starts from whatever is already on disk.

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Docker Engine + Compose plugin | `docker compose version` |
| Source tree | `schoolbackend/` + `SchoolPortalAdmin/` under `lmsold/` |
| MongoDB | Reachable from the container (usually host port `27017` via `host.docker.internal`) |
| DNS | A record for `admin.digitechpro.in` → EC2 public IP |
| TLS reverse proxy | Caddy (preferred) or nginx — see [`deploy/`](../deploy/) |
| Security group | Inbound **80** and **443**. Prefer **not** opening **3001** publicly when TLS terminates on the host |

## 1. Server `.env` (create/edit on EC2 only)

```bash
cd ~/path/to/lmsold   # this directory
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

Encode `@` in Mongo passwords as `%40`. Use `host.docker.internal`, not `127.0.0.1`, so the container can reach host Mongo.

| Variable | Production value |
|----------|------------------|
| `FRONTEND_URL` | `https://admin.digitechpro.in` (scheme must be **https** when TLS is live — drives cookie `Secure` + CORS) |
| `MONGO_URI` | Host Mongo via `host.docker.internal`, or Atlas URI |
| `PORT` | `3001` (app listen; matches compose + Caddy upstream) |

Compose loads secrets via `env_file: .env`. It does **not** override `MONGO_URI` or `FRONTEND_URL`.

## 2. DNS

Create an **A** record:

```text
admin.digitechpro.in  →  <EC2 public IPv4>
```

Wait until `dig +short admin.digitechpro.in` returns the EC2 IP before requesting certificates.

## 3. TLS reverse proxy

### Shared host with `lms.digitechpro.in` (recommended)

One Caddy process must own **:80** and **:443**. Do not also bind docker-proxy or a second nginx/Caddy to those ports.

```bash
# From lmsold/ on the server:
sudo cp deploy/caddy/Caddyfile.combined /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

That file routes:

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
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

### Optional: nginx + certbot

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

From **this `lmsold/` directory** on the server:

```bash
./deploy.sh
# equivalent:
# docker compose -f docker-compose.admin.yml up -d --build
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
curl -fsSI https://admin.digitechpro.in
# open https://admin.digitechpro.in and sign in
```

Confirm:

```bash
docker exec lmsold-app printenv FRONTEND_URL NODE_ENV PORT MONGO_URI | sed 's/:.*@/:***@/'
docker compose -f docker-compose.admin.yml ps
docker logs --tail 100 lmsold-app
```

## 6. Subsequent updates

```bash
cd ~/path/to/lmsold
./deploy.sh
```

`deploy.sh` will:

1. `docker compose -f docker-compose.admin.yml up -d --build`
2. Print compose status

Sync code onto the server before running it. Do **not** re-seed on every deploy.

After editing only runtime env in `.env` (no code change):

```bash
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

1. Sync this `lmsold/` tree onto the server.
2. `docker compose -f docker-compose.admin.yml down`
3. Stop leftover containers if needed: `docker rm -f lmsold-backend lmsold-frontend 2>/dev/null || true`
4. Install the single-upstream Caddyfile (`admin` → `:3001` only).
5. `./deploy.sh`
6. Seed/verify as above. Uploads volume name remains `lmsold_uploads`.

## Common pitfalls

| Symptom | Likely cause |
|---------|----------------|
| Login cookie missing / Secure issues | `FRONTEND_URL` is `http://…` while the site is HTTPS (or the reverse). |
| Mongo connection refused | `MONGO_URI` still uses `127.0.0.1` / `localhost` inside the container. Use `host.docker.internal`. |
| `:80` already allocated | Another container or docker-proxy published host 80. Stop it; Caddy needs 80/443. |
| HTTPS OK for lms but not admin | Missing `admin` site block in `/etc/caddy/Caddyfile`, or DNS A record missing. |
| SPA loads but API 502 | App down, or Caddy still pointing SPA at old `:3002`. |
| Caddy 502 on admin | Compose not binding `127.0.0.1:3001`, or container crashed (check logs). |
| Stale code after deploy | Server tree was not synced before `./deploy.sh` — rsync/`lmsold/` must include FE + BE sources. |
| Deploy files missing on server | Sync the whole `lmsold/` folder (Dockerfile, compose, deploy scripts, and source trees). |

## Related

- [`../deploy.sh`](../deploy.sh) — update script
- [`../deploy/caddy/`](../deploy/caddy/) · [`../deploy/nginx/admin.digitechpro.in.conf`](../deploy/nginx/admin.digitechpro.in.conf)
- [`../docker-compose.admin.yml`](../docker-compose.admin.yml)
- [`../Dockerfile`](../Dockerfile)
- [`../.env.example`](../.env.example)
