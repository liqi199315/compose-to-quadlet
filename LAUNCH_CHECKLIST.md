# Production Launch Checklist (`quadletgen.com`)

Operator checklist for launching **QuadletGen** (`https://quadletgen.com`) from `/Users/dake/Projects/aiapp/30_products/compose-to-quadlet/`. Steps marked `[人工]` require dake's account credentials or payment methods; never commit private keys, API tokens, or affiliate portal passwords into Git.

---

## 1. Local Pre-Flight Gate (`[AI]` / `[人工]`)

Run the full verification suite from `/Users/dake/Projects/aiapp/30_products/compose-to-quadlet` before deploying:

```bash
PUBLIC_SITE_URL=https://quadletgen.com npm run verify:all
```

Confirm all four gates pass:
- [ ] `npm test` passes all Vitest parser, formatter, packager, and CLI specs.
- [ ] `npm run build` outputs all 14 route HTML files plus `404.html`, `sitemap-index.xml`, `robots.txt`, `llms.txt`, `_headers`, `og-image.svg`, `og-image.png`, `github-social-preview.png`, `site.webmanifest`, `indexnow-key.txt`, and `c9d2e4f73a814b629d4c35e8f2a16c53.txt` into `dist/`.
- [ ] `npm run seo:check` (`scripts/seo-preflight.mjs`) reports `ok: true`, `routesChecked: 14`, valid `og:image` ending in `/og-image.png` with PNG magic bytes (>5 KB), dual IndexNow key file, `X-Robots-Tag: noindex` in `_headers`, `Organization` + `BreadcrumbList` on all 14 routes, `WebApplication` + `FAQPage` on all 11 converter routes, resolved internal links, and zero placeholders or long-dashes.
- [ ] `npm run test:e2e` passes all 7 Playwright Chromium journeys, including `window.dataLayer` (`config` + `quadlet_export`) with `0` external requests on `127.0.0.1`, the five long-tail guides, and `scrollWidth <= 375` on `375x812` mobile viewport.

---

## 2. Domain Registration & Email Routing (`[人工]`)

- [x] **`quadletgen.com`** is live on Cloudflare. Zone `8abf0febaad1c30746ddce02a50a660f` status `active` (verified 2026-11-12). Nameservers point at this zone and the Worker custom domain is attached (see section 4).
- [x] Zone, DNS, and email routing were set up with the workflow in `_ops/research/indie-site-workflow-20261112/tools/cf-zone-bootstrap.mjs`. Zone is `active` and Email Routing is `ready` (2026-11-12).
- [x] **Cloudflare Email Routing** on `quadletgen.com` is `enabled: true`, `status: ready` (2026-11-12). Forwarding rules: `hello@quadletgen.com` and `privacy@quadletgen.com` -> `liqi199315@gmail.com`. `hello@` is the contact address on `/about/`, `/privacy/`, and `/terms/`.
- [x] MX, SPF, and DKIM records are locked. `_dmarc` TXT is published for `quadletgen.com` (verified 2026-11-12).
- [ ] Confirm trademark hygiene: `quadletgen.com` uses the independent brand **QuadletGen**, and the Red Hat / Podman / Docker non-affiliation disclaimer is live on `/about/`, `/terms/`, and the global footer.

---

## 3. GA4 Property & Shared Analytics Registry (`[人工]` + `[AI]`)

- [x] In Google Analytics 4, create a property and Web Data Stream for **`https://quadletgen.com`** and copy the public Measurement ID plus numeric Property ID. Done 2026-11-12: Property ID `564011383`, Stream ID `16325768198`, Measurement ID `G-PK7MR29S6E`, time zone `Asia/Shanghai`, currency `USD`, industry `TECHNOLOGY`. Event retention `FOURTEEN_MONTHS` with reset on new activity. Enhanced measurement site search and form interactions set to off. Key Event `quadlet_export` uses `ONCE_PER_EVENT`.
- [ ] In GA4 Admin -> Data Collection, keep **Google Signals disabled** and **Ads Personalization disabled** so production behavior matches `/privacy/`.
- [x] In GA4 Admin -> Events / Key Events, mark **`quadlet_export`** as a Key Event. Created 2026-11-12 as `properties/564011383/keyEvents/16325186130` with `ONCE_PER_EVENT` before the first production hit.
- [ ] Grant `Viewer` access on the GA4 property to `build-android@charged-sector-382503.iam.gserviceaccount.com` per `../../40_shared/ANALYTICS.md`.
- [x] Public IDs only (never secret keys) are registered as `composetoquadlet` in `/Users/dake/Projects/aiapp/40_shared/analytics-sites.yaml` (matching `--project composetoquadlet` in `package.json`). Verified 2026-11-12:
  ```yaml
  composetoquadlet:
    display_name: quadletgen.com
    repo: 30_products/compose-to-quadlet
    site_url: https://quadletgen.com
    ga4_property_id: "564011383"
    ga4_measurement_id: G-PK7MR29S6E
    gsc_site: "sc-domain:quadletgen.com"
    bing_site_url: https://quadletgen.com/
  ```

