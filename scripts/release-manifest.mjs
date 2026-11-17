#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'composetoquadlet';
const DEFAULT_SITE_URL = 'https://quadletgen.com';
const SITEMAP_FILE = 'sitemap-0.xml';
const RELEASE_FILE = 'release.json';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const sharedScriptPath = path.resolve(repoRoot, '../../40_shared/scripts/indie-release-manifest.mjs');
const sharedExpectedRepoPath = path.resolve(repoRoot, '../../30_products/compose-to-quadlet');

function canUseSharedManifestScript() {
	if (!existsSync(sharedScriptPath) || !existsSync(sharedExpectedRepoPath)) {
		return false;
	}
	try {
		return realpathSync(process.cwd()) === realpathSync(sharedExpectedRepoPath);
	} catch {
		return false;
	}
}

function normalizeRoute(value) {
	const raw = String(value || '').trim();
	if (!raw) {
		return raw;
	}
	try {
		const url = new URL(raw);
		let pathname = url.pathname || '/';
		if (!pathname.endsWith('/')) {
			pathname = `${pathname}/`;
		}
		return `${url.origin}${pathname}`;
	} catch {
		return raw;
	}
}

function parseSitemapUrls(xml) {
	const urls = [];
	const pattern = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
	for (const match of String(xml).matchAll(pattern)) {
		urls.push(normalizeRoute(match[1]));
	}
	return [...new Set(urls)].sort();
}

function sha256Text(text) {
	return createHash('sha256').update(text).digest('hex');
}

function runGit(cwd, args) {
	return spawnSync('git', args, {
		cwd,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

function gitOrFallback(cwd, args, fallback = '') {
	const res = runGit(cwd, args);
	if (res.status !== 0) {
		return fallback;
	}
	return String(res.stdout || '').trim();
}

function parsePorcelainPath(line) {
	const body = /^.. /.test(line) ? line.slice(3) : line;
	const parts = body.split(' -> ');
	return parts[parts.length - 1].replace(/^"|"$/g, '');
}

function readGitSource(cwd) {
	const toplevel = gitOrFallback(cwd, ['rev-parse', '--show-toplevel'], cwd);
	const commit = gitOrFallback(toplevel, ['rev-parse', 'HEAD'], 'unknown');
	const branch = gitOrFallback(toplevel, ['rev-parse', '--abbrev-ref', 'HEAD'], 'HEAD');
	const upstreamRes = runGit(toplevel, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
	const upstream = upstreamRes.status === 0 ? String(upstreamRes.stdout || '').trim() || null : null;

	let ahead = 0;
	let behind = 0;
	if (upstream) {
		const counts = gitOrFallback(toplevel, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`], '');
		const [behindRaw, aheadRaw] = counts.split(/\s+/);
		const parsedBehind = Number.parseInt(behindRaw ?? '0', 10);
		const parsedAhead = Number.parseInt(aheadRaw ?? '0', 10);
		if (Number.isFinite(parsedBehind)) {
			behind = parsedBehind;
		}
		if (Number.isFinite(parsedAhead)) {
			ahead = parsedAhead;
		}
	}

	const statusRes = runGit(toplevel, ['status', '--porcelain']);
	const dirtyPaths =
		statusRes.status === 0
			? String(statusRes.stdout || '')
					.replace(/\n$/, '')
					.split(/\n/)
					.filter((line) => line.length > 0)
					.map(parsePorcelainPath)
					.sort()
			: [];

	return {
		commit,
		branch,
		upstream,
		ahead,
		behind,
		dirtyPaths,
	};
}

function routeHtmlPath(distDir, siteUrl, route) {
	const pathname = new URL(route, siteUrl).pathname;
	const relFile = pathname.endsWith('/')
		? `${pathname}index.html`
		: pathname.endsWith('.html')
			? pathname
			: `${pathname}/index.html`;
	return path.join(distDir, relFile.replace(/^\/+/, ''));
}

function assertMeasurementIdInHtml(distDir, siteUrl, routes, measurementId) {
	const missing = [];
	for (const route of routes) {
		const htmlFile = routeHtmlPath(distDir, siteUrl, route);
		if (!existsSync(htmlFile) || !readFileSync(htmlFile, 'utf8').includes(measurementId)) {
			missing.push(route);
		}
	}
	if (missing.length > 0) {
		const preview = missing.slice(0, 3).join(', ');
		const suffix = missing.length > 3 ? `, and ${missing.length - 3} more` : '';
		throw new Error(
			`GA4 measurement ID ${measurementId} is missing from ${missing.length} built route(s): ${preview}${suffix}.`,
		);
	}
}

function writeStandaloneManifest(distArg) {
	const distDir = path.resolve(process.cwd(), distArg);
	if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
		throw new Error(`Missing dist directory: ${distDir}`);
	}

	const sitemapPath = path.join(distDir, SITEMAP_FILE);
	if (!existsSync(sitemapPath)) {
		throw new Error(`Missing ${SITEMAP_FILE} in ${distDir}`);
	}

	const sitemapXml = readFileSync(sitemapPath, 'utf8');
	const routes = parseSitemapUrls(sitemapXml);
	if (routes.length === 0) {
		throw new Error(`${SITEMAP_FILE} contains no <loc> URLs.`);
	}

	const siteUrl = (process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
	const rawGa4 = (process.env.PUBLIC_GA4_MEASUREMENT_ID || '').trim();
	const hasExplicitGa4 =
		/^G-[A-Z0-9]{4,20}$/i.test(rawGa4) && rawGa4.toUpperCase() !== 'G-XXXXXXXXXX';
	const measurementId = hasExplicitGa4 ? rawGa4 : 'G-PENDING000';

	if (hasExplicitGa4) {
		assertMeasurementIdInHtml(distDir, siteUrl, routes, measurementId);
	}

	const source = readGitSource(process.cwd());
	const manifest = {
		schemaVersion: 1,
		project: PROJECT_ID,
		siteUrl,
		measurementId,
		builtAt: new Date().toISOString(),
		source,
		routes,
		routeCount: routes.length,
		sitemapSha256: sha256Text(sitemapXml),
	};

	const outPath = path.join(distDir, RELEASE_FILE);
	writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
	const relOut = path.relative(process.cwd(), outPath) || outPath;
	console.log(
		`${manifest.project} wrote ${relOut}: ${manifest.routeCount} routes, commit ${String(source.commit).slice(0, 12)}`,
	);
}

const distFlagIndex = process.argv.indexOf('--dist');
const distTarget =
	distFlagIndex !== -1 && process.argv[distFlagIndex + 1]
		? process.argv[distFlagIndex + 1]
		: 'dist';

if (canUseSharedManifestScript()) {
	const res = spawnSync(
		process.execPath,
		[sharedScriptPath, '--project', PROJECT_ID, '--dist', distTarget, '--write'],
		{ stdio: 'inherit' },
	);
	process.exit(res.status ?? 1);
}

writeStandaloneManifest(distTarget);
