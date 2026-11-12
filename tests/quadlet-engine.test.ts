import { describe, expect, it } from 'vitest';
import { convertToQuadlet, qualifyImageName } from '../src/lib/quadlet-engine';
import { SAMPLE_TEMPLATES } from '../src/lib/sample-templates';
import type { QuadletConvertOptions, SampleTemplateId } from '../src/lib/types';
import { buildZipArchive, computeCrc32 } from '../src/lib/zip-packager';

const DEFAULT_OPTIONS: QuadletConvertOptions = {
	stackName: 'demo',
	installScope: 'rootless',
	selinuxMode: 'none',
	enableAutoUpdate: false,
	generateSharedNetwork: true,
	extractSecretsToEnvFile: false,
};

describe('convertToQuadlet Compose conversion', () => {
	it('converts a multi-service Compose stack into container, network, and volume Quadlet units', () => {
		const yaml = `
services:
  api:
    image: node:22-alpine
    working_dir: /app
    command: ["node", "index.js"]
    ports:
      - "8080:3000"
    environment:
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
  db:
    image: postgres:16
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      retries: 5
    restart: always
volumes:
  db-data:
`;
		const res = convertToQuadlet(yaml, { ...DEFAULT_OPTIONS, stackName: 'billing' });
		expect(res.ok).toBe(true);
		if (!res.ok) return;

		expect(res.inputMode).toBe('compose-yaml');
		expect(res.serviceCount).toBe(2);

		const apiFile = res.files.find((f) => f.filename === 'api.container');
		const dbFile = res.files.find((f) => f.filename === 'db.container');
		const netFile = res.files.find((f) => f.filename === 'billing.network');
		const volFile = res.files.find((f) => f.filename === 'db-data.volume');

		expect(apiFile).toBeDefined();
		expect(dbFile).toBeDefined();
		expect(netFile).toBeDefined();
		expect(volFile).toBeDefined();

		expect(apiFile!.content).toContain('[Unit]');
		expect(apiFile!.content).toContain('After=db.service');
		expect(apiFile!.content).toContain('Requires=db.service');
		expect(apiFile!.content).toContain('[Container]');
		expect(apiFile!.content).toContain('Image=docker.io/library/node:22-alpine');
		expect(apiFile!.content).toContain('WorkingDir=/app');
		expect(apiFile!.content).toContain('Exec=node index.js');
		expect(apiFile!.content).toContain('PublishPort=8080:3000');
		expect(apiFile!.content).toContain('Restart=always');
		expect(apiFile!.content).toContain('WantedBy=default.target');

		expect(dbFile!.content).toContain('Image=docker.io/library/postgres:16');
		expect(dbFile!.content).toContain('Volume=db-data.volume:/var/lib/postgresql/data');
		expect(dbFile!.content).toContain('HealthCmd=pg_isready -U postgres');
		expect(dbFile!.content).toContain('HealthInterval=10s');
		expect(dbFile!.content).toContain('HealthRetries=5');
	});

	it('emits shared .network unit and service network wiring for >=2 services (podlet#190 fix)', () => {
		const yaml = `
services:
  frontend:
    image: nginx:alpine
  backend:
    image: python:3.12-slim
`;
		const withNet = convertToQuadlet(yaml, {
			...DEFAULT_OPTIONS,
			stackName: 'portal',
			generateSharedNetwork: true,
		});
		expect(withNet.ok).toBe(true);
		if (!withNet.ok) return;

		const netUnit = withNet.files.find((f) => f.unitType === 'network');
		expect(netUnit).toBeDefined();
		expect(netUnit!.filename).toBe('portal.network');
		expect(netUnit!.content).toContain('[Network]\nNetworkName=portal');

		for (const container of withNet.files.filter((f) => f.unitType === 'container')) {
			expect(container.content).toContain('Network=portal.network');
			expect(container.content).toContain('After=portal-network.service');
		}

		const withoutNet = convertToQuadlet(yaml, {
			...DEFAULT_OPTIONS,
			stackName: 'portal',
			generateSharedNetwork: false,
		});
		expect(withoutNet.ok).toBe(true);
		if (!withoutNet.ok) return;
		expect(withoutNet.files.find((f) => f.unitType === 'network')).toBeUndefined();
	});

	it('emits shared .network unit for a single service when explicit networks are declared', () => {
		const yaml = `
services:
  worker:
    image: redis:7
    networks:
      - appnet
networks:
  appnet:
`;
		const res = convertToQuadlet(yaml, {
			...DEFAULT_OPTIONS,
			stackName: 'queue',
			generateSharedNetwork: true,
		});
		expect(res.ok).toBe(true);
		if (!res.ok) return;

		expect(res.files.some((f) => f.filename === 'queue.network')).toBe(true);
		const worker = res.files.find((f) => f.filename === 'worker.container')!;
		expect(worker.content).toContain('Network=queue.network');
		expect(worker.content).toContain('After=queue-network.service');
	});

	it('maps array-form depends_on into After and Requires directives', () => {
		const yaml = `
services:
  app:
    image: busybox:latest
    depends_on:
      - cache
      - search
  cache:
    image: redis:7
  search:
    image: typesense/typesense:27.1
`;
		const res = convertToQuadlet(yaml, DEFAULT_OPTIONS);
		expect(res.ok).toBe(true);
		if (!res.ok) return;

		const appUnit = res.files.find((f) => f.filename === 'app.container')!;
		expect(appUnit.content).toContain('After=cache.service');
		expect(appUnit.content).toContain('Requires=cache.service');
		expect(appUnit.content).toContain('After=search.service');
		expect(appUnit.content).toContain('Requires=search.service');
	});

	it('applies SELinux :z and :Z volume flags without duplicating existing labels', () => {
		const yaml = `
services:
  storage:
    image: alpine:3.20
    volumes:
      - /srv/rw:/data
      - /srv/ro:/config:ro
      - /srv/already-shared:/shared:z
      - /srv/already-private:/private:ro,Z
      - named-vol:/var/lib/named
volumes:
  named-vol:
`;
		const sharedRes = convertToQuadlet(yaml, {
			...DEFAULT_OPTIONS,
			selinuxMode: 'shared-z',
		});
		expect(sharedRes.ok).toBe(true);
		if (!sharedRes.ok) return;

		const sharedContent = sharedRes.files[0]!.content;
		expect(sharedContent).toContain('Volume=/srv/rw:/data:z');
		expect(sharedContent).toContain('Volume=/srv/ro:/config:ro,z');
		expect(sharedContent).toContain('Volume=/srv/already-shared:/shared:z');
		expect(sharedContent).toContain('Volume=/srv/already-private:/private:ro,Z');
		expect(sharedContent).toContain('Volume=named-vol.volume:/var/lib/named:z');

		const privateRes = convertToQuadlet(yaml, {
			...DEFAULT_OPTIONS,
			selinuxMode: 'private-Z',
		});
		expect(privateRes.ok).toBe(true);
		if (!privateRes.ok) return;

		const privateContent = privateRes.files[0]!.content;
		expect(privateContent).toContain('Volume=/srv/rw:/data:Z');
		expect(privateContent).toContain('Volume=/srv/ro:/config:ro,Z');
		expect(privateContent).toContain('Volume=/srv/already-shared:/shared:z');
		expect(privateContent).toContain('Volume=/srv/already-private:/private:ro,Z');
		expect(privateContent).toContain('Volume=named-vol.volume:/var/lib/named:Z');
	});

	it('extracts sensitive env keys into <stackName>.env for both rootless and rootful scopes', () => {
		const yaml = `
services:
  auth:
    image: postgres:16
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: top-secret-db-password
      JWT_SECRET: jwt-signing-value
      API_TOKEN: token-123
      STRIPE_API_KEY: sk_test_abc
      SIGNING_KEY: rsa-private
      TZ: Asia/Tokyo
`;
		const rootlessRes = convertToQuadlet(yaml, {
			...DEFAULT_OPTIONS,
			stackName: 'vault',
			installScope: 'rootless',
			extractSecretsToEnvFile: true,
		});
		expect(rootlessRes.ok).toBe(true);
		if (!rootlessRes.ok) return;

		const containerFile = rootlessRes.files.find((f) => f.filename === 'auth.container')!;
		const envFile = rootlessRes.files.find((f) => f.unitType === 'env')!;

		expect(envFile.filename).toBe('vault.env');
		expect(envFile.installPath).toBe('~/.config/containers/systemd/vault.env');
		expect(envFile.content).toContain('POSTGRES_PASSWORD=top-secret-db-password');
		expect(envFile.content).toContain('JWT_SECRET=jwt-signing-value');
		expect(envFile.content).toContain('API_TOKEN=token-123');
		expect(envFile.content).toContain('STRIPE_API_KEY=sk_test_abc');
		expect(envFile.content).toContain('SIGNING_KEY=rsa-private');
		expect(envFile.content).not.toContain('POSTGRES_USER');

		expect(containerFile.content).toContain(
			'EnvironmentFile=%h/.config/containers/systemd/vault.env',
		);
		expect(containerFile.content).toContain('Environment=POSTGRES_USER=admin');
		expect(containerFile.content).toContain('Environment=TZ=Asia/Tokyo');
		expect(containerFile.content).not.toContain('top-secret-db-password');

		const rootfulRes = convertToQuadlet(yaml, {
			...DEFAULT_OPTIONS,
			stackName: 'vault',
			installScope: 'rootful',
			extractSecretsToEnvFile: true,
		});
		expect(rootfulRes.ok).toBe(true);
		if (!rootfulRes.ok) return;

		const rootfulContainer = rootfulRes.files.find((f) => f.filename === 'auth.container')!;
		expect(rootfulContainer.content).toContain(
			'EnvironmentFile=/etc/containers/systemd/vault.env',
		);
		expect(rootfulContainer.content).toContain('WantedBy=multi-user.target');
		expect(rootfulContainer.installPath).toBe('/etc/containers/systemd/auth.container');
		expect(
			rootfulRes.systemdCommands.some((cmd) =>
				cmd.includes('sudo systemctl daemon-reload && sudo systemctl start auth.service'),
			),
		).toBe(true);
	});

	it('qualifies bare and namespace short image names while preserving explicit registries', () => {
		expect(qualifyImageName('postgres:16')).toBe('docker.io/library/postgres:16');
		expect(qualifyImageName('redis')).toBe('docker.io/library/redis');
		expect(qualifyImageName('vaultwarden/server:latest')).toBe(
			'docker.io/vaultwarden/server:latest',
		);
		expect(qualifyImageName('ghcr.io/immich-app/immich-server:release')).toBe(
			'ghcr.io/immich-app/immich-server:release',
		);
		expect(qualifyImageName('quay.io/prometheus/node-exporter:v1.8.2')).toBe(
			'quay.io/prometheus/node-exporter:v1.8.2',
		);
		expect(qualifyImageName('localhost:5000/internal-api:1.0')).toBe(
			'localhost:5000/internal-api:1.0',
		);
		expect(qualifyImageName('localhost/my-build:latest')).toBe('localhost/my-build:latest');
	});

	it('toggles AutoUpdate=registry and maps restart policies accurately', () => {
		const yaml = `
services:
  onfail:
    image: alpine:3.20
    restart: on-failure
  norestart:
    image: alpine:3.20
    restart: "no"
`;
		const res = convertToQuadlet(yaml, {
			...DEFAULT_OPTIONS,
			enableAutoUpdate: true,
		});
		expect(res.ok).toBe(true);
		if (!res.ok) return;

		const onfail = res.files.find((f) => f.filename === 'onfail.container')!;
		const norestart = res.files.find((f) => f.filename === 'norestart.container')!;

		expect(onfail.content).toContain('AutoUpdate=registry');
		expect(onfail.content).toContain('Restart=on-failure');
		expect(norestart.content).toContain('Restart=no');
	});

	it('records actionable warnings for unsupported Compose fields like build and deploy.replicas', () => {
		const yaml = `
services:
  custom-api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    deploy:
      replicas: 3
    ports:
      - "4000:4000"
`;
		const res = convertToQuadlet(yaml, { ...DEFAULT_OPTIONS, stackName: 'custom' });
		expect(res.ok).toBe(true);
		if (!res.ok) return;

		const fields = res.warnings.map((w) => w.field);
		expect(fields).toContain('build');
		expect(fields).toContain('deploy.replicas');
		expect(res.files[0]!.content).toContain('Image=localhost/custom-custom-api:latest');
	});
});

