import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const cliPath = path.resolve(__dirname, '../bin/compose-to-quadlet.mjs');

function runCli(args: string[]): { stdout: string; stderr: string; status: number } {
	const result = spawnSync(process.execPath, [cliPath, ...args], {
		encoding: 'utf8',
	});
	return {
		stdout: result.stdout ?? '',
		stderr: result.stderr ?? '',
		status: result.status ?? 0,
	};
}

describe('Standalone CLI (bin/compose-to-quadlet.mjs)', () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(path.join(os.tmpdir(), 'quadlet-cli-test-'));
	});

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it('prints help message with --help and points to https://quadletgen.com', () => {
		const res = runCli(['--help']);
		expect(res.status).toBe(0);
		expect(res.stdout).toContain('compose-to-quadlet');
		expect(res.stdout).toContain('https://quadletgen.com');
		expect(res.stdout).toContain('--input');
		expect(res.stdout).toContain('--run');
		expect(res.stdout).toContain('--out-dir');
		expect(res.stdout).toContain('--scope');
		expect(res.stdout).toContain('--selinux');
	});

	it('prints version with --version', () => {
		const res = runCli(['--version']);
		expect(res.status).toBe(0);
		expect(res.stdout.trim()).toBe('0.1.0');
	});

	it('fails with exit code 1 when neither --input nor --run is supplied', () => {
		const res = runCli([]);
		expect(res.status).toBe(1);
		expect(res.stderr).toContain('Either --input <compose.yml> or --run "<docker run ...>" is required');
	});

	it('converts docker run command via --run to stdout', () => {
		const res = runCli([
			'--run',
			'docker run -d --name webapp -p 8080:80 -v ./data:/var/www/html nginx:alpine',
			'--scope',
			'rootless',
			'--stdout',
		]);
		expect(res.status).toBe(0);
		expect(res.stdout).toContain('[Container]');
		expect(res.stdout).toContain('Image=docker.io/library/nginx:alpine');
		expect(res.stdout).toContain('ContainerName=webapp');
		expect(res.stdout).toContain('PublishPort=8080:80');
		expect(res.stdout).toContain('Volume=./data:/var/www/html');
		expect(res.stdout).toContain('WantedBy=default.target');
	});

	it('applies SELinux private-Z relabeling to volumes', () => {
		const res = runCli([
			'--run',
			'docker run -d --name storage -v /opt/media:/data minio/minio',
			'--selinux',
			'private-Z',
		]);
		expect(res.status).toBe(0);
		expect(res.stdout).toContain('Volume=/opt/media:/data:Z');
	});

	it('converts Compose YAML via --input and writes files to --out-dir', () => {
		const composePath = path.join(tempDir, 'compose.yaml');
		const composeYaml = `services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    restart: always
  cache:
    image: redis:7-alpine
    restart: unless-stopped
`;
		writeFileSync(composePath, composeYaml, 'utf8');

		const outDir = path.join(tempDir, 'quadlet-units');
		const res = runCli([
			'--input',
			composePath,
			'--stack',
			'mysite',
			'--out-dir',
			outDir,
		]);

		expect(res.status).toBe(0);
		expect(res.stderr).toContain('Successfully wrote');
		expect(existsSync(path.join(outDir, 'web.container'))).toBe(true);
		expect(existsSync(path.join(outDir, 'cache.container'))).toBe(true);
		expect(existsSync(path.join(outDir, 'mysite.network'))).toBe(true);

		const webContent = readFileSync(path.join(outDir, 'web.container'), 'utf8');
		expect(webContent).toContain('Image=docker.io/library/nginx:latest');
		expect(webContent).toContain('Network=mysite.network');
		expect(webContent).toContain('Restart=always');

		const netContent = readFileSync(path.join(outDir, 'mysite.network'), 'utf8');
		expect(netContent).toContain('[Network]');
		expect(netContent).toContain('NetworkName=mysite');
	});

	it('exports a valid ZIP bundle with --zip', () => {
		const composePath = path.join(tempDir, 'stack.yaml');
		const composeYaml = `services:
  api:
    image: python:3.12-slim
    ports:
      - "5000:5000"
`;
		writeFileSync(composePath, composeYaml, 'utf8');

		const zipPath = path.join(tempDir, 'export.zip');
		const res = runCli(['--input', composePath, '--stack', 'backend', '--zip', zipPath]);

		expect(res.status).toBe(0);
		expect(existsSync(zipPath)).toBe(true);
		const zipBuffer = readFileSync(zipPath);
		// Check PKZIP signature 0x04034b50 (PK\x03\x04)
		expect(zipBuffer[0]).toBe(0x50);
		expect(zipBuffer[1]).toBe(0x4b);
		expect(zipBuffer[2]).toBe(0x03);
		expect(zipBuffer[3]).toBe(0x04);
	});

	it('fails gracefully on missing input file', () => {
		const res = runCli(['--input', path.join(tempDir, 'nonexistent.yml')]);
		expect(res.status).toBe(1);
		expect(res.stderr).toContain('Input file not found');
	});

	it('fails on invalid scope argument', () => {
		const res = runCli(['--run', 'docker run alpine', '--scope', 'superuser']);
		expect(res.status).toBe(1);
		expect(res.stderr).toContain('Invalid --scope');
	});

	it('fails on invalid selinux argument', () => {
		const res = runCli(['--run', 'docker run alpine', '--selinux', 'invalid-mode']);
		expect(res.status).toBe(1);
		expect(res.stderr).toContain('Invalid --selinux');
	});
});
