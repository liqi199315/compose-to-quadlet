# QuadletGen (`quadletgen.com`)

[![Try it in browser (zero upload)](https://img.shields.io/badge/Try%20it%20in%20browser-zero%20upload-0ea5e9?style=flat-square)](https://quadletgen.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-334155?style=flat-square&logo=node.js)](https://nodejs.org)
[![Astro 5](https://img.shields.io/badge/Astro-5-ff5d01?style=flat-square&logo=astro)](https://astro.build)

> Convert Docker Compose YAML stacks and docker run CLI commands into declarative Podman 4.4+ systemd Quadlet unit files (`.container`, `.network`, `.volume`, `.env`) in browser RAM or directly from your terminal.

---

## GitHub Repository Metadata

When publishing or configuring the repository on GitHub, use these suggested settings:

- **About description:** Convert Docker Compose YAML and docker run commands into Podman 4.4+ Quadlet systemd units (.container, .network, .volume, .env) with zero server uploads.
- **Website:** https://quadletgen.com
- **Topics:** `podman`, `quadlet`, `docker-compose`, `systemd`, `containers`, `rootless-containers`, `selfhosted`, `devops`, `linux`, `astro`

---

## Core Guarantees

1. **100% browser-local execution.** All Compose YAML parsing, `docker run` flag tokenization, Quadlet unit synthesis, and ZIP bundle assembly run inside volatile browser RAM. Zero container definitions, images, credentials, or mount paths leave your machine.
2. **Automatic shared `.network` synthesis.** Multi-service stacks automatically generate a linked `<stack>.network` unit with proper network aliases so container DNS (`postgres:5432`, `redis:6379`) works out of the box without running into `podlet#190` isolation pitfalls.
3. **SELinux `:z` and `:Z` volume relabeling.** Toggle instantly between `none`, shared `:z`, and private `:Z` volume mount options to keep rootless SELinux permissions intact on Fedora, RHEL, and CentOS Stream.
4. **Standalone Node CLI included.** Convert configurations in automated CI/CD pipelines or shell scripts using the zero-dependency CLI `compose-to-quadlet`.
5. **Clean-room MIT license.** Original clean-room implementation without proprietary dependencies. Independent Linux systemd utility not affiliated with Red Hat, Inc., the Podman project, or Docker, Inc.

---

## Standalone CLI (`compose-to-quadlet`)

The project includes a standalone Node ESM CLI located at `bin/compose-to-quadlet.mjs`.

### Installation and Quick Run

Run directly with Node:

```bash
node ./bin/compose-to-quadlet.mjs --help
```

Or install locally within your project:

```bash
npm install
npm run build:cli
./bin/compose-to-quadlet.mjs --help
```

### CLI Options

| Flag | Description | Default |
|---|---|---|
| `-i, --input <file>` | Path to Docker Compose YAML file | None |
| `-r, --run "<cmd>"` | `docker run` or `podman run` CLI command string | None |
| `-s, --stack <name>` | Stack or unit name prefix | Basename of input file or `app` |
| `--scope <scope>` | Target install scope: `rootless` or `rootful` | `rootless` |
| `--selinux <mode>` | Volume SELinux relabeling: `none`, `shared-z`, `private-Z` | `none` |
| `-o, --out-dir <dir>` | Directory to write generated Quadlet files | None (prints to stdout) |
| `--zip <file.zip>` | Export generated units as a ZIP archive | None |
| `--stdout` | Print generated unit files to standard output | Active when `--out-dir` omitted |
| `--auto-update` | Add `AutoUpdate=registry` to container units | `false` |
| `--extract-secrets` | Separate password and token keys into a `.env` file | `false` |
| `--no-shared-network` | Disable automatic shared `.network` synthesis | `false` |
| `-h, --help` | Show usage help pointing to https://quadletgen.com | |
| `-v, --version` | Print CLI version | |

### CLI Examples

**Convert Compose YAML and write unit files to disk:**

```bash
node ./bin/compose-to-quadlet.mjs \
  --input compose.yaml \
  --stack webapp \
  --scope rootless \
  --selinux private-Z \
  --out-dir ~/.config/containers/systemd/
```

**Convert a `docker run` command with stdout preview:**

```bash
node ./bin/compose-to-quadlet.mjs \
  --run "docker run -d --name vaultwarden -p 8080:80 -v vw-data:/data vaultwarden/server:latest" \
  --selinux shared-z \
  --stdout
```

**Export a multi-service Compose stack into a ZIP bundle:**

```bash
node ./bin/compose-to-quadlet.mjs \
  --input docker-compose.yml \
  --stack production \
  --zip quadlet-bundle.zip
```

For the visual interactive workbench with live side-by-side editing, visit **https://quadletgen.com**.

---

## Hosted Web Workbench (9 Routes)

QuadletGen publishes 9 indexed static routes with full E-E-A-T and JSON-LD metadata:

| Route | Purpose |
|---|---|
| `/` | Main Docker Compose to Podman Quadlet converter workbench |
| `/podman-quadlet-generator/` | Podman Quadlet generator with `AutoUpdate=registry` presets |
| `/docker-run-to-quadlet-converter/` | Docker Run and Podman Run command to Quadlet converter |
| `/rootless-quadlet-selinux-volume-generator/` | Rootless Quadlet builder with SELinux volume relabeling |
| `/immich-nextcloud-vaultwarden-quadlet-templates/` | Pre-configured Quadlet stacks for Immich, Nextcloud, and Vaultwarden |
| `/podlet-online-multi-container-network-packager/` | Multi-container network synthesizer and ZIP packager |
| `/about/` | Engineering methodology, Podman 4.4+/5.x specs, and `hello@quadletgen.com` |
| `/privacy/` | Zero-upload privacy guarantee and data handling policy |
| `/terms/` | MIT license terms, staging verification duties, and affiliate disclosures |

---

## Local Verification

Run all checks from this directory:

```bash
# Run Vitest unit tests (engine and standalone CLI)
npm test

# Build CLI binary and static Astro distribution
npm run build

# Run automated SEO and copy hygiene pre-flight audit
npm run seo:check

# Run Playwright E2E browser tests (including zero external network checks)
npm run test:e2e

# Run the complete test suite in sequence
npm run verify:all
```

---

## Hosting and VPS Deployment Notes

When deploying Podman Quadlet containers on cloud virtual servers:
- Prefer Linux distributions with native Podman 4.4+ or 5.x packages (Fedora, RHEL 9+, Rocky Linux, Debian 12+, Ubuntu 24.04 LTS).
- For rootless containers, enable systemd user lingering via `loginctl enable-linger <username>` so containers boot before interactive login.
- Commercial cloud provider recommendations: Note that Hetzner discontinued its self-service Cloud referral program, so any referral links in project documentation focus strictly on verified programs such as DigitalOcean and Vultr with explicit `rel="sponsored noopener"` disclosures.

---

## License

MIT License. See [LICENSE](./LICENSE) or `/terms/` for details.