describe('convertToQuadlet docker run CLI conversion', () => {
	it('parses multiline docker run with continuations, quoted args, capabilities, devices, and command', () => {
		const cmd = `sudo docker run -dit \\
  --name media-transcoder \\
  --hostname transcoder.local \\
  --user 1000:1000 \\
  -w /opt/transcoder \\
  --entrypoint /usr/bin/tini \\
  -p 127.0.0.1:9000:9000 \\
  -v "/srv/media files:/media:ro" \\
  -e "TRANSCODE_ARGS=--preset fast" \\
  -e API_SECRET_KEY=transcode-secret \\
  --env-file /etc/transcoder/common.env \\
  --cap-add SYS_ADMIN \\
  --device /dev/dri:/dev/dri \\
  -l "org.example.role=worker node" \\
  --restart unless-stopped \\
  jellyfin/jellyfin:latest --ffmpeg /usr/lib/jellyfin-ffmpeg/ffmpeg`;

		const res = convertToQuadlet(cmd, {
			...DEFAULT_OPTIONS,
			stackName: 'media',
			selinuxMode: 'private-Z',
			extractSecretsToEnvFile: true,
		});
		expect(res.ok).toBe(true);
		if (!res.ok) return;

		expect(res.inputMode).toBe('docker-run');
		expect(res.serviceCount).toBe(1);

		const unit = res.files.find((f) => f.filename === 'media-transcoder.container')!;
		expect(unit).toBeDefined();
		expect(unit.content).toContain('Image=docker.io/jellyfin/jellyfin:latest');
		expect(unit.content).toContain('ContainerName=media-transcoder');
		expect(unit.content).toContain('HostName=transcoder.local');
		expect(unit.content).toContain('User=1000:1000');
		expect(unit.content).toContain('WorkingDir=/opt/transcoder');
		expect(unit.content).toContain('Entrypoint=/usr/bin/tini');
		expect(unit.content).toContain('Exec=--ffmpeg /usr/lib/jellyfin-ffmpeg/ffmpeg');
		expect(unit.content).toContain('PublishPort=127.0.0.1:9000:9000');
		expect(unit.content).toContain('Volume=/srv/media files:/media:ro,Z');
		expect(unit.content).toContain('EnvironmentFile=/etc/transcoder/common.env');
		expect(unit.content).toContain('EnvironmentFile=%h/.config/containers/systemd/media.env');
		expect(unit.content).toContain('Environment="TRANSCODE_ARGS=--preset fast"');
		expect(unit.content).toContain('AddCapability=SYS_ADMIN');
		expect(unit.content).toContain('AddDevice=/dev/dri:/dev/dri');
		expect(unit.content).toContain('Label="org.example.role=worker node"');
		expect(unit.content).toContain('Restart=always');
		expect(
			res.systemdCommands.some((c) =>
				c.includes('systemctl --user daemon-reload && systemctl --user start media-transcoder.service'),
			),
		).toBe(true);
	});

	it('supports podman run with inline equals syntax (--publish=..., --network=...)', () => {
		const cmd =
			'podman run --rm --name=dns --network=dnsnet --publish=5353:53/udp coredns/coredns:1.11.3 -conf /Corefile';
		const res = convertToQuadlet(cmd, { ...DEFAULT_OPTIONS, stackName: 'dnsstack' });
		expect(res.ok).toBe(true);
		if (!res.ok) return;

		expect(res.inputMode).toBe('docker-run');
		const dnsUnit = res.files.find((f) => f.filename === 'dns.container')!;
		expect(dnsUnit.content).toContain('Image=docker.io/coredns/coredns:1.11.3');
		expect(dnsUnit.content).toContain('PublishPort=5353:53/udp');
		expect(dnsUnit.content).toContain('Exec=-conf /Corefile');
		expect(dnsUnit.content).toContain('Network=dnsstack.network');
	});

	it('respects -- option terminator before image and preserves spaces in command arguments', () => {
		const cmd = 'docker run -d -- alpine:3.20 sh -c "echo ready && sleep 60"';
		const res = convertToQuadlet(cmd, { ...DEFAULT_OPTIONS, stackName: 'probe' });
		expect(res.ok).toBe(true);
		if (!res.ok) return;

		const probeUnit = res.files[0]!;
		expect(probeUnit.content).toContain('Image=docker.io/library/alpine:3.20');
		expect(probeUnit.content).toContain('Exec=sh -c "echo ready && sleep 60"');
	});
});

