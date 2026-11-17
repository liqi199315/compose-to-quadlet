import type { QuadletRoutePreset } from './types';
import { LONGTAIL_PRESETS } from './longtail-presets';

export const ROUTE_PRESETS: QuadletRoutePreset[] = [
	{
		slug: '',
		path: '/',
		navLabel: 'Compose to Quadlet',
		h1: 'Docker Compose to Podman Quadlet Converter',
		seoTitle: 'Docker Compose to Quadlet Converter | QuadletGen systemd',
		metaDescription:
			'Free browser-local Docker Compose to Quadlet converter. Compile compose.yaml into Podman systemd .container, .network, .volume, and .env ZIP units.',
		primaryKeyword: 'docker compose to quadlet converter',
		heroSummary:
			'Convert multi-service compose.yaml files or container CLI commands into native Podman 4.4+ Quadlet systemd unit files inside your browser. Inspect every generated .container, .network, .volume, and .env file before downloading a deployment archive.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'web-postgres-redis',
		defaultOptions: {
			stackName: 'webapp',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: false,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: false,
		},
		technicalNotes: [
			'Podman 4.4 and newer include podman-system-generator, which compiles declarative .container, .network, and .volume files into transient systemd services during daemon-reload.',
			'Compose depends_on entries translate to systemd [Unit] After= and Requires= directives. condition: service_healthy also writes Notify=healthy on the dependency when that service has a healthcheck, which requires Podman 5.0 or newer.',
			'Rootless units live in ~/.config/containers/systemd/ and run under your unprivileged user session via systemctl --user without a root daemon.',
			'Named volumes from top-level Compose volumes blocks become dedicated .volume Quadlet files referenced by unit name in Volume= directives.',
		],
		showGeneratedExample: true,
		exampleLayout: 'split',
		guideSections: [
			{
				id: 'compose-to-systemd-paradigm',
				eyebrow: 'Architectural Shift',
				heading: 'From Docker Daemon to Native systemd Supervision',
				paragraphs: [
					'Docker Compose relies on a centralized background daemon (dockerd) to manage container lifecycles, monitor health status, and handle restarts. When the Docker daemon restarts or crashes, every container attached to it undergoes service interruption or requires complex live-restore configurations.',
					'Podman Quadlet replaces this monolithic engine approach by compiling declarative unit definitions directly into native Linux systemd services. Instead of delegating process supervision to a container engine, systemd itself (either system-wide PID 1 or an unprivileged user manager instance via systemctl --user) treats each container as a first-class Linux service.',
					'This paradigm shift integrates container workloads into standard Linux operations. Containers benefit from journalctl structured logging, systemctl dependency resolution, cgroup v2 resource limits, and systemd watchdog monitoring without any daemon overhead.',
				],
				bullets: [
					'Eliminates the single point of failure represented by a long-running root daemon.',
					'Enables true rootless container execution where unprivileged users run containers without sudo access.',
					'Integrates natively with Linux security policies including SELinux, AppArmor, and seccomp profiles.',
					'Leverages native systemd unit dependency graphs for clean multi-service startup and shutdown sequencing.',
				],
			},
			{
				id: 'multi-container-dns-network',
				eyebrow: 'Networking Engine',
				heading: 'Solving Multi-Container DNS with Shared .network Units',
				paragraphs: [
					'A frequent pain point when migrating multi-service Docker Compose stacks to Podman Quadlet involves service discovery. In Docker Compose, services on the default network automatically resolve peer containers by their service names, such as postgres:5432 or redis:6379, through an embedded DNS server in dockerd.',
					'When converting Compose definitions to isolated Quadlet .container files without a shared network, rootless Podman places each container inside an isolated pasta or slirp4netns network namespace. In this isolated mode, containers cannot resolve each other by name, leading to connection refused or host not found errors.',
					'QuadletGen resolves this issue (documented in upstream containers/podlet issue 190) by synthesizing a dedicated <stack>.network unit. All participating .container units connect to this shared bridge network with Network=<stack>.network and NetworkAlias= directives. Podman configures netavark and aardvark-dns on the bridge, providing automatic local DNS resolution matching Compose behavior.',
				],
				codes: [
					{
						title: 'Generated <stack>.network unit file',
						code: `[Network]
NetworkName=webapp-network
Subnet=10.89.0.0/24
Gateway=10.89.0.1
IPAMDriver=host-local`,
					},
					{
						title: 'Container network attachment with DNS aliases',
						code: `[Container]
Image=docker.io/library/postgres:16-alpine
Network=webapp.network
NetworkAlias=postgres
NetworkAlias=db`,
					},
				],
			},
			{
				id: 'depends-on-startup-ordering',
				eyebrow: 'Lifecycle Contract',
				heading: 'How depends_on and Healthchecks Map to systemd Directives',
				paragraphs: [
					'Docker Compose offers depends_on to order service startup. In systemd, this dependency is expressed through [Unit] After= and Requires= (or Wants= when required: false). However, operators must understand that After= and Requires= order startup only: systemd considers the dependency active as soon as conmon creates the container process, which happens before internal engines like PostgreSQL or MySQL are ready to accept connections.',
					'To await genuine service readiness, Compose supports condition: service_healthy. QuadletGen maps this condition by adding Notify=healthy under the [Container] section of the dependency unit, provided that dependency declares a usable healthcheck.test command (supported in Podman 5.0 and newer).',
					'If a dependency lacks a healthcheck, or if a service declares condition: service_completed_successfully, QuadletGen warns that systemd cannot verify readiness or one-shot exit without manual Type=oneshot and RemainAfterExit=yes customization.',
				],
				bullets: [
					'service_started maps to [Unit] After= and Requires=, establishing process startup order without readiness guarantees.',
					'service_healthy maps to Notify=healthy on the target unit only when that target defines a valid HealthCmd.',
					'service_completed_successfully has no Quadlet equivalent; one-shot initialization units require manual configuration.',
					'Mixed dependencies where one caller requests service_started and another requests service_healthy will cause systemd to delay both callers until the healthcheck passes.',
				],
			},
		],
		faqs: [
			{
				question: 'Where do generated Podman Quadlet files go on Linux?',
				answer:
					'Place rootless unit files in ~/.config/containers/systemd/ and run systemctl --user daemon-reload. Place rootful system-wide units in /etc/containers/systemd/ and run sudo systemctl daemon-reload.',
			},
			{
				question: 'Why does systemctl enable fail on a Quadlet .container service?',
				answer:
					'Quadlet services are generated dynamically by podman-system-generator on each daemon-reload, which marks them as transient generated units. Instead of running systemctl enable, include an [Install] section with WantedBy=default.target so systemd starts the container automatically at boot or login.',
			},
			{
				question: 'Does QuadletGen upload my Compose YAML or environment secrets?',
				answer:
					'No. Parsing, unit file synthesis, secret separation, and ZIP archive assembly run entirely in browser JavaScript with zero server requests.',
			},
			{
				question: 'How do containers in the same Compose stack resolve each other by hostname?',
				answer:
					'Enable the shared network option to generate a dedicated <stack>.network file and attach each .container unit to it. Podman configures netavark and aardvark-dns on that bridge so services resolve peer container names.',
			},
		],
	},
	{
		slug: 'podman-quadlet-generator',
		path: '/podman-quadlet-generator/',
		navLabel: 'Quadlet Generator',
		h1: 'Podman Quadlet Generator for Declarative systemd Services',
		seoTitle: 'Podman Quadlet Generator for systemd Units | QuadletGen',
		metaDescription:
			'Interactive Podman Quadlet generator for declarative systemd services. Configure AutoUpdate=registry, health checks, rootless paths, and .env files.',
		primaryKeyword: 'podman quadlet generator',
		heroSummary:
			'Generate production-ready Podman Quadlet .container units with AutoUpdate=registry labels, systemd restart rules, and rootless or rootful install paths. Start from the Vaultwarden and Caddy preset or paste your own stack.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'vaultwarden-caddy',
		defaultOptions: {
			stackName: 'vaultwarden',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: true,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: true,
		},
		technicalNotes: [
			'Enabling AutoUpdate=registry adds io.containers.autoupdate=registry to generated units so podman-auto-update.timer pulls newer digests and restarts changed services.',
			'AutoUpdate requires fully qualified registry image names such as docker.io/library/caddy:2-alpine or ghcr.io/dani-garcia/vaultwarden:latest rather than short aliases.',
			'Compose restart policies such as unless-stopped and always map to [Service] Restart=always or Restart=on-failure under systemd supervision.',
			'You can validate generated syntax on any Linux host before reloading systemd by running /usr/libexec/podman/quadlet --dryrun --user.',
		],
		showGeneratedExample: true,
		exampleLayout: 'split',
		guideSections: [
			{
				id: 'autoupdate-timer-workflow',
				eyebrow: 'Automated Lifecycle',
				heading: 'Configuring AutoUpdate Registry with systemd Timers',
				paragraphs: [
					'The Podman Quadlet AutoUpdate directive connects container lifecycle management to Linux systemd timer automation. When AutoUpdate=registry is present in a [Container] section, Podman adds the container label io.containers.autoupdate=registry during service instantiation.',
					'Linux distributions shipping Podman provide a system-level or user-level timer named podman-auto-update.timer. When enabled, this timer triggers podman auto-update on a daily schedule, checking upstream registries for newer image digests matching the declared tag.',
					'If a newer digest exists, Podman pulls the image layer updates, triggers a graceful systemctl restart of the container service, and rolls back if healthchecks fail. Fully qualified registry paths (for example docker.io/library/caddy:2-alpine or ghcr.io/dani-garcia/vaultwarden:latest) are strictly required for reliable resolution.',
				],
				codes: [
					{
						title: 'Enabling user-mode auto-update timer',
						code: `systemctl --user enable --now podman-auto-update.timer
systemctl --user list-timers podman-auto-update.timer`,
					},
					{
						title: 'Testing image update checks manually',
						code: `podman auto-update --dry-run`,
					},
				],
			},
			{
				id: 'rootless-vs-rootful-scopes',
				eyebrow: 'Deployment Scope',
				heading: 'Rootless vs Rootful Installation Paths and Boot Behavior',
				paragraphs: [
					'Quadlet supports two primary installation scopes on Linux: rootless user-level execution and rootful system-level execution. Rootless unit files live inside ~/.config/containers/systemd/ and are managed via systemctl --user commands without requiring root privileges.',
					'Rootful unit files live inside /etc/containers/systemd/ and run directly under the system-wide systemd PID 1 manager via sudo systemctl commands. While rootful units can bind privileged ports (like 80 and 443) directly, rootless units isolate container processes within unprivileged user namespaces.',
					'To ensure rootless services start automatically at host boot without waiting for an interactive SSH session, administrators must enable user lingering with loginctl enable-linger $USER and declare WantedBy=default.target in unit Install sections.',
				],
				bullets: [
					'Rootless path: ~/.config/containers/systemd/ (systemctl --user daemon-reload).',
					'Rootful path: /etc/containers/systemd/ (sudo systemctl daemon-reload).',
					'Boot persistence: loginctl enable-linger $USER keeps user systemd running across reboots.',
					'Low port binding: rootless units can bind port 80/443 after setting net.ipv4.ip_unprivileged_port_start=80.',
				],
			},
			{
				id: 'preflight-dryrun-verification',
				eyebrow: 'Validation Tooling',
				heading: 'Dry-Run Verification Before Reloading systemd',
				paragraphs: [
					'Before running daemon-reload on a live server, administrators can preview the compiled service output using Podman internal generator binary in dry-run mode.',
					'Executing /usr/libexec/podman/quadlet -dryrun -user parses every unit file in ~/.config/containers/systemd/ and prints the exact compiled ExecStart podman run command to terminal standard output without modifying system state.',
					'This preflight step immediately highlights syntax errors, invalid directive names, missing volume directories, or conflicting network settings before systemd encounters them.',
				],
			},
		],
		faqs: [
			{
				question: 'How do I activate automatic image updates with generated Quadlet units?',
				answer:
					'Keep AutoUpdate=registry enabled in the generator, verify every Image= line uses a fully qualified registry domain, and enable the timer with systemctl --user enable --now podman-auto-update.timer.',
			},
			{
				question: 'How can I preview the compiled systemd service output before starting containers?',
				answer:
					'Copy the generated files into ~/.config/containers/systemd/ and run /usr/libexec/podman/quadlet -dryrun -user in your terminal to inspect the exact ExecStart podman run invocation and catch syntax issues.',
			},
			{
				question: 'Can rootless Podman bind Caddy to ports 80 and 443?',
				answer:
					'Rootless users cannot bind ports below 1024 by default on Linux. Either publish higher host ports such as 8080:80 and 8443:443, route traffic with firewalld, or lower net.ipv4.ip_unprivileged_port_start=80 via sysctl.',
			},
			{
				question: 'What replaces podman generate systemd in modern Podman releases?',
				answer:
					'Upstream Podman deprecated podman generate systemd in favor of Quadlet declarative unit files because Quadlet adapts container lifecycle flags across Podman upgrades without regenerating static shell wrappers.',
			},
		],
	},
	{
		slug: 'docker-run-to-quadlet-converter',
		path: '/docker-run-to-quadlet-converter/',
		navLabel: 'Docker Run to Quadlet',
		h1: 'Docker Run and Podman Run to Quadlet Converter',
		seoTitle: 'Docker Run & Podman Run to Quadlet Converter | QuadletGen',
		metaDescription:
			'Paste any docker run or podman run command into this Podman run to Quadlet converter to generate clean .container systemd units with ports and mounts.',
		primaryKeyword: 'podman run to quadlet converter',
		heroSummary:
			'Translate single-line or backslash-wrapped docker run and podman run commands into maintainable Quadlet .container unit files. CLI flags for published ports, bind mounts, environment variables, hardware devices, and Linux capabilities map directly to documented unit keys.',
		defaultInputMode: 'docker-run',
		defaultTemplateId: 'docker-run-jellyfin',
		defaultOptions: {
			stackName: 'jellyfin',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: true,
			generateSharedNetwork: false,
			extractSecretsToEnvFile: false,
		},
		technicalNotes: [
			'Multi-line shell snippets using trailing backslashes are joined and tokenized in the browser before flag extraction.',
			'Repeated -p, -v, -e, --device, --cap-add, and --cap-drop flags emit individual PublishPort=, Volume=, Environment=, AddDevice=, AddCapability=, and DropCapability= lines.',
			'Container names supplied via --name determine both ContainerName= and the output .container filename.',
			'Hardware acceleration flags such as --device /dev/dri/renderD128:/dev/dri/renderD128 convert directly to AddDevice= for Jellyfin, Plex, or Frigate workloads.',
		],
		showGeneratedExample: true,
		exampleLayout: 'split',
		guideSections: [
			{
				id: 'cli-tokenization-rules',
				eyebrow: 'CLI Translation',
				heading: 'Translating Complex Shell Snippets into Declarative Units',
				paragraphs: [
					'Running containers using long docker run or podman run commands often leads to unwieldy shell scripts with backslash line continuations, fragile quote escaping, and unmanaged background processes.',
					'QuadletGen tokenizer normalizes multiline CLI snippets in the browser, parsing quotes and equals-sign syntax into structured directives. Repeated flags such as -p 80:80 -p 443:443 cleanly translate into multiple PublishPort= lines, and bind mount options like :ro or :Z are preserved in Volume= keys.',
					'The container name supplied with --name determines both the systemd service name and the ContainerName= directive, establishing a predictable naming convention across your server.',
				],
				codes: [
					{
						title: 'Original docker run command',
						code: `docker run -d \\
  --name media-server \\
  -p 8096:8096 \\
  -v /srv/media:/media:ro \\
  --device /dev/dri \\
  jellyfin/jellyfin:latest`,
					},
					{
						title: 'Compiled Quadlet .container unit',
						code: `[Container]
Image=docker.io/jellyfin/jellyfin:latest
ContainerName=media-server
PublishPort=8096:8096
Volume=/srv/media:/media:ro
AddDevice=/dev/dri`,
					},
				],
			},
			{
				id: 'redundant-daemon-flags',
				eyebrow: 'Flag Translation',
				heading: 'Why -d, --rm, and --restart Are Stripped from Quadlet Units',
				paragraphs: [
					'In imperative container workflows, flags like -d (detach) and --rm (cleanup on stop) tell the CLI client how to handle terminal attachment and container removal after process exit.',
					'Under systemd supervision, container lifecycles are monitored directly by systemd and conmon. Running in the background is the native state of a system service, and post-stop container cleanup is governed by systemd service lifecycle hooks.',
					'For this reason, Quadlet does not support -d or --rm flags and strips them automatically. The CLI restart policy --restart unless-stopped converts directly to standard systemd supervision with [Service] Restart=always.',
				],
			},
			{
				id: 'hardware-acceleration-dri',
				eyebrow: 'Hardware Passthrough',
				heading: 'Passing Intel QuickSync and AMD VAAPI Devices to Containers',
				paragraphs: [
					'Workloads such as Jellyfin, Plex, and Frigate NVR require direct access to GPU render nodes (/dev/dri/renderD128) to perform hardware video transcoding without saturating the CPU.',
					'In rootless Quadlet units, passing --device /dev/dri generates AddDevice=/dev/dri. To allow the unprivileged container process to access host GPU device nodes, administrators should include GroupAdd=keep-groups so user membership in the host render and video groups carries into the container namespace.',
				],
				bullets: [
					'AddDevice=/dev/dri exposes host GPU nodes inside the container.',
					'GroupAdd=keep-groups inherits host video and render GID permissions.',
					'UserNS=keep-id aligns user accounts to maintain access to local media directories.',
				],
			},
		],
		faqs: [
			{
				question: 'Which docker run and podman run flags does the converter recognize?',
				answer:
					'It parses --name, -p/--publish, -v/--volume, -e/--env, --env-file, --network, --restart, -u/--user, --workdir/-w, --hostname, --entrypoint, --device, --cap-add, --cap-drop, -l/--label, --shm-size, --privileged, and trailing image plus command arguments.',
			},
			{
				question: 'What happens to -d or --detach and --rm flags from docker run?',
				answer:
					'Quadlet manages foreground attachment and post-stop container cleanup natively through podman-system-generator, so -d and --rm are stripped cleanly rather than duplicated.',
			},
			{
				question: 'How do I pass Intel QuickSync or AMD VAAPI GPU devices in a rootless Quadlet?',
				answer:
					'Include --device /dev/dri in your run command so AddDevice=/dev/dri appears under [Container], and add GroupAdd=keep-groups if your host user belongs to the render and video groups.',
			},
			{
				question: 'Can I switch from a single docker run command to a multi-container Compose file in the same editor?',
				answer:
					'Yes. The parser inspects your input automatically on every keystroke and switches between docker-run and compose-yaml modes without losing your scope or SELinux settings.',
			},
		],
	},
	{
		slug: 'rootless-quadlet-selinux-volume-generator',
		path: '/rootless-quadlet-selinux-volume-generator/',
		navLabel: 'Rootless & SELinux',
		h1: 'Rootless Podman Quadlet Volume and SELinux Label Generator',
		seoTitle: 'Rootless Podman Quadlet Volume Z & SELinux Unit Builder',
		metaDescription:
			'Configure rootless Podman Quadlet volume z and Z bind mount labels for Fedora, RHEL, Bluefin, and CoreOS without permission denied container errors.',
		primaryKeyword: 'rootless podman quadlet volume z',
		heroSummary:
			'Build rootless Podman Quadlet units tailored for SELinux-enforcing Linux distributions including Fedora Server, Fedora CoreOS, RHEL 9, CentOS Stream, and Universal Blue. Append private :Z or shared :z bind mount labels automatically and isolate database credentials into a dedicated .env file.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'nextcloud-mariadb',
		defaultOptions: {
			stackName: 'nextcloud',
			installScope: 'rootless',
			selinuxMode: 'private-Z',
			enableAutoUpdate: false,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: true,
		},
		technicalNotes: [
			'Private :Z relabels a host bind directory with an exclusive Multi-Category Security (MCS) context so only that single container can read or write the files.',
			'Shared :z applies a group container_file_t label without container-exclusive MCS categories, which is required when Nextcloud and Nginx or backup sidecars mount the same host path.',
			'Named Podman volumes (.volume units) live under ~/.local/share/containers/storage/volumes/ and receive SELinux labels from Podman automatically without needing :Z.',
			'Rootless services stop when your last SSH session closes unless user lingering is enabled via sudo loginctl enable-linger $USER.',
		],
		showGeneratedExample: true,
		exampleLayout: 'split',
		guideSections: [
			{
				id: 'selinux-mcs-isolation',
				eyebrow: 'SELinux Mount Security',
				heading: 'Comparing Private :Z and Shared :z Mount Labels',
				paragraphs: [
					'SELinux enforces Mandatory Access Control on distributions such as Fedora, RHEL, CentOS Stream, and Fedora CoreOS. By default, processes running inside container domains (container_t) are prevented from reading or writing arbitrary files in the host filesystem, resulting in permission denied errors on bind mounts.',
					'Appending :Z to a bind mount instructs Podman to relabel the host directory with an exclusive Multi-Category Security (MCS) label (for example system_u:object_r:container_file_t:s0:c123,c456). Only the specific container assigned those categories can access the files, providing robust isolation for dedicated database directories.',
					'Appending :z applies the generic container_file_t type without container-specific categories. This shared label allows multiple distinct containers (such as Nextcloud and a web server frontend) to access the same directory simultaneously.',
				],
				bullets: [
					'Private :Z: Exclusive access for single-container state (Postgres, MariaDB, Redis).',
					'Shared :z: Multi-container shared access (web static assets, shared upload folders).',
					'Named volumes: Automated SELinux management without manual relabel flags.',
				],
			},
			{
				id: 'named-volumes-vs-bind-mounts',
				eyebrow: 'Storage Types',
				heading: 'Named .volume Units vs Host Directory Bind Mounts',
				paragraphs: [
					'Quadlet supports both host bind mounts and named Podman volumes. Named volumes declared in Compose volumes blocks map to dedicated .volume unit files stored under ~/.local/share/containers/storage/volumes/ in rootless mode.',
					'Because Podman manages the lifecycle and security contexts of named volumes internally, administrators do not need to append :z or :Z to named volume declarations. Bind mounts to arbitrary host paths, however, require explicit SELinux flags to prevent access denials.',
				],
			},
			{
				id: 'system-paths-warning',
				eyebrow: 'Security Precautions',
				heading: 'Critical System Directories You Must Never Relabel with :Z',
				paragraphs: [
					'Applying :z or :Z relabels all files and subdirectories recursively. Never bind mount top-level host paths like /, /etc, /usr, /var, or your unconstrained home directory (~/) with relabeling flags.',
					'Relabeling system paths changes their security context to container_file_t, which can block host services like sshd, systemd-logind, and PAM from reading required configuration files. Always place container data in dedicated application folders, such as ~/containers/<stack>/data.',
				],
			},
		],
		faqs: [
			{
				question: 'When should I choose private-Z instead of shared-z for rootless Podman volumes?',
				answer:
					'Choose private-Z when a host directory belongs exclusively to one container, such as MariaDB or PostgreSQL data directories. Choose shared-z when two or more containers mount the exact same host path, such as an application container and a web server container.',
			},
			{
				question: 'Are there host directories where I should never apply :z or :Z?',
				answer:
					'Never bind-mount broad system paths such as /, /etc, /usr, /var, or your top-level /home/$USER directory with :z or :Z. Relabeling those directories changes SELinux contexts needed by sshd and systemd. Always create dedicated subdirectories such as ~/containers/nextcloud/html.',
			},
			{
				question: 'How do I keep rootless Quadlet containers running after reboot without logging in?',
				answer:
					'Run sudo loginctl enable-linger $USER once on the host. That starts your systemd --user manager at boot and launches every Quadlet unit carrying WantedBy=default.target.',
			},
			{
				question: 'Why extract secrets to an .env file on rootless Linux hosts?',
				answer:
					'Storing passwords in ~/.config/containers/systemd/<stack>.env with chmod 600 keeps plaintext database credentials out of unit files that you may commit to a dotfiles or Ansible repository.',
			},
		],
	},
	{
		slug: 'immich-nextcloud-vaultwarden-quadlet-templates',
		path: '/immich-nextcloud-vaultwarden-quadlet-templates/',
		navLabel: 'Self-Hosted Templates',
		h1: 'Podman Quadlet Examples for Immich, Nextcloud, and Vaultwarden',
		seoTitle: 'Podman Quadlet Docker Compose Examples | Self-Hosted Apps',
		metaDescription:
			'Ready-to-deploy Podman Quadlet Docker Compose examples for Immich, Nextcloud, Vaultwarden, and Postgres stacks with shared DNS networks and volumes.',
		primaryKeyword: 'podman quadlet docker compose examples',
		heroSummary:
			'Start from curated multi-container Compose definitions for Immich, Nextcloud with MariaDB, Vaultwarden with Caddy, or Node with PostgreSQL and Redis. Adjust stack names, SELinux volume flags, and secret extraction in real time to inspect complete Quadlet unit sets.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'immich-stack',
		defaultOptions: {
			stackName: 'immich',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: true,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: true,
		},
		technicalNotes: [
			'Multi-container stacks such as Immich combine server, machine-learning, Redis, and vector-enabled PostgreSQL units connected over a single <stack>.network unit.',
			'Each service keeps its original Compose service name as NetworkAlias= or ContainerName= so internal connection strings like redis:6379 and database:5432 continue working unchanged.',
			'Model caches and database directories use named .volume units while media upload folders stay mapped as host bind mounts.',
			'Sensitive keys matching password, secret, token, or key patterns move into <stack>.env and connect via EnvironmentFile= across participating containers.',
		],
		showGeneratedExample: true,
		exampleLayout: 'stacked',
		guideSections: [
			{
				id: 'multi-tier-immich-architecture',
				eyebrow: 'Complex Stacks',
				heading: 'Orchestrating Immich Microservices Under systemd',
				paragraphs: [
					'Self-hosted photo management with Immich represents a modern microservices architecture comprising four interconnected components: the primary web application server, background machine learning workers, Redis key-value cache, and PostgreSQL with pgvector extensions.',
					'In Docker Compose, these services communicate over an implicit bridge network. In QuadletGen, compiling the Immich stack outputs four dedicated .container units and one shared immich.network file. Each container is configured with Network=immich.network and NetworkAlias directives, allowing the server to connect to redis:6379 and database:5432 seamlessly.',
				],
				codes: [
					{
						title: 'Immich stack unit orchestration overview',
						code: `# Unit dependency graph generated for Immich
immich-postgres.container -> Storage: immich-pgdata.volume
immich-redis.container    -> Storage: in-memory cache
immich-machine-learning   -> Storage: immich-model-cache.volume
immich-server             -> Storage: /srv/photos (bind mount)`,
					},
				],
			},
			{
				id: 'hybrid-storage-strategy',
				eyebrow: 'Storage Design',
				heading: 'Hybrid Storage Design for Databases and Large Media Libraries',
				paragraphs: [
					'Self-hosted deployments require a hybrid storage model: small, high-churn state (such as PostgreSQL database directories and vector embeddings) should use named Podman volumes (.volume units) stored in ~/.local/share/containers/storage/volumes/.',
					'Large media libraries (such as original RAW photos and video files) should reside on dedicated host storage partitions bind mounted with :z or :Z flags. This keeps backup policies separated and prevents container storage engines from duplicating multi-terabyte libraries.',
				],
			},
			{
				id: 'credential-isolation-env',
				eyebrow: 'Secret Hygiene',
				heading: 'Isolating Passwords into chmod 600 Environment Files',
				paragraphs: [
					'Multi-tier stacks require multiple shared secrets, including DB_PASSWORD, JWT_SECRET, and REDIS_PASSWORD. Hardcoding these credentials directly in systemd unit files creates security risks when committing infrastructure configurations to version control.',
					'Toggling secret extraction in QuadletGen moves sensitive parameters into a companion <stack>.env file. Setting chmod 600 on this file ensures that only your unprivileged user account can read database passwords on the server.',
				],
			},
		],
		faqs: [
			{
				question: 'Do Compose connection hostnames like postgres or redis still work in Quadlet?',
				answer:
					'Yes. When all containers in the stack attach to the generated <stack>.network unit, Podman aardvark-dns registers container names and network aliases so services reach postgres:5432 or redis:6379 without code changes.',
			},
			{
				question: 'How do I migrate existing Docker volumes when switching Immich or Nextcloud to Podman?',
				answer:
					'Stop the Docker stack, copy bind-mounted host directories to your target path, or export named Docker volumes with tar and import them using podman volume import into the matching Quadlet .volume storage.',
			},
			{
				question: 'Can I customize image tags or host ports after loading a built-in template?',
				answer:
					'Yes. Edit the YAML directly in the left pane and every generated .container, .network, .volume, and .env file updates immediately.',
			},
			{
				question: 'In what order does systemd start multi-container self-hosted templates?',
				answer:
					'Network and volume units activate first, followed by database and cache units, and finally web or worker units that declare After= and Requires= from Compose depends_on.',
			},
		],
	},
	{
		slug: 'podlet-online-multi-container-network-packager',
		path: '/podlet-online-multi-container-network-packager/',
		navLabel: 'Podlet Online Packager',
		h1: 'Podlet Online Multi-Container Quadlet Network and ZIP Packager',
		seoTitle: 'Podlet Online Multi-Container Quadlet & ZIP Unit Packager',
		metaDescription:
			'Run a Podlet online workflow in your browser without Cargo or Rust. Package Compose stacks into linked .container, .network, .volume, and .env ZIPs.',
		primaryKeyword: 'podlet online',
		heroSummary:
			'Convert complete multi-container Compose stacks into linked Quadlet bundles right in your browser without installing Rust, Cargo, or local container engines. Automatically generate shared .network units, split secrets into .env files, and export a single <stack>-quadlet.zip package.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'web-postgres-redis',
		defaultOptions: {
			stackName: 'appstack',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: false,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: true,
		},
		technicalNotes: [
			'Runs in any desktop or mobile browser with zero binary installation, making it practical on macOS, Windows laptops, or locked-down workstations when preparing Linux server deployments.',
			'Automatically synthesizes a shared <stack>.network unit even when the input compose.yaml relies on Docker Compose implicit default networking.',
			'Packages every generated .container, .network, .volume, and .env file into a standards-compliant PKZIP archive ready to copy over scp or sftp.',
			'Displays exact systemctl reload and service start commands matched to your chosen rootless or rootful install scope.',
		],
		showGeneratedExample: true,
		exampleLayout: 'stacked',
		guideSections: [
			{
				id: 'browser-vs-cli-packaging',
				eyebrow: 'Zero-Install Packaging',
				heading: 'Online Multi-Container Packaging Without Rust or Cargo',
				paragraphs: [
					'The upstream containers/podlet command-line tool is a Rust utility that requires installing Cargo or fetching precompiled Linux binary packages. While effective for single-container command conversions on a Linux host, running it on macOS or Windows developer machines requires setup overhead.',
					'QuadletGen runs its parser and packaging engine entirely in client-side JavaScript. Developers can convert complex multi-service stacks on their workstations, preview unit files interactively, and export a ready-to-deploy archive without installing local container runtimes.',
				],
			},
			{
				id: 'zip-archive-structure',
				eyebrow: 'Archive Contents',
				heading: 'Structure of the Downloaded Deployment ZIP Archive',
				paragraphs: [
					'Clicking Download .zip Bundle builds a standard PKZIP archive in browser memory. The archive packages every compiled .container file, the shared .network bridge definition, named .volume declarations, extracted .env credential files, and a comprehensive README.txt.',
					'The included README.txt details the required file permissions, systemctl reload commands, and explicit notices regarding any Compose directives (such as depends_on condition: service_completed_successfully) that require manual adjustment.',
				],
			},
			{
				id: 'server-deployment-workflow',
				eyebrow: 'Server Runbook',
				heading: 'Deploying the Quadlet Bundle to Remote Linux Servers',
				paragraphs: [
					'Deploying the downloaded bundle to a remote Linux VPS requires four simple shell commands. Transfer the archive using scp, unpack into ~/.config/containers/systemd/, set restricted permissions on environment files, and instruct systemd to compile the units.',
				],
				codes: [
					{
						title: 'Complete remote host deployment commands',
						code: `scp appstack-quadlet.zip server:~/.config/containers/systemd/
ssh server "cd ~/.config/containers/systemd && unzip -o appstack-quadlet.zip"
ssh server "chmod 600 ~/.config/containers/systemd/*.env 2>/dev/null || true"
ssh server "systemctl --user daemon-reload && systemctl --user start appstack-*.service"`,
					},
				],
			},
		],
		faqs: [
			{
				question: 'How does QuadletGen compare to the containers/podlet CLI?',
				answer:
					'The containers/podlet CLI is a local Rust command-line tool installed via Cargo or distro packages. QuadletGen runs in the browser with zero installation, previews all generated unit files side by side, separates secret .env files on toggle, and bundles multi-service stacks into a single ZIP download.',
			},
			{
				question: 'How do I deploy the downloaded <stack>-quadlet.zip bundle to a remote Linux VPS?',
				answer:
					'Transfer the ZIP file with scp, extract its contents into ~/.config/containers/systemd/ for rootless mode, tighten permissions with chmod 600 *.env, and run systemctl --user daemon-reload followed by the generated start commands.',
			},
			{
				question: 'Are there limits on how many services or volumes I can package in one ZIP?',
				answer:
					'No. Because conversion and ZIP packaging execute locally in your browser memory, stacks with two containers or twenty containers convert without artificial limits or account gates.',
			},
			{
				question: 'How do I remove a Quadlet stack cleanly on my server?',
				answer:
					'Stop the running services with systemctl --user stop, delete the corresponding .container, .network, and .volume files from ~/.config/containers/systemd/, and run systemctl --user daemon-reload.',
			},
		],
	},
	...LONGTAIL_PRESETS,
];

