# Deploy examples (host TLS → Docker)

Configs for terminating HTTPS on the EC2 host and proxying LMSOld:

| Upstream | Loopback |
|----------|----------|
| Combined SPA + API + `/uploads` | `127.0.0.1:3001` (`lmsold-app`) |

| Path | Use |
|------|-----|
| [`caddy/Caddyfile`](caddy/Caddyfile) | Preferred defaults — `admin.globalfotech.net` only |
| [`caddy/Caddyfile.combined`](caddy/Caddyfile.combined) | Shared host defaults — `lms.globalfotech.net` + `admin.globalfotech.net` |
| `caddy/Caddyfile*.generated` | Written by `./deploy.sh` from `LMSOLD_PUBLIC_URL` / `LMS_APP_URL` (gitignored) |
| [`nginx/admin.digitechpro.in.conf`](nginx/admin.digitechpro.in.conf) | Optional nginx + certbot (edit `server_name` for custom domains) |

**Shared host with lms-web — regenerate combined Caddy with both origins:**

```bash
LMS_APP_URL=https://lms.globalfotech.net \
LMSOLD_PUBLIC_URL=https://admin.globalfotech.net \
INSTALL_CADDY=1 CADDY_MODE=combined \
./deploy.sh
```

**Change domain:** set `LMSOLD_PUBLIC_URL` (or `ADMIN_DOMAIN`), keep `.env` `FRONTEND_URL` in sync (`SYNC_FRONTEND_URL=1`), regenerate/install Caddy (`INSTALL_CADDY=1`). See [`docs/DEPLOY.md`](../docs/DEPLOY.md).

Runbook: [`docs/DEPLOY.md`](../docs/DEPLOY.md). Update script: [`../deploy.sh`](../deploy.sh) (`git pull --ff-only` then rebuild; `SKIP_GIT_PULL=1` to skip). Compose: [`../docker-compose.admin.yml`](../docker-compose.admin.yml).