describe('convertToQuadlet boundary error handling', () => {
	it('returns structured error on empty input', () => {
		const res = convertToQuadlet('   \n  ', DEFAULT_OPTIONS);
		expect(res.ok).toBe(false);
		if (!res.ok) {
			expect(res.error.length).toBeGreaterThan(0);
		}
	});

	it('returns structured error on malformed YAML syntax', () => {
		const res = convertToQuadlet('services: [unclosed', DEFAULT_OPTIONS);
		expect(res.ok).toBe(false);
		if (!res.ok) {
			expect(res.error).toContain('Failed to parse Compose YAML');
			expect(res.error).not.toMatch(/[\u2013\u2014]/);
		}
	});

	it('returns structured error when Compose YAML lacks a services mapping', () => {
		const res = convertToQuadlet('version: "3.9"\nvolumes:\n  data:\n', DEFAULT_OPTIONS);
		expect(res.ok).toBe(false);
		if (!res.ok) {
			expect(res.error).toContain('services');
		}
	});

	it('returns structured error on unterminated quotes or missing image in docker run', () => {
		const badQuote = convertToQuadlet('docker run -e "UNCLOSED=1 nginx:alpine', DEFAULT_OPTIONS);
		expect(badQuote.ok).toBe(false);

		const missingImg = convertToQuadlet('docker run -d -p 8080:80', DEFAULT_OPTIONS);
		expect(missingImg.ok).toBe(false);
	});
});

