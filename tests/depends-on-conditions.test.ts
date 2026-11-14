import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { convertToQuadlet } from '../src/lib/quadlet-engine';
import type {
	ConversionWarning,
	GeneratedUnitFile,
	QuadletConvertOptions,
} from '../src/lib/types';
import { buildExportEntries, buildZipArchive, dependencySkips } from '../src/lib/zip-packager';

const FIXTURE_DIR = fileURLToPath(new URL('./fixtures/', import.meta.url));

const OPTIONS: QuadletConvertOptions = {
	stackName: 'depdemo',
	installScope: 'rootless',
	selinuxMode: 'none',
	enableAutoUpdate: false,
	generateSharedNetwork: true,
	extractSecretsToEnvFile: false,
};

function readFixture(name: string): string {
	return readFileSync(`${FIXTURE_DIR}${name}`, 'utf8');
}

function convertFixture(name: string): Extract<ReturnType<typeof convertToQuadlet>, { ok: true }> {
	const result = convertToQuadlet(readFixture(name), OPTIONS);
	expect(result.ok).toBe(true);
	if (!result.ok) {
		throw new Error(result.error);
	}
	return result;
}

function unit(result: { files: GeneratedUnitFile[] }, filename: string): string {
	const file = result.files.find((entry) => entry.filename === filename);
	expect(file, `${filename} should be generated`).toBeDefined();
	return file?.content ?? '';
}

function readStoredZipEntries(zip: Uint8Array): Map<string, string> {
	const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
	const decoder = new TextDecoder();
	const eocdOffset = zip.length - 22;
	expect(view.getUint32(eocdOffset, true)).toBe(0x06054b50);
	const entryCount = view.getUint16(eocdOffset + 10, true);
	let cursor = view.getUint32(eocdOffset + 16, true);
	const entries = new Map<string, string>();

	for (let index = 0; index < entryCount; index += 1) {
		expect(view.getUint32(cursor, true)).toBe(0x02014b50);
		const nameLength = view.getUint16(cursor + 28, true);
		const extraLength = view.getUint16(cursor + 30, true);
		const commentLength = view.getUint16(cursor + 32, true);
		const localOffset = view.getUint32(cursor + 42, true);
		const name = decoder.decode(zip.subarray(cursor + 46, cursor + 46 + nameLength));

		expect(view.getUint32(localOffset, true)).toBe(0x04034b50);
		const localNameLength = view.getUint16(localOffset + 26, true);
		const localExtraLength = view.getUint16(localOffset + 28, true);
		const size = view.getUint32(localOffset + 18, true);
		const dataStart = localOffset + 30 + localNameLength + localExtraLength;
		entries.set(name, decoder.decode(zip.subarray(dataStart, dataStart + size)));

		cursor += 46 + nameLength + extraLength + commentLength;
	}

	return entries;
}

function findWarning(
	warnings: ConversionWarning[],
	predicate: (warning: ConversionWarning) => boolean,
): ConversionWarning {
	const warning = warnings.find(predicate);
	expect(warning, 'expected warning was not emitted').toBeDefined();
	if (!warning) {
		throw new Error('missing warning');
	}
	return warning;
}

