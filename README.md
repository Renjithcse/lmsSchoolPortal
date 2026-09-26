# LMSOld

Legacy stack as **one** Docker service: Express API (`schoolbackend`) serves the CRA admin SPA (`SchoolPortalAdmin`) from the same process. This is **not** `lms-web`.

Mongo is **not** started here. Use the MongoDB instance you already run (host port `27017` or Atlas).

## Architecture

| Service | Port (host) | Role |
|---------|-------------|------|
| `lmsold-app` | 3001 (loopback) | API + `/uploads` + static SPA |

Production (`env=live` in the SPA) uses relative `/api/` — same-origin via Express (and Caddy in front).

## Local URL

After start:

- App: [http://localhost:3001](http://localhost:3001)
- API: [http://localhost:3001/api](http://localhost:3001/api)

Compose binds `127.0.0.1:3001` by default. For direct LAN access during local testing, change the port mapping to `"3001:3001"`.

## Start (local)

From this directory (`lmsold/`):

```bash
cp .env.example .env   # set MONGO_URI (host.docker.internal), secrets
docker compose -f docker-compose.admin.yml up -d --build
```

From the parent monorepo folder (thin wrapper):

```bash
docker compose -f docker-compose.lmsold.yml up -d --build
```

## Production (domain + TLS)

See [`docs/DEPLOY.md`](docs/DEPLOY.md). Short path (clone once, then deploy pulls + rebuilds):

```bash
git clone https://github.com/Renjithcse/lmsSchoolPortal.git
cd lmsSchoolPortal
cp .env.example .env   # set FRONTEND_URL, Mongo, JWT secrets
./deploy.sh             # default public URL: https://admin.digitechpro.in
# Custom domain + sync .env + install combined Caddy:
# LMSOLD_PUBLIC_URL=https://admin.example.com SYNC_FRONTEND_URL=1 INSTALL_CADDY=1 ./deploy.sh
```

Canonical domain env: **`LMSOLD_PUBLIC_URL`** (or `ADMIN_DOMAIN=host`). Keep `.env` `FRONTEND_URL` matching that origin.

## Stop

```bash
docker compose -f docker-compose.admin.yml down
```

Uploads persist in the `lmsold_uploads` volume (`/app/public/uploads`). To remove the volume as well:

```bash
docker compose -f docker-compose.admin.yml down -v
```
