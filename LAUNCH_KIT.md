# QuadletGen Launch Kit

Copy-paste launch playbooks, social templates, community search queries, and editorial submission assets for **QuadletGen** (`https://quadletgen.com`).

All copy adheres strictly to clean text hygiene rules: zero long dashes, zero banned buzzwords, and zero double curly brace tokens.

---

## 1. X (Twitter) Launch Sequence

### Native 25-Second Demo Video Shot List

Record a silent screen capture (1920x1080 or 1280x720, dark theme) showing real, unedited browser interaction:

- **00:00 to 00:04 (4s):** Open `https://quadletgen.com`. Select the "Nextcloud + MariaDB" or "Web + Postgres + Redis" sample preset from the dropdown. Show instant YAML populating the editor.
- **00:04 to 00:10 (6s):** Toggle the SELinux volume relabeling switch from "None" to "Private :Z". Highlight the volume line changing dynamically in the preview pane from `./data:/var/www/html` to `./data:/var/www/html:Z`.
- **00:10 to 00:16 (6s):** Point cursor to the generated `nextcloud.network` tab. Show how netavark DNS aliases resolve the multi-container communication gap without manual bridge scripting.
- **00:16 to 00:21 (5s):** Click the "Download All as ZIP" button. Show the browser immediately saving `nextcloud-quadlet.zip` with zero network lag.
- **00:21 to 00:25 (4s):** Open terminal window and run `unzip nextcloud-quadlet.zip -d ~/.config/containers/systemd/ && systemctl --user daemon-reload`. Unit files are active.

### Main Post Text (No External Link)

Post this text alongside the uploaded native 25-second MP4 video. Do not include external links in the initial post to preserve algorithmic reach:

```text
Migrating Docker Compose stacks to rootless Podman systemd Quadlet units usually means wrestling with three headaches:

1. Podlet issue 190: multi-container DNS breaks unless you handcraft a shared .network file.
2. SELinux permission denials on volume mounts unless you add :z or :Z flags.
3. Managing systemd unit templates by hand across multiple files.

Built a client-side tool that compiles compose.yaml or docker run commands directly into .container, .network, .volume, and .env files inside your browser RAM.

Zero server uploads. Zero CLI installs needed.

See demo below. Link in reply.
```

### Reply #1 Text (Immediate Link Drop)

Post this reply within 30 seconds of publishing the main post:

```text
Live web app (free, zero login, 100% client-side):
https://quadletgen.com

Standalone Node CLI for CI/CD pipelines and shell scripts:
https://github.com/dake/compose-to-quadlet

Clean-room MIT license. Pull requests and feedback welcome!
```

---

## 2. X Pain-Search Queries & Value-First Reply Templates

Use these boolean search queries on X / Twitter search tab to find developers struggling with Quadlet migrations. Respond with direct technical advice first; mention QuadletGen only as a helpful option.

### Query 1: Podman Quadlet Compose Migration Pain
`("docker compose" OR "docker-compose") ("quadlet" OR "podman-system-generator") (error OR fail OR syntax OR systemd)`

**Value-First Reply Template 1:**
```text
If your containers cannot resolve each other by service name, Quadlet does not automatically create a shared bridge like Compose does. You need a dedicated <stack>.network unit file placed in ~/.config/containers/systemd/, then reference Network=<stack>.network inside each [Container] block. That configures netavark and aardvark-dns properly.

If you want to check the syntax before editing unit files, you can paste your Compose file into https://quadletgen.com to see the generated .network and .container files side by side.
```

### Query 2: SELinux Rootless Volume Denials
`(podman OR quadlet) ("permission denied" OR "SELinux") (volume OR ":Z" OR ":z")`

**Value-First Reply Template 2:**
```text
Rootless Podman runs within a user namespace, so container processes cannot access host directories without relabeling under SELinux. In your Quadlet unit, append :Z (for private container storage) or :z (for shared storage) to the Volume= directive:

Volume=/host/path:/container/path:Z

Also ensure the host path is owned by your unprivileged UID before running daemon-reload. You can test different SELinux volume modes directly on https://quadletgen.com to verify unit syntax.
```

### Query 3: Quadlet Systemd Enable Confusion
`(podman OR quadlet) ("systemctl enable" OR "Failed to enable unit")`

