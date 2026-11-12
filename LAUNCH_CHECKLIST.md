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
- [ ] `npm run build` outputs all 9 route HTML files plus `404.html`, `sitemap-index.xml`, `robots.txt`, `llms.txt`, `_headers`, `og-image.svg`, `og-image.png`, `github-social-preview.png`, `site.webmanifest`, `indexnow-key.txt`, and `c9d2e4f73a814b629d4c35e8f2a16c53.txt` into `dist/`.
- [ ] `npm run seo:check` (`scripts/seo-preflight.mjs`) reports `ok: true`, `routesChecked: 9`, valid `og:image` ending in `/og-image.png` with PNG magic bytes (>5 KB), dual IndexNow key file, `X-Robots-Tag: noindex` in `_headers`, `Organization` + `BreadcrumbList` on all 9 routes, `WebApplication` + `FAQPage` on all 6 converter routes, resolved internal links, and zero placeholders or long-dashes.
- [ ] `npm run test:e2e` passes all 6 Playwright Chromium journeys, including `window.dataLayer` (`config` + `quadlet_export`) with `0` external requests on `127.0.0.1` and `scrollWidth <= 375` on `375x812` mobile viewport.

---

## 2. Domain Registration & Email Routing (`[人工]`)

- [ ] Register **`quadletgen.com`** on Cloudflare Registrar (at-cost renewal) or Porkbun and point nameservers to your Cloudflare zone.
- [ ] For automated Cloudflare zone setup, DNS record creation, and email routing rules, refer to `_ops/research/indie-site-workflow-20261112/tools/cf-zone-bootstrap.mjs`.
- [ ] Enable **Cloudflare Email Routing** on `quadletgen.com` and create forwarding rule `hello@quadletgen.com` -> your primary operator inbox (referenced on `/about/`, `/privacy/`, and `/terms/`).
- [ ] Verify Cloudflare automatically publishes `MX`, `SPF`, and `DMARC` DNS TXT records for `quadletgen.com`.
- [ ] Confirm trademark hygiene: `quadletgen.com` uses the independent brand **QuadletGen**, and the Red Hat / Podman / Docker non-affiliation disclaimer is live on `/about/`, `/terms/`, and the global footer.

---

## 3. GA4 Property & Shared Analytics Registry (`[人工]` + `[AI]`)

- [ ] In Google Analytics 4, create a property and Web Data Stream for **`https://quadletgen.com`** and copy the public Measurement ID (`G-XXXXXXXXXX`) plus numeric Property ID.
- [ ] In GA4 Admin -> Data Collection, keep **Google Signals disabled** and **Ads Personalization disabled** so production behavior matches `/privacy/`.
- [ ] In GA4 Admin -> Events / Key Events, mark **`quadlet_export`** as a Key Event once first production events arrive.
- [ ] Grant `Viewer` access on the GA4 property to `build-android@charged-sector-382503.iam.gserviceaccount.com` per `../../40_shared/ANALYTICS.md`.
- [ ] Add public IDs only (never secret keys) under `sites.composetoquadlet` in `/Users/dake/Projects/aiapp/40_shared/analytics-sites.yaml` (matching `--project composetoquadlet` in `package.json`):
  ```yaml
  composetoquadlet:
    display_name: quadletgen.com
    repo: 30_products/compose-to-quadlet
    site_url: https://quadletgen.com
    ga4_property_id: "<NUMERIC_PROPERTY_ID>"
    ga4_measurement_id: "<G-MEASUREMENT_ID>"
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
- [ ] Build with production environment variables and deploy to Cloudflare Workers Static Assets:
  ```bash
  PUBLIC_SITE_URL=https://quadletgen.com \
  PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX \
  npm run cf:deploy
  ```
- [ ] In Cloudflare Dashboard -> Workers & Pages -> `compose-to-quadlet` -> Settings -> Domains & Routes:
  - Attach custom domain **`quadletgen.com`**.
  - Configure a `301` redirect rule from `https://www.quadletgen.com/*` to `https://quadletgen.com/$1`.
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

- [ ] **Google Search Console**:
  - Add domain property `sc-domain:quadletgen.com` and verify via Cloudflare DNS TXT record.
  - Grant `Full` (`siteFullUser`) permission to `build-android@charged-sector-382503.iam.gserviceaccount.com`.
  - Submit `https://quadletgen.com/sitemap-index.xml`.
- [ ] **Bing Webmaster Tools**:
  - Import `https://quadletgen.com/` directly from GSC (or verify via DNS CNAME/TXT) under the account linked to `40_shared/bing-webmaster.key`.
  - Submit `https://quadletgen.com/sitemap-index.xml`.
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
- [ ] Run shared reporting sanity checks from `/Users/dake/Projects/aiapp/30_products/compose-to-quadlet`:
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
- [ ] Update `PLAN_90DAY.md` tasks `P0-2` and `P0-3` to `已完成（YYYY-MM-DD）` and append launch evidence to `NOW.md`.
- [ ] Freeze `<title>` and `<meta name="description">` tags across all 9 routes for 28 days (`P0-5`) before running CTR experiments.
