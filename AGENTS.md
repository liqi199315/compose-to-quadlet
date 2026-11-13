# AGENTS.md

## Session startup order

Read these four files in order at the start of every session before changing code or copy:

1. `PLAN_90DAY.md`
2. `NOW.md`
3. `AGENTS.md`
4. `LAUNCH_CHECKLIST.md` (when running launch, analytics, IndexNow, or referral tasks)

## Project scope and architecture

- **Brand and canonical site URL.** `QuadletGen` at `https://quadletgen.com` (`PUBLIC_SITE_URL` override supported; contact `hello@quadletgen.com`).
- **Workspace stage.** Formal independent product repository in `/Users/dake/Projects/aiapp/30_products/compose-to-quadlet/`.
- **Tech stack.** Astro 5 (`output: 'static'`, `trailingSlash: 'always'`, `build.format: 'directory'`), Tailwind CSS v4, TypeScript (`astro/tsconfigs/strict`), Vitest, Playwright, and Cloudflare Workers Static Assets (`wrangler.jsonc`).
- **Fourteen indexed content routes.** Eleven converter workbench routes (`WebApplication` + `FAQPage` + `Organization` + `BreadcrumbList` JSON-LD) and three E-E-A-T trust routes (`Organization` + `BreadcrumbList` JSON-LD):
	- `/` (`dist/index.html`)
	- `/podman-quadlet-generator/` (`dist/podman-quadlet-generator/index.html`)
	- `/docker-run-to-quadlet-converter/` (`dist/docker-run-to-quadlet-converter/index.html`)
	- `/rootless-quadlet-selinux-volume-generator/` (`dist/rootless-quadlet-selinux-volume-generator/index.html`)
	- `/immich-nextcloud-vaultwarden-quadlet-templates/` (`dist/immich-nextcloud-vaultwarden-quadlet-templates/index.html`)
	- `/podlet-online-multi-container-network-packager/` (`dist/podlet-online-multi-container-network-packager/index.html`)
	- `/quadlet-depends-on-healthcheck/` (`dist/quadlet-depends-on-healthcheck/index.html`)
	- `/quadlet-not-starting-on-boot/` (`dist/quadlet-not-starting-on-boot/index.html`)
	- `/podman-pihole-quadlet/` (`dist/podman-pihole-quadlet/index.html`)
	- `/jellyfin-podman-quadlet/` (`dist/jellyfin-podman-quadlet/index.html`)
	- `/quadlet-vs-docker-compose/` (`dist/quadlet-vs-docker-compose/index.html`)
	- `/about/` (`dist/about/index.html`)
	- `/privacy/` (`dist/privacy/index.html`)
	- `/terms/` (`dist/terms/index.html`)
- **Eleven auxiliary static outputs.** `dist/404.html`, `dist/sitemap-index.xml`, `dist/robots.txt`, `dist/llms.txt`, `dist/_headers`, `dist/og-image.svg`, `dist/og-image.png`, `dist/github-social-preview.png`, `dist/site.webmanifest`, `dist/indexnow-key.txt`, and `dist/c9d2e4f73a814b629d4c35e8f2a16c53.txt`.
- **Standalone Node ESM CLI.** `bin/compose-to-quadlet.mjs` (compiled from `src/cli.ts` via `npm run build:cli` with esbuild, supporting `--input`, `--run`, `--stack`, `--scope`, `--selinux`, `--out-dir`, `--stdout`, `--zip`, and `--help`).

## Non-negotiable red lines

1. **Browser-local zero-upload execution.** Every Compose YAML or Docker/Podman Run parse, Quadlet unit generation, SELinux mode toggle, `.env` secret separation, and ZIP pack runs locally in the user's browser RAM. Never send container definitions, credentials, stack names, or filenames over the network or into analytics payloads.
2. **Zero container limits and zero paywall.** Never add artificial caps on service counts, volume counts, or ZIP downloads. Multi-container stacks convert and export locally without registration barriers.
3. **Clean-room MIT licensing and trademark hygiene.** Keep all source code, test fixtures, sample templates, and page copy original under the MIT License, and preserve the explicit Red Hat / Podman / Docker non-affiliation notice on `/about/` and `/terms/`.
4. **Privacy-safe local-first analytics.** `window.dataLayer` queues `config` and sanitized funnel events (`quadlet_export`) with `anonymize_ip: true` and strict parameter scrubbing (`src/lib/analytics.ts`). Localhost and `127.0.0.1` previews must never load external analytics scripts (`0` external requests).
5. **Stable UI test contract.** Preserve the `data-testid` attributes required by `tests/e2e/quadlet.spec.ts` (`status-banner`, `compose-input`, `file-upload`, `template-select`, `load-template-btn`, `stack-name-input`, `scope-select`, `selinux-select`, `auto-update-checkbox`, `shared-network-checkbox`, `extract-secrets-checkbox`, `unit-file-tabs`, `unit-output`, `systemd-commands-box`, `copy-unit-btn`, and `download-zip-btn`) and maintain `scrollWidth <= 375` on `375x812` mobile viewports.
6. **Copy and code hygiene.** Never leave double-brace placeholders, to-do/fix-me markers, placeholder copy, em-dashes, or en-dashes in source files, built HTML, or static text assets. `scripts/seo-preflight.mjs` enforces this gate on every build.
7. **Human gate respect.** Tasks marked `[人工]` in `PLAN_90DAY.md` and `LAUNCH_CHECKLIST.md` belong to dake. Never fabricate live traffic metrics or unapproved affiliate URLs.
8. **Monetization and link disclosure.** When Linux VPS referral links are enabled, always include proximate plain-language disclosure and `rel="sponsored noopener"`. Note that Hetzner discontinued its self-service Cloud referral program, so affiliate integrations focus on verified programs such as DigitalOcean and Vultr. Never insert placeholder or unverified referral codes.

## Verification commands

Run all checks from `/Users/dake/Projects/aiapp/30_products/compose-to-quadlet`:

```bash
npm test
npm run build
npm run seo:check
npm run test:e2e
npm run verify:all
```

A change is complete only when `npm run verify:all` exits 0 and both `PLAN_90DAY.md` and `NOW.md` match the current repository state.

## Analytics

This project uses `--project composetoquadlet` (mapped to `30_products/compose-to-quadlet` and `https://quadletgen.com`) in `../../40_shared/analytics-sites.yaml`.
Read `../../40_shared/ANALYTICS.md` before pulling numbers.
Use `npm run ga4:report`, `npm run gsc:report`, `npm run bing:report`.
Do not pass another site's property ID.
