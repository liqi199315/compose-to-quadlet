import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SITE_ORIGIN = (process.env.PUBLIC_SITE_URL || 'https://quadletgen.com').replace(/\/$/, '');

export const CONTENT_ROUTES = [
	{
		route: '/',
		file: 'index.html',
		canonical: `${SITE_ORIGIN}/`,
		isToolRoute: true,
	},
	{
		route: '/podman-quadlet-generator/',
		file: 'podman-quadlet-generator/index.html',
		canonical: `${SITE_ORIGIN}/podman-quadlet-generator/`,
		isToolRoute: true,
	},
	{
		route: '/docker-run-to-quadlet-converter/',
		file: 'docker-run-to-quadlet-converter/index.html',
		canonical: `${SITE_ORIGIN}/docker-run-to-quadlet-converter/`,
		isToolRoute: true,
	},
	{
		route: '/rootless-quadlet-selinux-volume-generator/',
		file: 'rootless-quadlet-selinux-volume-generator/index.html',
		canonical: `${SITE_ORIGIN}/rootless-quadlet-selinux-volume-generator/`,
		isToolRoute: true,
	},
	{
		route: '/immich-nextcloud-vaultwarden-quadlet-templates/',
		file: 'immich-nextcloud-vaultwarden-quadlet-templates/index.html',
		canonical: `${SITE_ORIGIN}/immich-nextcloud-vaultwarden-quadlet-templates/`,
		isToolRoute: true,
	},
	{
		route: '/podlet-online-multi-container-network-packager/',
		file: 'podlet-online-multi-container-network-packager/index.html',
		canonical: `${SITE_ORIGIN}/podlet-online-multi-container-network-packager/`,
		isToolRoute: true,
	},
	{
		route: '/quadlet-depends-on-healthcheck/',
		file: 'quadlet-depends-on-healthcheck/index.html',
		canonical: `${SITE_ORIGIN}/quadlet-depends-on-healthcheck/`,
		isToolRoute: true,
	},
	{
		route: '/quadlet-not-starting-on-boot/',
		file: 'quadlet-not-starting-on-boot/index.html',
		canonical: `${SITE_ORIGIN}/quadlet-not-starting-on-boot/`,
		isToolRoute: true,
	},
	{
		route: '/podman-pihole-quadlet/',
		file: 'podman-pihole-quadlet/index.html',
		canonical: `${SITE_ORIGIN}/podman-pihole-quadlet/`,
		isToolRoute: true,
	},
	{
		route: '/jellyfin-podman-quadlet/',
		file: 'jellyfin-podman-quadlet/index.html',
		canonical: `${SITE_ORIGIN}/jellyfin-podman-quadlet/`,
		isToolRoute: true,
	},
	{
		route: '/quadlet-vs-docker-compose/',
		file: 'quadlet-vs-docker-compose/index.html',
		canonical: `${SITE_ORIGIN}/quadlet-vs-docker-compose/`,
		isToolRoute: true,
	},
	{
		route: '/about/',
		file: 'about/index.html',
		canonical: `${SITE_ORIGIN}/about/`,
		isToolRoute: false,
	},
	{
		route: '/privacy/',
		file: 'privacy/index.html',
		canonical: `${SITE_ORIGIN}/privacy/`,
		isToolRoute: false,
	},
	{
		route: '/terms/',
		file: 'terms/index.html',
		canonical: `${SITE_ORIGIN}/terms/`,
		isToolRoute: false,
	},
];

export const EXTRA_REQUIRED_FILES = [
	'404.html',
	'sitemap-index.xml',
	'robots.txt',
	'llms.txt',
	'_headers',
	'og-image.svg',
	'og-image.png',
	'github-social-preview.png',
	'site.webmanifest',
	'indexnow-key.txt',
	'c9d2e4f73a814b629d4c35e8f2a16c53.txt',
];

const LONG_DASH_PATTERN = /[\u2013\u2014]|&(?:mdash|ndash|#8211|#8212|#x2013|#x2014);/i;
const LOREM_PATTERN = /lorem\s+ipsum/i;

function isExistingFile(filePath) {
	try {
		return existsSync(filePath) && statSync(filePath).isFile();
	} catch {
		return false;
	}
}

function walkHtmlFiles(dirPath, rootDir = dirPath, acc = []) {
	if (!existsSync(dirPath)) {
		return acc;
	}
	for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			walkHtmlFiles(fullPath, rootDir, acc);
		} else if (entry.isFile() && entry.name.endsWith('.html')) {
			acc.push(path.relative(rootDir, fullPath).split(path.sep).join('/'));
		}
	}
	return acc.sort();
}

