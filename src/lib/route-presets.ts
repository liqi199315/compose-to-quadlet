import type { QuadletRoutePreset } from './types';

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
			'Compose depends_on entries translate to systemd [Unit] After= and Requires= directives so PostgreSQL, MariaDB, and Redis containers start before application workers.',
			'Rootless units live in ~/.config/containers/systemd/ and run under your unprivileged user session via systemctl --user without a root daemon.',
			'Named volumes from top-level Compose volumes blocks become dedicated .volume Quadlet files referenced by unit name in Volume= directives.',
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
		composeKey: 'depends_on',
		quadletSection: '[Unit]',
		quadletDirective: 'After=<dep>.service + Requires=',
		runtimeNote: 'Starts PostgreSQL, MariaDB, and Redis units before dependent web or worker units.',
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
		runtimeNote: 'Translates CMD and CMD-SHELL probes along with retries, timeout, and start_period.',
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
