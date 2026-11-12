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
  jellyfin/jellyfin:latest`,
	},
};