describe('depends_on condition mapping', () => {
	it('treats the array form as service_started and writes only startup ordering', () => {
		const result = convertFixture('depends-on-conditions.yaml');
		const edge = unit(result, 'edge.container');

		expect(edge).toContain('After=api.service');
		expect(edge).toContain('Requires=api.service');
		expect(edge).not.toContain('Notify=');
		expect(dependencySkips(result.warnings).some((warning) => warning.service === 'edge')).toBe(false);
	});

	it('maps service_healthy with a usable healthcheck to Notify=healthy on the dependency', () => {
		const result = convertFixture('depends-on-conditions.yaml');
		const api = unit(result, 'api.container');
		const db = unit(result, 'db.container');

		expect(api).toContain('After=db.service');
		expect(api).toContain('Requires=db.service');
		expect(db).toContain('HealthCmd=pg_isready -U example');
		expect(db).toContain('Notify=healthy');
		expect(
			result.warnings.some(
				(warning) =>
					warning.service === 'api' && warning.field === 'depends_on.db.condition',
			),
		).toBe(false);

		const mixed = findWarning(
			result.warnings,
			(warning) =>
				warning.service === 'worker' &&
				warning.field === 'depends_on.db.condition' &&
				warning.code === 'depends_on.service_healthy.stricter_for_service_started',
		);
		expect(mixed.impact).toBe('degraded');
		expect(mixed.message).toContain('stricter than Compose');
	});

	it('skips health waiting and records it when service_healthy has no usable healthcheck', () => {
		const result = convertFixture('depends-on-conditions.yaml');
		const api = unit(result, 'api.container');
		const cache = unit(result, 'cache.container');
		const indexer = unit(result, 'indexer.container');

		expect(api).toContain('After=cache.service');
		expect(api).toContain('Requires=cache.service');
		expect(cache).not.toContain('Notify=healthy');
		expect(indexer).not.toContain('Notify=healthy');
		expect(indexer).not.toContain('HealthCmd=NONE');

		const cacheSkip = findWarning(
			result.warnings,
			(warning) =>
				warning.service === 'api' &&
				warning.field === 'depends_on.cache.condition' &&
				warning.code === 'depends_on.service_healthy.missing_healthcheck',
		);
		expect(cacheSkip.impact).toBe('skipped');
		expect(cacheSkip.message).toContain('cache');
		expect(cacheSkip.message).toContain('service_healthy');

		findWarning(
			result.warnings,
			(warning) =>
				warning.service === 'api' &&
				warning.field === 'depends_on.indexer.condition' &&
				warning.code === 'depends_on.service_healthy.missing_healthcheck',
		);
	});

	it('records service_completed_successfully as skipped instead of implying exit status is awaited', () => {
		const result = convertFixture('depends-on-conditions.yaml');
		const api = unit(result, 'api.container');
		const worker = unit(result, 'worker.container');

		expect(api).toContain('After=migrate.service');
		expect(api).toContain('Requires=migrate.service');
		expect(worker).toContain('After=migrate.service');
		expect(worker).toContain('Wants=migrate.service');
		expect(worker).not.toContain('Requires=migrate.service');

		const completedSkip = findWarning(
			result.warnings,
			(warning) =>
				warning.service === 'api' &&
				warning.field === 'depends_on.migrate.condition' &&
				warning.code === 'depends_on.service_completed_successfully.unsupported',
		);
		expect(completedSkip.impact).toBe('skipped');
		expect(completedSkip.message).toContain('exit status is not awaited');
	});

	it('warns and records an unknown condition treated as service_started', () => {
		const result = convertFixture('depends-on-conditions.yaml');
		const worker = unit(result, 'worker.container');

		expect(worker).toContain('After=gate.service');
		expect(worker).toContain('Requires=gate.service');

		const unknownSkip = findWarning(
			result.warnings,
			(warning) =>
				warning.service === 'worker' &&
				warning.field === 'depends_on.gate.condition' &&
				warning.code === 'depends_on.condition.unknown',
		);
		expect(unknownSkip.impact).toBe('skipped');
		expect(unknownSkip.message).toContain('service_unhealthy');
	});

	it('records a non-string condition as skipped with a precise field', () => {
		const compose = `services:
  app:
    image: nginx:1.27-alpine
    depends_on:
      db:
        condition: 3
  db:
    image: postgres:16-alpine
`;
		const result = convertToQuadlet(compose, OPTIONS);
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		const invalidCondition = findWarning(
			result.warnings,
			(warning) =>
				warning.service === 'app' &&
				warning.field === 'depends_on.db.condition' &&
				warning.code === 'depends_on.condition.invalid',
		);
		expect(invalidCondition.impact).toBe('skipped');
		expect(invalidCondition.message).toContain('not a non-empty string');
	});

	it('records a depends_on target that is missing from the Compose file', () => {
		const result = convertFixture('depends-on-conditions.yaml');

		const missingSkip = findWarning(
			result.warnings,
			(warning) =>
				warning.service === 'api' &&
				warning.field === 'depends_on.missing' &&
				warning.code === 'depends_on.target.missing',
		);
		expect(missingSkip.impact).toBe('skipped');
		expect(missingSkip.message).toContain('missing.service');
	});

	it('records invalid depends_on shapes as skipped instead of dropping them silently', () => {
		const result = convertFixture('depends-on-invalid.yaml');
		const app = unit(result, 'app.container');
		const report = unit(result, 'report.container');

		expect(app).toContain('After=cache.service');
		expect(report).not.toContain('After=cache.service');

		const invalidEntry = findWarning(
			result.warnings,
			(warning) => warning.field === 'depends_on[1]' && warning.code === 'depends_on.entry.invalid',
		);
		expect(invalidEntry.impact).toBe('skipped');

		const invalidShape = findWarning(
			result.warnings,
			(warning) =>
				warning.service === 'report' &&
				warning.field === 'depends_on' &&
				warning.code === 'depends_on.shape.invalid',
		);
		expect(invalidShape.impact).toBe('skipped');
	});
});

describe('ZIP export dependency skip list', () => {
	it('adds a README entry that lists every skipped or degraded depends_on condition', () => {
		const result = convertFixture('depends-on-conditions.yaml');
		const entries = buildExportEntries(result.files, OPTIONS.stackName, result.warnings);
		const archive = readStoredZipEntries(buildZipArchive(entries));
		const readme = archive.get('README.txt');

		expect(readme).toBeDefined();
		expect(archive.has('db.container')).toBe(true);
		expect(readme).toContain('depdemo');
		expect(readme).toContain('depends_on.cache.condition');
		expect(readme).toContain('depends_on.migrate.condition');
		expect(readme).toContain('depends_on.gate.condition');
		expect(readme).toContain('depends_on.missing');
		expect(readme).toContain('service_healthy');
		expect(readme).toContain('service_completed_successfully');
		expect(readme).toContain('service_unhealthy');
		expect(readme).toContain('After=');
		expect(readme).toContain('order startup only');
		expect(dependencySkips(result.warnings).length).toBeGreaterThanOrEqual(6);
	});

	it('exports only unit files when every depends_on condition maps cleanly', () => {
		const compose = `services:
  web:
    image: nginx:1.27-alpine
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD", "pg_isready"]
  client:
    image: busybox:1.36
    depends_on:
      - cache
  cache:
    image: redis:7-alpine
`;
		const result = convertToQuadlet(compose, OPTIONS);
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		const entries = buildExportEntries(result.files, OPTIONS.stackName, result.warnings);
		const archive = readStoredZipEntries(buildZipArchive(entries));

		expect(archive.has('README.txt')).toBe(false);
		expect(
			[...archive.keys()].every(
				(name) => name.endsWith('.container') || name.endsWith('.network'),
			),
		).toBe(true);
	});
});
