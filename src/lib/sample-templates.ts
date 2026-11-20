import type { InputMode, SampleTemplateId } from './types';

export interface SampleTemplate {
	label: string;
	stackName: string;
	mode: InputMode;
	content: string;
}

export const SAMPLE_TEMPLATES: Record<SampleTemplateId, SampleTemplate> = {
	'web-postgres-redis': {
		label: 'Node Web + Postgres 16 + Redis 7',
		stackName: 'webapp',
		mode: 'compose-yaml',
		content: `services:
  web:
    image: node:22-alpine
    working_dir: /srv/app
    command: ["node", "server.js"]
    ports:
      - "3000:3000"
    volumes:
      - ./app:/srv/app
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://appuser@postgres:5432/appdb
      REDIS_URL: redis://redis:6379/0
      SESSION_SECRET: s3cr3t-session-signing-value
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: appuser
      POSTGRES_DB: appdb
      POSTGRES_PASSWORD: strong-postgres-password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
      interval: 10s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 5
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
`,
	},
	'immich-stack': {
		label: 'Immich Photo Backup Stack',
		stackName: 'immich',
		mode: 'compose-yaml',
		content: `services:
  immich-server:
    image: ghcr.io/immich-app/immich-server:release
    ports:
      - "2283:2283"
    volumes:
      - /srv/immich/library:/usr/src/app/upload
      - /etc/localtime:/etc/localtime:ro
    environment:
      TZ: UTC
      DB_HOSTNAME: database
      DB_USERNAME: immich
      DB_DATABASE_NAME: immich
      DB_PASSWORD: immich-db-secret-value
      REDIS_HOSTNAME: redis
      JWT_SECRET: immich-jwt-signing-secret
    devices:
      - /dev/dri:/dev/dri
    depends_on:
      - redis
      - database
    restart: always

  immich-machine-learning:
    image: ghcr.io/immich-app/immich-machine-learning:release
    volumes:
      - model-cache:/cache
    environment:
      TZ: UTC
    restart: always

  redis:
    image: docker.io/valkey/valkey:8-bookworm
    healthcheck:
      test: ["CMD-SHELL", "valkey-cli ping || exit 1"]
      interval: 15s
      retries: 5
    restart: always

  database:
    image: ghcr.io/immich-app/postgres:16-vectorchord0.3.0
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: immich
      POSTGRES_DB: immich
      POSTGRES_PASSWORD: immich-db-secret-value
    shm_size: 128mb
    restart: always

volumes:
  model-cache:
  pgdata:
`,
	},
	'vaultwarden-caddy': {
		label: 'Vaultwarden + Caddy HTTPS Proxy',
		stackName: 'vaultwarden',
		mode: 'compose-yaml',
		content: `services:
  vaultwarden:
    image: vaultwarden/server:latest
    volumes:
      - vw-data:/data
    environment:
      DOMAIN: https://vault.internal.lan
      SIGNUPS_ALLOWED: "false"
      WEBSOCKET_ENABLED: "true"
      ADMIN_TOKEN: argon2-admin-secret-token
    healthcheck:
      test: ["CMD", "/healthcheck.sh"]
      interval: 30s
      retries: 3
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - vaultwarden
    restart: unless-stopped

volumes:
  vw-data:
  caddy-data:
  caddy-config:
`,
	},
	'nextcloud-mariadb': {
		label: 'Nextcloud 30 + MariaDB + Redis',
		stackName: 'nextcloud',
		mode: 'compose-yaml',
		content: `services:
  nextcloud:
    image: nextcloud:30-apache
    ports:
      - "8080:80"
    volumes:
      - nextcloud-html:/var/www/html
      - /srv/nextcloud/data:/var/www/html/data
    environment:
      MYSQL_HOST: mariadb
      MYSQL_DATABASE: nextcloud
      MYSQL_USER: nextcloud
      MYSQL_PASSWORD: nextcloud-db-secret
      REDIS_HOST: redis
    depends_on:
      - mariadb
      - redis
    restart: unless-stopped

  mariadb:
    image: mariadb:11.4
    command: --transaction-isolation=READ-COMMITTED --log-bin=binlog --binlog-format=ROW
    volumes:
      - mariadb-data:/var/lib/mysql
    environment:
      MYSQL_DATABASE: nextcloud
      MYSQL_USER: nextcloud
      MYSQL_PASSWORD: nextcloud-db-secret
      MYSQL_ROOT_PASSWORD: mariadb-root-secret
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  nextcloud-html:
  mariadb-data:
`,
	},
	'docker-run-jellyfin': {
		label: 'Jellyfin Media Server (docker run)',
		stackName: 'jellyfin',
		mode: 'docker-run',
		content: `docker run -d \\
  --name jellyfin \\
  --hostname jellyfin-box \\
  --user 1000:1000 \\
  --userns keep-id \\
  --group-add keep-groups \\
  -p 8096:8096 \\
  -p 8920:8920 \\
  -v /srv/jellyfin/config:/config \\
  -v /srv/jellyfin/cache:/cache \\
  -v /srv/media:/media:ro \\
  -e TZ=UTC \\
  -e JELLYFIN_API_KEY=jellyfin-local-api-token \\
  --device /dev/dri:/dev/dri \\
  --cap-add SYS_NICE \\
  --label "app.tier=media" \\
  --restart unless-stopped \\
  docker.io/jellyfin/jellyfin:latest`,
	},
	'healthcheck-depends': {
		label: 'API waits for Postgres service_healthy',
		stackName: 'app',
		mode: 'compose-yaml',
		content: `services:
  api:
    image: docker.io/library/node:22-alpine
    working_dir: /srv/app
    command: ["node", "server.js"]
    ports:
      - "8080:3000"
    environment:
      DATABASE_URL: postgres://app@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: docker.io/library/postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_DB: app
      POSTGRES_PASSWORD: sample-db-password
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    restart: unless-stopped

volumes:
  db-data:
`,
	},
	'rootless-boot-nginx': {
		label: 'Rootless nginx that should start at boot',
		stackName: 'site',
		mode: 'compose-yaml',
		content: `services:
  web:
    image: docker.io/library/nginx:1.27-alpine
    ports:
      - "8080:80"
    restart: unless-stopped
`,
	},
	'pihole-rootless': {
		label: 'Rootless Pi-hole DNS (port 53, web on 8080)',
		stackName: 'pihole',
		mode: 'compose-yaml',
		content: `services:
  pihole:
    image: docker.io/pihole/pihole:latest
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "8080:80/tcp"
    environment:
      TZ: UTC
      FTLCONF_webserver_api_password: sample-pihole-web-password
      FTLCONF_dns_listeningMode: ALL
    volumes:
      - /srv/pihole/etc-pihole:/etc/pihole
    restart: unless-stopped
`,
	},
	'quadlet-vs-compose': {
		label: 'Caddy proxy + whoami (Compose vs Quadlet)',
		stackName: 'edge',
		mode: 'compose-yaml',
		content: `services:
  proxy:
    image: docker.io/library/caddy:2-alpine
    ports:
      - "8080:80"
    volumes:
      - /srv/edge/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
    depends_on:
      - api
    restart: unless-stopped

  api:
    image: docker.io/traefik/whoami:v1.10
    restart: unless-stopped

volumes:
  caddy-data:
`,
	},
	'quadlet-secrets': {
		label: 'Postgres & API with Secret Storage',
		stackName: 'securestack',
		mode: 'compose-yaml',
		content: `services:
  db:
    image: docker.io/library/postgres:16-alpine
    environment:
      POSTGRES_USER: secureuser
      POSTGRES_DB: securedb
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  api:
    image: docker.io/library/node:22-alpine
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://secureuser@db:5432/securedb
    restart: unless-stopped

volumes:
  postgres-data:
`,
	},
	'debug-quadlet': {
		label: 'Nginx Web Unit for Troubleshooting',
		stackName: 'troubleshoot',
		mode: 'compose-yaml',
		content: `services:
  web:
    image: docker.io/library/nginx:1.27-alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
    restart: on-failure
`,
	},
	'traefik-proxy': {
		label: 'Traefik v3 Reverse Proxy & Whoami',
		stackName: 'traefik',
		mode: 'compose-yaml',
		content: `services:
  traefik:
    image: docker.io/library/traefik:v3.1
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
      - "8080:8080"
    volumes:
      - /run/user/1000/podman/podman.sock:/var/run/docker.sock
    restart: always

  whoami:
    image: docker.io/traefik/whoami:v1.10
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.whoami.rule=Host(\`whoami.local\`)"
    restart: unless-stopped
`,
	},
	'rootless-permissions': {
		label: 'Rootless User 1000 Volume Alignment',
		stackName: 'appstack',
		mode: 'compose-yaml',
		content: `services:
  app:
    image: docker.io/library/node:22-alpine
    user: "1000:1000"
    working_dir: /srv/app
    ports:
      - "3000:3000"
    volumes:
      - ./data:/srv/app/data
    environment:
      DATA_DIR: /srv/app/data
    restart: unless-stopped
`,
	},
	'systemd-hardening': {
		label: 'Hardened Caddy Service Sandbox',
		stackName: 'hardened',
		mode: 'compose-yaml',
		content: `services:
  secureweb:
    image: docker.io/library/caddy:2-alpine
    ports:
      - "8080:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
    restart: unless-stopped

volumes:
  caddy-data:
`,
	},
	'migration-guide': {
		label: 'Two-Tier Production Migration Stack',
		stackName: 'production',
		mode: 'compose-yaml',
		content: `services:
  frontend:
    image: docker.io/library/nginx:1.27-alpine
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

  backend:
    image: docker.io/library/python:3.12-alpine
    working_dir: /app
    command: ["python", "app.py"]
    volumes:
      - app-storage:/app/storage
    environment:
      APP_ENV: production
    restart: unless-stopped

volumes:
  app-storage:
`,
	},
	'volumes-syntax-demo': {
		label: 'Compose volume syntax: named, bind, and long form',
		stackName: 'volumes',
		mode: 'compose-yaml',
		content: `services:
  db:
    image: docker.io/library/postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
      - /srv/compose-demo/config:/etc/postgres/conf.d:ro
      - /srv/compose-demo/private:/var/lib/private:Z
      - type: bind
        source: /srv/compose-demo/init
        target: /docker-entrypoint-initdb.d
        read_only: true
    restart: unless-stopped
  web:
    image: docker.io/library/nginx:1.27
    volumes:
      - external-archive:/usr/share/nginx/archive:ro
    restart: unless-stopped
volumes:
  pgdata:
  external-archive:
    external: true
`,
	},
};