---

## 4. IndexNow Key Generation & Cloudflare Deployment (`[人工]`)

- [ ] Generate a fresh 32-character hexadecimal IndexNow key locally:
  ```bash
  openssl rand -hex 16
  ```
- [ ] Write that single key string into both `public/indexnow-key.txt` and `public/<key>.txt` (e.g. `public/c9d2e4f73a814b629d4c35e8f2a16c53.txt`, replacing any default development key) so `https://quadletgen.com/indexnow-key.txt` and `https://quadletgen.com/<key>.txt` serve the exact key over HTTPS for Bing/Yandex verification.
- [x] Build with production environment variables and deploy to Cloudflare Workers Static Assets. Done 2026-11-12 with `PUBLIC_SITE_URL=https://quadletgen.com` and `PUBLIC_GA4_MEASUREMENT_ID=G-PK7MR29S6E`. `launch-preflight` and `seo:check` both reported `ok: true` (`routesChecked: 9`). Deploy command was `npx wrangler deploy --domains quadletgen.com`.
  ```bash
  PUBLIC_SITE_URL=https://quadletgen.com \
  PUBLIC_GA4_MEASUREMENT_ID=G-PK7MR29S6E \
  npm run build
  npx wrangler deploy --domains quadletgen.com
  ```
- [x] Cloudflare Workers custom domain **`quadletgen.com`** is attached to Worker `compose-to-quadlet`. Version ID `5d9f6d3a-eb30-4899-b80c-e671203e5d13`. Workers.dev URL: `https://compose-to-quadlet.liqi199315.workers.dev`. `https://www.quadletgen.com/` returns `301` to `https://quadletgen.com/`.
- [ ] Smoke-test live production URLs:
  - `curl -I https://quadletgen.com/` (HTTP 200 + security headers from `_headers`)
  - `curl -I https://quadletgen.com/about/` (HTTP 200)
  - `curl -I https://quadletgen.com/privacy/` (HTTP 200)
  - `curl -I https://quadletgen.com/terms/` (HTTP 200)
  - `curl -fsSL https://quadletgen.com/indexnow-key.txt` (matches your 32-char hex key)
  - `curl -fsSL https://quadletgen.com/c9d2e4f73a814b629d4c35e8f2a16c53.txt` (matches dual key probe)
  - `curl -fsSL https://quadletgen.com/sitemap-index.xml` (lists `https://quadletgen.com/sitemap-0.xml`)

---

## 5. GSC, Bing Webmaster Tools & IndexNow Submission (`[人工]` + `[AI]`)

- [x] **Google Search Console** (2026-11-12):
  - Domain property `sc-domain:quadletgen.com` verified with Site Verification `DNS_TXT` (resource ID `dns://quadletgen.com`). Verified owners: `build-android@charged-sector-382503.iam.gserviceaccount.com` and `liqi199315@gmail.com`.
  - Search Console site registration PUT returned `204`; GET returned `200` with `permissionLevel=siteOwner`.
  - Sitemap `https://quadletgen.com/sitemap-index.xml` submitted: PUT `204`, GET `200`, `lastSubmitted=2026-11-12T07:54:30.598Z`, pending at submit time, warnings `0`, errors `0`.
- [x] **Bing Webmaster Tools** (2026-11-12):
  - `https://quadletgen.com/` verified. `IsVerified: true` via a Cloudflare unproxied `verify.bing.com` CNAME, under the account linked to `40_shared/bing-webmaster.key`.
  - Sitemap `https://quadletgen.com/sitemap-index.xml` submitted via `SubmitFeed`.
