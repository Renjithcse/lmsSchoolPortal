# Deploy examples (host TLS → Docker)

Configs for terminating HTTPS on the EC2 host and proxying LMSOld:

| Upstream | Loopback |
|----------|----------|
| Combined SPA + API + `/uploads` | `127.0.0.1:3001` (`lmsold-app`) |

| Path | Use |
|------|-----|
| [`caddy/Caddyfile`](caddy/Caddyfile) | Preferred — admin.digitechpro.in only |
| [`caddy/Caddyfile.combined`](caddy/Caddyfile.combined) | Shared host — both `lms` + `admin` domains |
| [`nginx/admin.digitechpro.in.conf`](nginx/admin.digitechpro.in.conf) | Optional nginx + certbot |

Runbook: [`docs/DEPLOY.md`](../docs/DEPLOY.md). Update script: [`../deploy.sh`](../deploy.sh). Compose: [`../docker-compose.admin.yml`](../docker-compose.admin.yml).