**Value-First Reply Template 3:**
```text
Quadlet units are transient generator targets created at daemon-reload time by podman-system-generator, so systemctl enable cannot find an on-disk unit file. Instead of running systemctl enable, add this to your .container file:

[Install]
WantedBy=default.target

Then run systemctl --user daemon-reload and systemctl --user start <service>. It will start automatically at boot as long as linger is enabled (loginctl enable-linger <user>).
```

---

## 3. Hacker News `Show HN` Submission Guide

> **Operator Reminder for dake:**
> Per Hacker News guidelines, submitters must post in their own voice. Do not copy marketing copy onto HN.
> Use clean URLs without any UTM parameters or tracking tags.
> Be available in the comments for at least 3 hours after posting to answer technical systemd questions.

### Recommended Title Options

- `Show HN: QuadletGen - Convert Docker Compose to Podman Quadlet in browser RAM`
- `Show HN: Docker Compose to Podman Quadlet Converter (Client-Side, MIT)`
- `Show HN: A browser-local Docker Compose to Podman 4.4+ Quadlet generator`

### Canonical URL to Submit

`https://quadletgen.com/`

### Factual Notes for dake's Opening Comment

When creating the initial top-level comment on your Show HN submission, include these factual details in your own words:

1. **Why it was built:** Podman Quadlet (`podman-system-generator`) is the cleanest way to manage production rootless containers under systemd, but transitioning existing Compose YAML stacks requires writing multiple unit files and manually configuring shared bridge networks.
2. **Key engineering differences:**
   - 100% client-side execution using JavaScript. Zero server requests, no telemetry on container configs.
   - Solves the multi-container DNS problem (`containers/podlet#190`) by automatically synthesizing a `<stack>.network` unit file and linking services to it with network aliases.
   - Handles volume relabeling for SELinux (`:z` and `:Z`) with a single toggle.
   - Separates sensitive environment variables into `.env` files with `EnvironmentFile=` directives.
   - Bundles everything into an instant PKZIP archive for one-step extraction to `~/.config/containers/systemd/`.
3. **Open source status:** Clean-room implementation under the MIT license, with both a web UI and a standalone Node CLI for terminal usage.

---

## 4. Reddit Community Post Templates

### `r/podman`

**Title:** `QuadletGen: A client-side tool to convert Docker Compose stacks into Podman Quadlet units with automatic shared networks`

**Post Body:**
```text
Hey r/podman,

One of the friction points when moving projects from Docker Compose to Podman Quadlet is managing multi-service stacks where containers need to talk to each other over DNS. Upstream podlet is great for single containers, but multi-container stacks often stumble on issue 190 where containers cannot resolve peer hostnames because no shared network unit exists.

I built QuadletGen (https://quadletgen.com) to make Compose to Quadlet migration effortless:

- 100% browser-local: YAML parsing and unit synthesis run entirely in client JavaScript. No container specs or credentials leave your machine.
- Automatic shared .network generation: Stacks with multiple services automatically synthesize a <stack>.network unit with netavark aliases so peer DNS (like web -> postgres) works out of the box.
- SELinux volume toggle: Switch between None, shared :z, and private :Z volume flags with live syntax preview.
- Secret separation: Sensitive variables can be extracted into an accompanying .env file with EnvironmentFile= directives.
- One-click ZIP download: Download all units ready to unpack into ~/.config/containers/systemd/.
- Standalone CLI included: Also bundled as an open-source Node ESM CLI for terminal workflows and CI/CD.

Project is MIT licensed and independent. Check it out at https://quadletgen.com or inspect the code at https://github.com/dake/compose-to-quadlet.

Feedback and suggestions on edge cases are very welcome!
```

### `r/selfhosted`

**Title:** `Built a free, zero-upload tool to convert Docker Compose setups into rootless Podman Quadlet systemd units`