function parseAttributes(attrSource) {
	const attrs = {};
	const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
	let match;
	while ((match = attrRegex.exec(attrSource)) !== null) {
		const key = match[1].toLowerCase();
		const value = match[2] ?? match[3] ?? match[4] ?? '';
		attrs[key] = value;
	}
	return attrs;
}

function decodeBasicEntities(value) {
	return value
		.replace(/&quot;/g, '"')
		.replace(/&#34;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

function stripTags(html) {
	return decodeBasicEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function stripScriptsStylesAndComments(html) {
	return html
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
}

function extractHeadSection(html) {
	const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
	const raw = headMatch ? headMatch[1] : html;
	return stripScriptsStylesAndComments(raw).replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '');
}

function collectSchemaTypes(node, types) {
	if (Array.isArray(node)) {
		for (const item of node) {
			collectSchemaTypes(item, types);
		}
		return;
	}
	if (node && typeof node === 'object') {
		const rawType = node['@type'];
		if (typeof rawType === 'string') {
			types.add(rawType);
		} else if (Array.isArray(rawType)) {
			for (const entry of rawType) {
				if (typeof entry === 'string') {
					types.add(entry);
				}
			}
		}
		for (const value of Object.values(node)) {
			collectSchemaTypes(value, types);
		}
	}
}

function collectJsonStrings(node, strings) {
	if (typeof node === 'string') {
		strings.push(node);
		return;
	}
	if (Array.isArray(node)) {
		for (const item of node) {
			collectJsonStrings(item, strings);
		}
		return;
	}
	if (node && typeof node === 'object') {
		for (const [key, value] of Object.entries(node)) {
			strings.push(key);
			collectJsonStrings(value, strings);
		}
	}
}

function checkForbiddenText(text, label, errors, checkBraces = true) {
	if (checkBraces && text.includes('{{')) {
		errors.push(`${label}: contains forbidden placeholder token "{{"`);
	}
	if (checkBraces && text.includes('}}')) {
		errors.push(`${label}: contains forbidden placeholder token "}}"`);
	}
	if (text.includes('TODO')) {
		errors.push(`${label}: contains forbidden token "TODO"`);
	}
	if (text.includes('FIXME')) {
		errors.push(`${label}: contains forbidden token "FIXME"`);
	}
	if (LOREM_PATTERN.test(text)) {
		errors.push(`${label}: contains forbidden "lorem ipsum" copy`);
	}
	if (LONG_DASH_PATTERN.test(text)) {
		errors.push(`${label}: contains forbidden em-dash or en-dash character`);
	}
}

function inspectHtmlForbiddenTokens(rawHtml, relFile, errors) {
	checkForbiddenText(rawHtml, relFile, errors, false);

	const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
	let scriptMatch;
	while ((scriptMatch = scriptRegex.exec(rawHtml)) !== null) {
		const attrs = parseAttributes(scriptMatch[1]);
		if ((attrs.type ?? '').toLowerCase() === 'application/ld+json') {
			try {
				const parsed = JSON.parse(scriptMatch[2].trim());
				const jsonStrings = [];
				collectJsonStrings(parsed, jsonStrings);
				for (const str of jsonStrings) {
					checkForbiddenText(str, `${relFile} (JSON-LD)`, errors, true);
				}
			} catch {
				checkForbiddenText(scriptMatch[2], `${relFile} (raw JSON-LD)`, errors, true);
			}
		}
	}

	let markupOnly = stripScriptsStylesAndComments(rawHtml);
	markupOnly = markupOnly.replace(
		/<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi,
		(fullMatch, attrPart, innerText) => {
			const decoded = decodeBasicEntities(innerText).trim();
			if (decoded.startsWith('{') || decoded.startsWith('[')) {
				try {
					const parsed = JSON.parse(decoded);
					const jsonStrings = [];
					collectJsonStrings(parsed, jsonStrings);
					for (const str of jsonStrings) {
						checkForbiddenText(str, `${relFile} (textarea JSON)`, errors, true);
					}
					return `<textarea${attrPart}></textarea>`;
				} catch {
					return fullMatch;
				}
			}
			return fullMatch;
		},
	);

	checkForbiddenText(markupOnly, relFile, errors, true);
}

function resolveInternalHref(distDir, href) {
	const rawPath = href.split('#')[0].split('?')[0];
	let decodedPath;
	try {
		decodedPath = decodeURIComponent(rawPath);
	} catch {
		return null;
	}

	const normalizedRoot = path.resolve(distDir);
	const rel = decodedPath.replace(/^\/+/, '');
	const candidates =
		decodedPath === '' || decodedPath === '/'
			? [path.resolve(normalizedRoot, 'index.html')]
			: decodedPath.endsWith('/')
				? [path.resolve(normalizedRoot, rel, 'index.html')]
				: [
						path.resolve(normalizedRoot, rel),
						path.resolve(normalizedRoot, rel, 'index.html'),
						path.resolve(normalizedRoot, `${rel}.html`),
					];

	for (const candidate of candidates) {
		const relative = path.relative(normalizedRoot, candidate);
		if (relative.startsWith('..') || path.isAbsolute(relative)) {
			return null;
		}
		if (isExistingFile(candidate)) {
			return candidate;
		}
	}
	return null;
}

export function inspectDist(distDir) {
	const errors = [];

	const requiredFiles = [
		...CONTENT_ROUTES.map((entry) => entry.file),
		...EXTRA_REQUIRED_FILES,
	];

	for (const relFile of requiredFiles) {
		const absPath = path.join(distDir, relFile);
		if (!isExistingFile(absPath)) {
			errors.push(`Missing required built file: dist/${relFile}`);
		} else if (statSync(absPath).size === 0) {
			errors.push(`Built file is empty: dist/${relFile}`);
		}
	}

	const seenTitles = new Map();
	const seenDescriptions = new Map();

	for (const routeEntry of CONTENT_ROUTES) {
		const absPath = path.join(distDir, routeEntry.file);
		if (!isExistingFile(absPath)) {
			continue;
		}
		const html = readFileSync(absPath, 'utf8');
		const head = extractHeadSection(html);

		const titleMatches = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
		if (titleMatches.length !== 1) {
			errors.push(`${routeEntry.file}: expected exactly 1 <title>, found ${titleMatches.length}`);
		} else {
			const titleText = stripTags(titleMatches[0][1]);
			if (!titleText) {
				errors.push(`${routeEntry.file}: <title> must not be empty`);
			} else if (seenTitles.has(titleText)) {
				errors.push(
					`${routeEntry.file}: duplicate <title> "${titleText}" (already used in ${seenTitles.get(titleText)})`,
				);
			} else {
				seenTitles.set(titleText, routeEntry.file);
			}
		}

		const metaTags = [...head.matchAll(/<meta\b([^>]*)>/gi)].map((m) => parseAttributes(m[1]));
		const descriptionMetas = metaTags.filter(
			(attrs) => (attrs.name ?? '').toLowerCase() === 'description',
		);
		if (descriptionMetas.length !== 1) {
			errors.push(
				`${routeEntry.file}: expected exactly 1 <meta name="description">, found ${descriptionMetas.length}`,
			);
		} else {
			const desc = decodeBasicEntities(descriptionMetas[0].content ?? '').trim();
			if (!desc) {
				errors.push(`${routeEntry.file}: <meta name="description"> content must not be empty`);
			} else if (seenDescriptions.has(desc)) {
				errors.push(
					`${routeEntry.file}: duplicate meta description (already used in ${seenDescriptions.get(desc)})`,
				);
			} else {
				seenDescriptions.set(desc, routeEntry.file);
			}
		}

		const ogImageMetas = metaTags.filter(
			(attrs) => (attrs.property ?? '').toLowerCase() === 'og:image',
		);
		if (ogImageMetas.length !== 1) {
			errors.push(
				`${routeEntry.file}: expected exactly 1 <meta property="og:image">, found ${ogImageMetas.length}`,
			);
		} else {
			const ogImageContent = decodeBasicEntities(ogImageMetas[0].content ?? '').trim();
			if (!ogImageContent.startsWith(`${SITE_ORIGIN}/`)) {
				errors.push(
					`${routeEntry.file}: og:image "${ogImageContent}" must start with "${SITE_ORIGIN}/"`,
				);
			} else if (!ogImageContent.endsWith('/og-image.png')) {
				errors.push(
					`${routeEntry.file}: og:image "${ogImageContent}" must end in "/og-image.png"`,
				);
			} else {
				const ogImagePath = ogImageContent.slice(SITE_ORIGIN.length);
				if (!resolveInternalHref(distDir, ogImagePath)) {
					errors.push(
						`${routeEntry.file}: og:image asset "${ogImagePath}" does not exist in dist/`,
					);
				}
			}
		}

		const linkTags = [...head.matchAll(/<link\b([^>]*)>/gi)].map((m) => parseAttributes(m[1]));
		const canonicalLinks = linkTags.filter((attrs) =>
			(attrs.rel ?? '').toLowerCase().split(/\s+/).includes('canonical'),
		);
		if (canonicalLinks.length !== 1) {
			errors.push(
				`${routeEntry.file}: expected exactly 1 <link rel="canonical">, found ${canonicalLinks.length}`,
			);
		} else if (canonicalLinks[0].href !== routeEntry.canonical) {
			errors.push(
				`${routeEntry.file}: canonical href "${canonicalLinks[0].href ?? ''}" does not match expected "${routeEntry.canonical}"`,
			);
		}

		const bodyWithoutScripts = stripScriptsStylesAndComments(html);
		const h1Matches = [...bodyWithoutScripts.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
		if (h1Matches.length !== 1) {
			errors.push(`${routeEntry.file}: expected exactly 1 <h1>, found ${h1Matches.length}`);
		} else if (!stripTags(h1Matches[0][1])) {
			errors.push(`${routeEntry.file}: <h1> text must not be empty`);
		}

		const ldScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(
			(m) => (parseAttributes(m[1]).type ?? '').toLowerCase() === 'application/ld+json',
		);
		if (ldScripts.length === 0) {
			errors.push(`${routeEntry.file}: missing <script type="application/ld+json">`);
		} else {
			const schemaTypes = new Set();
			for (const block of ldScripts) {
				try {
					const parsed = JSON.parse(block[2].trim());
					collectSchemaTypes(parsed, schemaTypes);
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					errors.push(`${routeEntry.file}: invalid JSON-LD (${message})`);
				}
			}
			if (!schemaTypes.has('Organization')) {
				errors.push(`${routeEntry.file}: JSON-LD missing required @type "Organization"`);
			}
			if (!schemaTypes.has('BreadcrumbList')) {
				errors.push(`${routeEntry.file}: JSON-LD missing required @type "BreadcrumbList"`);
			}
			if (routeEntry.isToolRoute) {
				if (!schemaTypes.has('WebApplication')) {
					errors.push(`${routeEntry.file}: JSON-LD missing required @type "WebApplication"`);
				}
				if (!schemaTypes.has('FAQPage')) {
					errors.push(`${routeEntry.file}: JSON-LD missing required @type "FAQPage"`);
				}
			}
		}
	}

	const htmlFiles = walkHtmlFiles(distDir);
	let internalLinksChecked = 0;

	for (const relFile of htmlFiles) {
		const absPath = path.join(distDir, relFile);
		const html = readFileSync(absPath, 'utf8');
		inspectHtmlForbiddenTokens(html, `dist/${relFile}`, errors);

		const cleanHtml = stripScriptsStylesAndComments(html);
		for (const anchorMatch of cleanHtml.matchAll(/<a\b([^>]*)>/gi)) {
			const attrs = parseAttributes(anchorMatch[1]);
			const href = attrs.href;
			if (typeof href !== 'string' || !href.startsWith('/')) {
				continue;
			}
			if (href.startsWith('//')) {
				errors.push(`dist/${relFile}: protocol-relative internal link "${href}" is forbidden`);
				continue;
			}
			internalLinksChecked += 1;
			if (!resolveInternalHref(distDir, href)) {
				errors.push(`dist/${relFile}: internal link "${href}" does not resolve to a file in dist/`);
			}
		}
	}

	for (const textAsset of ['llms.txt', 'robots.txt', '_headers', 'sitemap-index.xml', 'indexnow-key.txt']) {
		const assetPath = path.join(distDir, textAsset);
		if (isExistingFile(assetPath)) {
			const assetText = readFileSync(assetPath, 'utf8');
			checkForbiddenText(assetText, `dist/${textAsset}`, errors, true);
		}
	}

	const headersPath = path.join(distDir, '_headers');
	if (isExistingFile(headersPath)) {
		const headersText = readFileSync(headersPath, 'utf8');
		if (/^https?:\/\//m.test(headersText)) {
			errors.push('dist/_headers: host-prefixed https:// rules are ignored by Workers Static Assets; use wrangler.jsonc workers_dev: false instead');
		}
		if (!headersText.includes('Content-Security-Policy:')) {
			errors.push('dist/_headers: must contain Content-Security-Policy header');
		}
		if (!headersText.includes('Strict-Transport-Security:')) {
			errors.push('dist/_headers: must contain Strict-Transport-Security header');
		}
	}

	const wranglerPath = path.resolve(distDir, '..', 'wrangler.jsonc');
	if (isExistingFile(wranglerPath)) {
		const rawWrangler = readFileSync(wranglerPath, 'utf8').replace(/^\s*\/\/.*$/gm, '');
		const wranglerCfg = JSON.parse(rawWrangler);
		if (wranglerCfg.workers_dev !== false || wranglerCfg.preview_urls !== false) {
			errors.push('wrangler.jsonc: workers_dev and preview_urls must both be false once custom domain is active');
		}
	}

	const ogImagePath = path.join(distDir, 'og-image.svg');
	if (isExistingFile(ogImagePath)) {
		const svgText = readFileSync(ogImagePath, 'utf8');
		checkForbiddenText(svgText, 'dist/og-image.svg', errors, false);
		if (!/<svg\b/i.test(svgText)) {
			errors.push('dist/og-image.svg: file does not contain a valid <svg> root element');
		}
	}

	const ogPngPath = path.join(distDir, 'og-image.png');
	if (isExistingFile(ogPngPath)) {
		const stat = statSync(ogPngPath);
		if (stat.size <= 5120) {
			errors.push(`dist/og-image.png: file size (${stat.size} bytes) must be greater than 5 KB`);
		}
		const buffer = readFileSync(ogPngPath);
		const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
		const isPng = pngMagic.every((byte, idx) => buffer[idx] === byte);
		if (!isPng) {
			errors.push('dist/og-image.png: invalid PNG magic bytes header');
		}
	}

	const ghPreviewPath = path.join(distDir, 'github-social-preview.png');
	if (isExistingFile(ghPreviewPath)) {
		const stat = statSync(ghPreviewPath);
		if (stat.size <= 5120) {
			errors.push(`dist/github-social-preview.png: file size (${stat.size} bytes) must be greater than 5 KB`);
		}
		const buffer = readFileSync(ghPreviewPath);
		const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
		const isPng = pngMagic.every((byte, idx) => buffer[idx] === byte);
		if (!isPng) {
			errors.push('dist/github-social-preview.png: invalid PNG magic bytes header');
		}
	}

	const manifestPath = path.join(distDir, 'site.webmanifest');
	if (isExistingFile(manifestPath)) {
		const manifestRaw = readFileSync(manifestPath, 'utf8');
		checkForbiddenText(manifestRaw, 'dist/site.webmanifest', errors, false);
		try {
			const manifestParsed = JSON.parse(manifestRaw);
			const manifestStrings = [];
			collectJsonStrings(manifestParsed, manifestStrings);
			for (const str of manifestStrings) {
				checkForbiddenText(str, 'dist/site.webmanifest (JSON)', errors, true);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			errors.push(`dist/site.webmanifest: invalid JSON (${message})`);
		}
	}

	const indexNowPath = path.join(distDir, 'indexnow-key.txt');
	if (isExistingFile(indexNowPath)) {
		const indexNowKey = readFileSync(indexNowPath, 'utf8').trim();
		if (!/^[A-Za-z0-9-]{8,128}$/.test(indexNowKey)) {
			errors.push('dist/indexnow-key.txt: must contain an 8 to 128 char alphanumeric/hyphen key');
		} else {
			const dualKeyPath = path.join(distDir, `${indexNowKey}.txt`);
			if (!isExistingFile(dualKeyPath)) {
				errors.push(`Missing dual IndexNow key file: dist/${indexNowKey}.txt`);
			} else {
				const dualKeyContent = readFileSync(dualKeyPath, 'utf8').trim();
				if (dualKeyContent !== indexNowKey) {
					errors.push(`dist/${indexNowKey}.txt content does not match indexnow-key.txt`);
				}
			}
		}
	}

	return {
		ok: errors.length === 0,
		routesChecked: CONTENT_ROUTES.length,
		htmlFilesChecked: htmlFiles.length,
		internalLinksChecked,
		errors,
	};
}

const isDirectExecution =
	Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
	const defaultDist = fileURLToPath(new URL('../dist', import.meta.url));
	const targetDist = process.argv[2] ? path.resolve(process.argv[2]) : defaultDist;
	const summary = inspectDist(targetDist);
	if (!summary.ok) {
		console.error(JSON.stringify(summary, null, 2));
		process.exit(1);
	}
	console.log(
		JSON.stringify(
			{
				ok: true,
				routesChecked: summary.routesChecked,
				htmlFilesChecked: summary.htmlFilesChecked,
				internalLinksChecked: summary.internalLinksChecked,
			},
			null,
			2,
		),
	);
}