- [ ] **IndexNow Instant Submission (all 9 canonical routes)**:
  Run after `https://quadletgen.com/indexnow-key.txt` is live:
  ```bash
  INDEXNOW_KEY="$(tr -d '[:space:]' < public/indexnow-key.txt)"
  curl -i -X POST "https://api.indexnow.org/indexnow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{
      \"host\": \"quadletgen.com\",
      \"key\": \"${INDEXNOW_KEY}\",
      \"keyLocation\": \"https://quadletgen.com/indexnow-key.txt\",
      \"urlList\": [
        \"https://quadletgen.com/\",
        \"https://quadletgen.com/podman-quadlet-generator/\",
        \"https://quadletgen.com/docker-run-to-quadlet-converter/\",
        \"https://quadletgen.com/rootless-quadlet-selinux-volume-generator/\",
        \"https://quadletgen.com/immich-nextcloud-vaultwarden-quadlet-templates/\",
        \"https://quadletgen.com/podlet-online-multi-container-network-packager/\",
        \"https://quadletgen.com/about/\",
        \"https://quadletgen.com/privacy/\",
        \"https://quadletgen.com/terms/\"
      ]
    }"
  ```
  Confirm HTTP `200` or `202` response from `api.indexnow.org`.
  Done 2026-11-12 via `ping-indexnow.mjs --dist dist`: HTTP `202`, host `quadletgen.com`, keyLocation `https://quadletgen.com/indexnow-key.txt`, `submittedCount: 9`.
- [x] Shared reporting sanity checks from `/Users/dake/Projects/aiapp/30_products/compose-to-quadlet` all exited `0` on 2026-11-12: `ga4-report.mjs`, `gsc-report.mjs`, `bing-report.mjs`, and `analytics-registry.test.mjs`.
  ```bash
  npm run ga4:report
  npm run gsc:report
  npm run bing:report
  ```

---

## 6. Linux VPS Referral & Affiliate Onboarding (`[人工]` + `[AI]`)

Apply only **after** `https://quadletgen.com/`, `/about/`, `/privacy/`, and `/terms/` are publicly live over HTTPS so partner reviewers can verify technical quality and FTC disclosure pages.

### Partner enrollment steps (`[人工]`)

1. **Hetzner Cloud Policy Note (2026 Check)**:
   - Official Hetzner Cloud documentation confirms Hetzner discontinued its self-serve Cloud Referral link program (`?ref=` links are inactive). Keep all Hetzner deployment documentation strictly unmonetized for developer trust, and focus active affiliate onboarding on verified programs (DigitalOcean and Vultr).
2. **DigitalOcean Affiliate / Referral Program**:
   - Apply to the DigitalOcean Affiliate Program (via Impact) or copy your DigitalOcean Referral link (`https://m.do.co/c/<YOUR_CODE>`).
   - Submit `https://quadletgen.com` as the publisher property (highlighting Podman systemd deployment guides for Linux Droplets).
3. **Vultr Affiliate Program**:
   - Enroll at `https://www.vultr.com/company/affiliate-program/` (`https://www.vultr.com/?ref=<YOUR_REF_ID>`).
   - Point deep links to regular Cloud Compute Linux instances suitable for self-hosted Immich, Nextcloud, and Vaultwarden stacks.

### Compliance & wiring rules (`[AI]` once dake supplies approved public URLs)

- [ ] Never insert unapproved or placeholder affiliate codes into production links.
- [ ] Every commercial VPS link must render `rel="sponsored noopener"` and `target="_blank"`.
- [ ] Keep clear, plain-language disclosure copy immediately adjacent to the VPS recommendation block, consistent with Section 4 of `/terms/`.
- [ ] Record outbound clicks with sanitized event parameters only (provider slug and route path; zero user YAML or container fields).
- [ ] Re-run `PUBLIC_SITE_URL=https://quadletgen.com npm run verify:all` before redeploying.

---

## 7. Post-Launch Discipline

- [ ] Refresh workspace inventory from `/Users/dake/Projects/aiapp`:
  ```bash
  python3 /Users/dake/Projects/aiapp/_ops/generate-project-index.py
  ```
- [x] Launch evidence for domain, Worker, email routing, GA4, GSC, Bing Webmaster, sitemap, IndexNow, and `composetoquadlet` in `analytics-sites.yaml` is recorded in `NOW.md` (2026-11-12). `PLAN_90DAY.md` status lines were not edited in this pass. Remaining `[人工]` work is community launch posts from `LAUNCH_KIT.md` (Show HN, r/podman, X, Product Hunt) and VPS affiliate onboarding (DigitalOcean / Vultr). GitHub repo is private at `https://github.com/liqi199315/compose-to-quadlet`.
- [ ] Freeze `<title>` and `<meta name="description">` tags across all 9 routes for 28 days (`P0-5`) before running CTR experiments.
