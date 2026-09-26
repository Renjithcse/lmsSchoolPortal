# LMSOld: SchoolPortalAdmin (CRA) + schoolbackend (Express) in ONE image.
# Canonical production path — SPA + API on a single process (port 3001).
#
# Secrets: do NOT bake schoolbackend/config.env. `.dockerignore` excludes it
# (and `.env`). Runtime config comes only from compose `env_file: .env`.
# `COPY schoolbackend/ ./` below never includes config.env when dockerignore is intact.
# Local/dev may still use config.env via server.js dotenv; production must not.

# ---------- frontend ----------
FROM node:18-bookworm-slim AS frontend-build

WORKDIR /ui

COPY SchoolPortalAdmin/package.json SchoolPortalAdmin/yarn.lock ./
# bun is a leftover CRA dep that pulls macOS/Windows binaries; not needed to build the SPA
RUN yarn install --frozen-lockfile --ignore-optional --network-timeout 600000

COPY SchoolPortalAdmin/ ./

ENV PUBLIC_URL=/
ENV GENERATE_SOURCEMAP=false
ENV CI=false

RUN yarn build

# ---------- backend + baked SPA ----------
FROM node:18-bookworm-slim AS app

WORKDIR /app

COPY schoolbackend/package.json schoolbackend/yarn.lock ./

# sharp needs native toolchain on Debian; remove after install to slim the image
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && yarn install --frozen-lockfile --production --network-timeout 600000 \
  && apt-get purge -y --auto-remove python3 make g++ \
  && rm -rf /var/lib/apt/lists/* /usr/local/share/.cache/yarn

COPY schoolbackend/ ./

COPY --from=frontend-build /ui/build /app/SchoolPortalAdmin/build

RUN mkdir -p /app/public/uploads

EXPOSE 3001

CMD ["node", "server.js"]