export interface QuadletCheatSheetRow {
	composeKey: string;
	quadletSection: string;
	quadletDirective: string;
	runtimeNote: string;
}

export const QUADLET_CHEAT_SHEET: readonly QuadletCheatSheetRow[] = [
	{
		composeKey: 'services.<app>.image',
		quadletSection: '[Container]',
		quadletDirective: 'Image=docker.io/library/...',
		runtimeNote: 'Use a fully qualified registry host when AutoUpdate=registry is enabled.',
	},
	{
		composeKey: 'ports: ["8080:80"] / -p',
		quadletSection: '[Container]',
		quadletDirective: 'PublishPort=8080:80',
		runtimeNote: 'Repeats once per published host port; supports bind IP and /udp protocol suffixes.',
	},
	{
		composeKey: 'volumes: ["./data:/data"] / -v',
		quadletSection: '[Container] + .volume',
		quadletDirective: 'Volume=/srv/data:/data:Z',
		runtimeNote: 'Named volumes map to <name>.volume units; bind mounts append :z or :Z on SELinux hosts.',
	},
	{
		composeKey: 'environment / env_file / -e',
		quadletSection: '[Container]',
		quadletDirective: 'Environment= / EnvironmentFile=',
		runtimeNote: 'Sensitive password, token, and key entries extract into <stack>.env with chmod 600.',
	},
	{
		composeKey: 'depends_on / service_healthy',
		quadletSection: '[Unit] + [Container]',
		quadletDirective: 'After= + Requires= + Notify=healthy',
		runtimeNote: 'service_started is ordering only. service_healthy also sets Notify=healthy on the dependency when it has a healthcheck (Podman 5.0+).',
	},
	{
		composeKey: 'networks (or stack default)',
		quadletSection: '[Container] + .network',
		quadletDirective: 'Network=<stack>.network',
		runtimeNote: 'Creates an aardvark-dns bridge so peer containers resolve each other by service name.',
	},
	{
		composeKey: 'restart: unless-stopped',
		quadletSection: '[Service] + [Install]',
		quadletDirective: 'Restart=always + WantedBy=',
		runtimeNote: 'systemd restarts crashed containers and launches units on boot or user linger.',
	},
	{
		composeKey: 'healthcheck.test / interval',
		quadletSection: '[Container]',
		quadletDirective: 'HealthCmd= / HealthInterval=',
		runtimeNote: 'CMD and CMD-SHELL become HealthCmd=. Pair with Notify=healthy when another service waits for service_healthy.',
	},
	{
		composeKey: 'devices / cap_add / user',
		quadletSection: '[Container]',
		quadletDirective: 'AddDevice= / AddCapability= / User=',
		runtimeNote: 'Passes /dev/dri GPU render nodes and scoped Linux capabilities without --privileged.',
	},
	{
		composeKey: 'io.containers.autoupdate',
		quadletSection: '[Container]',
		quadletDirective: 'AutoUpdate=registry',
		runtimeNote: 'Works with podman-auto-update.timer to pull newer image digests and roll services.',
	},
];