describe('SAMPLE_TEMPLATES and buildZipArchive', () => {
	it('converts all 5 sample templates cleanly and supports private-Z on the primary container unit', () => {
		const expectedIds: SampleTemplateId[] = [
			'web-postgres-redis',
			'immich-stack',
			'vaultwarden-caddy',
			'nextcloud-mariadb',
			'docker-run-jellyfin',
		];

		for (const id of expectedIds) {
			const tpl = SAMPLE_TEMPLATES[id];
			expect(tpl).toBeDefined();
			expect(tpl.content).not.toMatch(/[\u2013\u2014]/);
			expect(tpl.label).not.toMatch(/[\u2013\u2014]/);
			expect(tpl.content).not.toContain('{{');

			const res = convertToQuadlet(tpl.content, {
				stackName: tpl.stackName,
				installScope: 'rootless',
				selinuxMode: 'private-Z',
				enableAutoUpdate: true,
				generateSharedNetwork: true,
				extractSecretsToEnvFile: true,
			});

			expect(res.ok).toBe(true);
			if (!res.ok) continue;
			expect(res.inputMode).toBe(tpl.mode);
			expect(res.files[0]!.unitType).toBe('container');
			expect(res.files[0]!.content).toContain('[Container]');
			expect(res.files[0]!.content).toContain(':Z');
		}
	});

	it('computes standard IEEE 802.3 CRC32 checksums accurately', () => {
		const bytes = new TextEncoder().encode('123456789');
		expect(computeCrc32(bytes)).toBe(0xcbf43926);
	});

	it('builds a valid uncompressed PKZIP archive with local headers, central directory, CRC32, and EOCD', () => {
		const inputFiles = [
			{
				filename: 'webapp.container',
				content: '[Container]\nImage=docker.io/library/nginx:alpine\n',
			},
			{
				filename: 'webapp.network',
				content: '[Network]\nNetworkName=webapp\n',
			},
			{
				filename: 'webapp.env',
				content: 'API_SECRET=hunter2\n',
			},
		];

		const startMs = performance.now();
		const zip = buildZipArchive(inputFiles);
		const elapsedMs = performance.now() - startMs;

		expect(elapsedMs).toBeLessThan(50);
		expect(zip.byteLength).toBeGreaterThan(100);

		const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
		expect(view.getUint32(0, true)).toBe(0x04034b50);

		const firstContentBytes = new TextEncoder().encode(inputFiles[0]!.content);
		expect(view.getUint16(8, true)).toBe(0);
		expect(view.getUint32(14, true)).toBe(computeCrc32(firstContentBytes));
		expect(view.getUint32(18, true)).toBe(firstContentBytes.byteLength);
		expect(view.getUint32(22, true)).toBe(firstContentBytes.byteLength);

		const eocdOffset = zip.byteLength - 22;
		expect(view.getUint32(eocdOffset, true)).toBe(0x06054b50);
		expect(view.getUint16(eocdOffset + 8, true)).toBe(3);
		expect(view.getUint16(eocdOffset + 10, true)).toBe(3);

		const centralDirOffset = view.getUint32(eocdOffset + 16, true);
		expect(view.getUint32(centralDirOffset, true)).toBe(0x02014b50);

		const decodedText = new TextDecoder().decode(zip);
		for (const file of inputFiles) {
			expect(decodedText).toContain(file.filename);
			expect(decodedText).toContain(file.content);
		}
	});
});