**Post Body:**
```text
Hi r/selfhosted,

If you run your self-hosted apps on Fedora, RHEL, Rocky, or Debian, running rootless Podman via systemd Quadlets gives you native OS process supervision, automatic restarts, and better security isolation than a root Docker daemon.

The main downside has always been translating existing docker-compose.yml files into individual .container and .network systemd units.

I made QuadletGen to automate this translation:
https://quadletgen.com

Highlights for self-hosters:
- Pre-built templates for Immich, Nextcloud, Vaultwarden, and Redis/Postgres stacks.
- Resolves container-to-container DNS by generating shared .network bridge units.
- Supports SELinux :Z volume relabeling to avoid rootless file permission issues.
- Zero upload guarantee: All parsing happens in your browser RAM. Your database passwords and volume paths never hit an external server.
- Instant ZIP bundle export ready to extract into ~/.config/containers/systemd/.

Free and open-source under the MIT license. Hope this saves someone hours of systemd troubleshooting!
```

### `r/linuxadmin`

**Title:** `QuadletGen: Declarative Podman systemd unit generator from Docker Compose and docker run commands`

**Post Body:**
```text
Colleagues in sysadmin work,

For systems running Podman 4.4 and newer, podman-system-generator is the standard mechanism for managing containerized workloads under systemd. However, translating developer-provided Compose stacks or ad-hoc docker run snippets into properly structured .container, .network, and .volume units is a frequent manual chore.

QuadletGen (https://quadletgen.com) provides a clean-room conversion engine available as both a web workbench and a standalone CLI:

- Compiles Compose YAML services into rootless (~/.config/containers/systemd/) or rootful (/etc/containers/systemd/) unit files.
- Generates systemd [Unit] After= and Requires= ordering constraints from depends_on conditions.
- Emits dedicated .network units with Netavark DNS alias bindings for inter-container communication.
- Supports automated SELinux volume relabeling (shared :z or private :Z).
- Pure client-side JavaScript architecture with zero server transmission.
- Includes a Node CLI (compose-to-quadlet) for scripted sysadmin automation.

Full source code and spec alignment documentation available on the site.
```

---

## 5. Console.dev Editorial Submission Draft

Send to `hello@console.dev` with a concise, technical pitch:

**Subject:** `Tool submission: QuadletGen - Browser-local Docker Compose to Podman Quadlet converter`

**Body:**
```text
Hi Console team,

I would like to submit QuadletGen for editorial consideration in Console.dev:

Tool name: QuadletGen
URL: https://quadletgen.com
GitHub: https://github.com/dake/compose-to-quadlet
License: MIT

What it does:
QuadletGen is a developer utility that compiles Docker Compose YAML files and docker run CLI commands into declarative Podman 4.4+ systemd Quadlet unit files (.container, .network, .volume, .env).

Why developers care:
Podman Quadlet is rapidly becoming the standard for running rootless containers on Linux without an orchestrator, but converting Compose stacks requires writing multiple systemd unit files and manually configuring shared bridge networks for inter-container DNS.

Key highlights:
- 100% client-side execution in browser memory with zero server uploads.
- Automatically synthesizes shared .network units to fix inter-container DNS pitfalls (upstream containers/podlet issue 190).
- One-click SELinux volume relabeling (:z and :Z) for rootless deployments.
- Includes both an interactive web workbench with ZIP export and a standalone Node ESM CLI.

Thanks for curating such a high-signal developer newsletter.

Best regards,
dake
hello@quadletgen.com
```

---

## 6. Polite Technical Workaround for Upstream Issues (e.g., `containers/podlet#190`)

When contributing to community discussions or issue threads regarding multi-container Quadlet networking and DNS resolution:

```text
For anyone running into this issue while migrating multi-container Compose stacks to Quadlet:

The root cause is that Podman Quadlet does not automatically create an implicit default bridge with DNS enabled between container units unless a dedicated network unit is explicitly declared.

To work around this in standard Podman 4.4+:

1. Create a network unit file (e.g. `app.network`):
   ```ini
   [Network]
   NetworkName=app
   ```

2. In each of your `.container` files, attach to that network and declare your DNS alias:
   ```ini
   [Container]
   Network=app.network
   ```

3. Place both files in `~/.config/containers/systemd/` and reload systemd:
   ```bash
   systemctl --user daemon-reload
   ```

If you have a complex Compose file with multiple services and want an automated translation that generates both the `.network` unit and linked `.container` files with SELinux `:Z` options, you can use the browser-based generator at https://quadletgen.com (100% client-side, MIT licensed).
```