export interface RelatedGuideCard {
	href: string;
	badge: string;
	title: string;
	summary: string;
	ctaLabel: string;
}

const PRESET_BADGE_MAP: Record<string, string> = {
	'': 'Core YAML Converter',
	'podman-quadlet-generator': 'AutoUpdate + systemd',
	'docker-run-to-quadlet-converter': 'CLI Flag Parser',
	'rootless-quadlet-selinux-volume-generator': 'SELinux :z / :Z Mounts',
	'immich-nextcloud-vaultwarden-quadlet-templates': 'Self-Hosted Stacks',
	'podlet-online-multi-container-network-packager': 'Multi-Unit ZIP Bundle',
	'quadlet-depends-on-healthcheck': 'service_healthy Mapping',
	'quadlet-not-starting-on-boot': 'Linger and Boot',
	'podman-pihole-quadlet': 'Rootless DNS',
	'jellyfin-podman-quadlet': 'Jellyfin /dev/dri',
	'quadlet-vs-docker-compose': 'Compose Comparison',
	'podman-quadlet-secrets-management': 'Secrets & Security',
	'debug-podman-quadlet-systemd-errors': 'Debug & Diagnostic',
	'traefik-podman-quadlet-reverse-proxy': 'Traefik & Reverse Proxy',
	'rootless-podman-quadlet-permissions-keep-id': 'UID Mapping & keep-id',
	'systemd-quadlet-resource-limits-hardening': 'Resource Limits & Hardening',
	'docker-compose-to-podman-quadlet-migration-guide': 'Migration Playbook',
};

export function getRelatedGuideCards(currentPath: string): RelatedGuideCard[] {
	const cards: RelatedGuideCard[] = ROUTE_PRESETS.filter((item) => item.path !== currentPath).map(
		(item) => ({
			href: item.path,
			badge: PRESET_BADGE_MAP[item.slug] ?? 'Quadlet Generator',
			title: item.h1,
			summary: item.metaDescription,
			ctaLabel: `Open ${item.navLabel}`,
		}),
	);

	cards.push({
		href: '/about/',
		badge: 'Architecture & Dry-Run Guide',
		title: 'QuadletGen Conversion Rules and systemd Dry-Run Verification',
		summary:
			'Review how QuadletGen synthesizes .container, .network, .volume, and .env units locally and how to verify syntax with podman/quadlet --dryrun.',
		ctaLabel: 'Read architecture guide',
	});

	return cards;
}

const PRESET_MAP = new Map<string, QuadletRoutePreset>(
	ROUTE_PRESETS.map((preset) => [preset.slug, preset]),
);

export function getPresetBySlug(slug: string): QuadletRoutePreset | undefined {
	const normalized = slug.trim().replace(/^\/+|\/+$/g, '');
	return PRESET_MAP.get(normalized);
}
