import type { QuadletRoutePreset } from './types';

const SITE_LINE =
	'This page is part of QuadletGen at quadletgen.com, the browser-local Compose and docker run to Podman Quadlet converter. It is not the unrelated QuadletGen tool at devencyclopedia.com/tools/quadletgen.';

const GENERATOR_LINE =
	'Generator check on 2026-11-13: Podman 5.8.10 from the podman-static 5.8.10 bundle, command quadlet -version (printed 5.8.10) and quadlet -dryrun -user. Ubuntu 24.04 apt ships Podman 4.9.3, which was not installed here. The upstream Podman 4.9.3 unit manual does not document Notify=healthy; that value arrived in Podman 5.0. Containers were not started, port 53 was not bound, no GPU was attached, and the machine was not rebooted.';

function provenance(specific: string): string {
	return `${specific} ${SITE_LINE} ${GENERATOR_LINE}`;
}

export const LONGTAIL_PRESETS: QuadletRoutePreset[] = [
	{
		slug: 'quadlet-depends-on-healthcheck',
		path: '/quadlet-depends-on-healthcheck/',
		navLabel: 'Health Depends',
		h1: 'Quadlet depends_on with condition service_healthy',
		seoTitle: 'Quadlet depends_on Healthcheck | Notify=healthy | QuadletGen',
		metaDescription:
			'Map Compose depends_on condition service_healthy to Quadlet After=, Requires=, and Notify=healthy. Paste a healthcheck stack and export the units in the browser.',
		primaryKeyword: 'quadlet depends on healthcheck',
		heroSummary:
			'Compose condition service_healthy does not become a single Quadlet key. The dependency unit needs Notify=healthy plus a HealthCmd, and the application unit needs After= and Requires=. Paste the sample or your own snippet, then copy or download the units. The export stays in this browser.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'healthcheck-depends',
		defaultOptions: {
			stackName: 'app',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: false,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: true,
		},
		provenanceNote: provenance(
			'On the loaded sample, db.container contains Notify=healthy and HealthCmd=pg_isready -U app -d app. api.container contains After=db.service and Requires=db.service. The Podman 5.8.10 dry-run turned Notify=healthy into podman run --sdnotify=healthy, and a unit without that key used --sdnotify=conmon.',
		),
		showGeneratedExample: true,
		exampleLayout: 'stacked',
		technicalNotes: [
			'After= and Requires= wait until the dependency unit is active. Without Notify=healthy, Podman reports active when conmon has started the container, which is before pg_isready succeeds.',
			'Notify=healthy belongs on the dependency (the database), not on the application. It requires HealthCmd= or an image HEALTHCHECK. Podman 5.0 added the value. Podman 4.9 rejects it.',
			'If one sibling uses service_healthy and another uses service_started on the same database, the tool still sets Notify=healthy and warns that both waiters now wait for the healthcheck. systemd has one active state per unit.',
			'Short-form depends_on lists are condition service_started. They get After= and Requires= and do not set Notify=healthy, even when that service also has a healthcheck.',
		],
		faqs: [
			{
				question: 'Why does podlet fail on depends_on condition service_healthy?',
				answer:
					'containers/podlet issue 164 shows podlet stopping with "dependency condition service_healthy is not directly supported" and telling the operator to add Notify=healthy by hand. QuadletGen writes After= and Requires= on the waiter and Notify=healthy on the dependency when that dependency has a healthcheck.',
			},
			{
				question: 'Where does Notify=healthy go?',
				answer:
					'On the service that must become healthy, in the [Container] section, next to HealthCmd=. The service that waits lists After=name.service and Requires=name.service in [Unit]. Putting Notify=healthy only on the application does not delay startup until the database answers.',
			},
			{
				question: 'What if the database has no healthcheck?',
				answer:
					'The converter does not emit Notify=healthy in that case. Podman would never send the ready notification, and the waiter would sit until TimeoutStartSec. Add a healthcheck.test such as pg_isready, then convert again.',
			},
			{
				question: 'Does service_completed_successfully map to a Quadlet key?',
				answer:
					'No. The converter keeps After= and Requires= and warns. A one-shot init container needs Type=oneshot and RemainAfterExit=yes added on that .container file by hand. This sample uses service_healthy, which does have a mapping.',
			},
		],
		guideSections: [
			{
				id: 'why-after-is-not-enough',
				eyebrow: 'Failure mode',
				heading: 'After= waits for the unit, not for Postgres',
				paragraphs: [
					'A common migration break is an application that crashes on boot because the database process exists but is not accepting connections. Compose hid that race with condition: service_healthy. A Quadlet file that only copies the service name into After= and Requires= still starts the application when Podman notifies systemd.',
					'The Podman 5.8.10 dry-run of a container unit with no Notify= key produced ExecStart containing --sdnotify=conmon. That notification fires when the container runtime has created the container. pg_isready can still be failing. Notify=healthy changes the same ExecStart flag to --sdnotify=healthy, so the unit stays activating until the healthcheck passes.',
				],
				codes: [
					{
						title: 'Dependency unit, the lines that close the race',
						code: `[Container]
HealthCmd=pg_isready -U app -d app
HealthInterval=10s
HealthTimeout=5s
HealthRetries=5
HealthStartPeriod=20s
Notify=healthy`,
					},
					{
						title: 'Application unit, the lines that wait',
						code: `[Unit]
After=db.service
Requires=db.service`,
					},
				],
			},
			{
				id: 'podlet-164',
				eyebrow: 'Upstream evidence',
				heading: 'What podlet issue 164 actually reports',
				paragraphs: [
					'On 15 December 2025, containers/podlet issue 164 reported that a Compose file with depends_on condition service_healthy fails conversion. The error chain ends with "dependency condition service_healthy is not directly supported". Podlet tells the user to edit the generated file and set Notify=healthy. The issue asks for two behaviors: emit Notify=healthy when a service defines a healthcheck, and emit Requires= plus After= when a waiter uses service_healthy.',
					'QuadletGen does the second always, and it emits Notify=healthy only when some waiter uses service_healthy and the dependency has a healthcheck command. A healthcheck that nobody waits on stays HealthCmd= only, matching Compose: the container is already started, and the probe is informational. That is narrower than the feature request in the issue, and it avoids holding an unused database in the activating state until the probe passes.',
				],
				links: [
					{
						href: 'https://github.com/containers/podlet/issues/164',
						label: 'containers/podlet issue 164',
						external: true,
					},
					{
						href: 'https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html',
						label: 'podman-systemd.unit(5) Notify= section',
						external: true,
					},
				],
			},
			{
				id: 'use-the-tool',
				eyebrow: 'Try the loaded sample',
				heading: 'Paste a health condition and export',
				paragraphs: [
					'The workbench on this page opens with an api service that waits on db with condition service_healthy, and a Postgres 16 healthcheck using pg_isready. The database password is a sample value and is split into app.env because secret extraction is on. Replace it before you copy the files to a server.',
					'Use Copy unit or Download ZIP in the workbench. Both run locally and record a quadlet_export event. If your file uses the short list form of depends_on, switch one dependency to the long condition form and watch Notify=healthy appear on that dependency only.',
				],
				bullets: [
					'Podman 5.0 or newer on the server. Podman 4.9 will reject Notify=healthy.',
					'Install the files under ~/.config/containers/systemd/ for the rootless sample.',
					'Run systemctl --user daemon-reload, then start the api service. systemd starts db first and holds api until the healthcheck passes.',
					'If the probe never passes, the unit stays activating until TimeoutStartSec=900.',
				],
			},
		],
		spotlightLinks: [
			{
				href: '/quadlet-not-starting-on-boot/',
				eyebrow: 'Next failure',
				title: 'The unit is healthy but nothing starts after reboot',
				summary:
					'Notify=healthy cannot help if the rootless user manager never starts. Check linger and WantedBy=default.target.',
			},
			{
				href: '/quadlet-vs-docker-compose/',
				eyebrow: 'Migration choice',
				title: 'See a whole stack as Compose and as Quadlet',
				summary:
					'The comparison page converts one proxy stack in the tool and links back to this healthcheck mapping.',
			},
		],
	},
	{
		slug: 'quadlet-not-starting-on-boot',
		path: '/quadlet-not-starting-on-boot/',
		navLabel: 'Boot Linger',
		h1: 'Quadlet not starting on boot',
		seoTitle: 'Quadlet Not Starting on Boot | Rootless Linger | QuadletGen',
		metaDescription:
			'Fix rootless Quadlet units that do not start after reboot. Check WantedBy=default.target, loginctl enable-linger, and the Podman 5.3 network wait service.',
		primaryKeyword: 'quadlet not starting on boot',
		heroSummary:
			'A rootless Quadlet that starts from an SSH session and then disappears after reboot is usually the user systemd manager, not the container image. The sample below is a single nginx unit with WantedBy=default.target. Flip Install Scope to rootful in the tool if you want to see multi-user.target instead.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'rootless-boot-nginx',
		defaultOptions: {
			stackName: 'site',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: false,
			generateSharedNetwork: false,
			extractSecretsToEnvFile: false,
		},
		provenanceNote: provenance(
			'The loaded nginx sample dry-ran as a user unit with WantedBy=default.target. Podman 5.8.10 also injected Wants=podman-user-wait-network-online.service and After=podman-user-wait-network-online.service, which is the Podman 5.3 workaround for pasta reporting "External interface not usable" at boot.',
		),
		showGeneratedExample: true,
		exampleLayout: 'stacked',
		technicalNotes: [
			'Rootless Quadlet files live in ~/.config/containers/systemd/. The user manager starts default.target at login, and after reboot only if lingering is enabled. WantedBy=multi-user.target is the rootful target, written when you switch Install Scope to rootful.',
			'Do not systemctl enable the generated service name. podman-system-generator creates the start symlink from the [Install] section during daemon-reload. Enabling the transient unit by hand is what the home page FAQ warns against.',
			'Linger without a usable network still fails. r/podman threads show units with WantedBy=default.target and linger already on that still die at boot with pasta errors. Podman 5.3 added podman-user-wait-network-online.service for user units.',
			'network-online.target inside a user unit is not the same object as the system target. The generator-added wait service loops until the system network-online.target is active. Upgrading past Podman 5.3 matters more than adding another After= line by hand.',
		],
		faqs: [
			{
				question: 'Why does a rootless Quadlet start over SSH and not after reboot?',
				answer:
					'An SSH login starts your systemd --user manager. After reboot that manager does not start until you log in again, unless sudo loginctl enable-linger was run for your user. The unit also needs WantedBy=default.target so the generator attaches it to the user default target.',
			},
			{
				question: 'Should a rootless unit use WantedBy=multi-user.target?',
				answer:
					'No. multi-user.target is the system target used for rootful units in /etc/containers/systemd/. Rootless units use WantedBy=default.target. The workbench writes that line when Install Scope is rootless. Switching the select to rootful rewrites it to multi-user.target and changes the install path.',
			},
			{
				question: 'Linger is already yes and the container still misses boot. What else fails?',
				answer:
					'Read journalctl --user -u web.service -b. r/podman reports "External interface not usable" when pasta starts before the host network is ready, even with linger and WantedBy=default.target. Podman 5.3 and newer add podman-user-wait-network-online.service during generation. Podman 5.8.10 did that on the dry-run of this sample.',
			},
			{
				question: 'Where do I put the file, and which systemctl do I run?',
				answer:
					'For this rootless sample, copy web.container to ~/.config/containers/systemd/web.container and run systemctl --user daemon-reload, then systemctl --user start web.service. sudo systemctl looks at system units and will not see a file under your home directory.',
			},
		],
		guideSections: [
			{
				id: 'three-boot-failures',
				eyebrow: 'Three different bugs',
				heading: 'Not starting on boot is not one error',
				paragraphs: [
					'r/podman "Quadlet not starting on boot" and "Unable to start Podman Quadlets on boot" mix three separate failures. The first is lingering: the user manager is not running at boot, so no user unit can start. The second is the install target: a rootless file with only WantedBy=multi-user.target is never pulled in by the user default target. The third is timing: the unit starts, pasta cannot see an external interface, and the container exits. Manual systemctl --user start later works, which is why it looks like a boot-only bug.',
					'The Jellyfin report in the second thread already had WantedBy=default.target and linger enabled. The log line was "External interface not usable". Erik Sjolund pointed at the pasta race. Podman 5.3.0 added /usr/lib/systemd/user/podman-user-wait-network-online.service, and the user generator now orders container services after it. The 5.8.10 dry-run of this nginx sample showed that dependency even though the .container source does not mention it.',
				],
				links: [
					{
						href: 'https://www.reddit.com/r/podman/comments/1pyodsa/quadlet_not_starting_on_boot/',
						label: 'r/podman: Quadlet not starting on boot',
						external: true,
					},
					{
						href: 'https://www.reddit.com/r/podman/comments/1iu2z1w/unable_to_start_podman_quadlets_on_boot/',
						label: 'r/podman: Unable to start Podman Quadlets on boot',
						external: true,
					},
				],
			},
			{
				id: 'linger-checklist',
				eyebrow: 'Checklist',
				heading: 'loginctl enable-linger, then prove the user manager will exist',
				paragraphs: [
					'Run these on the Linux host as the same user that owns the Quadlet files. This page cannot perform them for you. The sample unit is what you install after the checks pass.',
				],
				codes: [
					{
						title: 'Enable lingering once, then read it back',
						code: `sudo loginctl enable-linger "$USER"
loginctl show-user "$USER" -p Linger
# Linger=yes
ls -l "/var/lib/systemd/linger/$USER"`,
					},
					{
						title: 'Install the generated rootless unit and reload the user manager',
						code: `install -d "$HOME/.config/containers/systemd"
install -m 0644 web.container "$HOME/.config/containers/systemd/web.container"
systemctl --user daemon-reload
systemctl --user start web.service
systemctl --user status web.service`,
					},
					{
						title: 'After the next reboot, before you call it fixed',
						code: `systemctl --user is-system-running
systemctl --user status web.service
journalctl --user -u web.service -b --no-pager`,
					},
				],
				bullets: [
					'Linger=no means the manager starts only when you log in. Enable linger, then reboot once. Do not test from the same SSH session you used to start the container by hand.',
					'The [Install] section in the sample is WantedBy=default.target. If you edited it to multi-user.target only, change it back or switch the tool to rootful and install under /etc/containers/systemd/ with sudo.',
					'If status shows the pasta external-interface error, confirm podman version is 5.3 or newer so the user generator emits podman-user-wait-network-online.service. Then daemon-reload again.',
					'A .pod unit needs its own [Install] WantedBy=default.target. This converter writes .container, .network, and .volume units, not pods.',
				],
			},
		],
		spotlightLinks: [
			{
				href: '/podman-pihole-quadlet/',
				eyebrow: 'DNS on boot',
				title: 'Pi-hole also has to bind port 53 after reboot',
				summary:
					'Linger gets the unit started. Port 53 still needs ip_unprivileged_port_start for a rootless DNS server.',
			},
			{
				href: '/jellyfin-podman-quadlet/',
				eyebrow: 'Same boot path',
				title: 'Jellyfin uses the same rootless WantedBy line',
				summary:
					'The Jellyfin template is a user unit. Hardware access does not replace linger or default.target.',
			},
		],
	},
	{
		slug: 'podman-pihole-quadlet',
		path: '/podman-pihole-quadlet/',
		navLabel: 'Pi-hole',
		h1: 'Podman Pi-hole Quadlet for rootless DNS',
		seoTitle: 'Podman Pi-hole Quadlet | Rootless Port 53 | QuadletGen',
		metaDescription:
			'Rootless Podman Pi-hole Quadlet for DNS port 53 and a web UI on 8080. Covers ip_unprivileged_port_start, systemd-resolved, and FTLCONF_dns_listeningMode=ALL.',
		primaryKeyword: 'podman pihole quadlet',
		heroSummary:
			'Run Pi-hole as a rootless Quadlet that publishes DNS on port 53 and the admin UI on host port 8080. The sample follows the current Pi-hole v6 Compose variables, skips DHCP, and turns secret extraction on so the web password lands in pihole.env. SELinux private :Z is selected for the config directory.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'pihole-rootless',
		defaultOptions: {
			stackName: 'pihole',
			installScope: 'rootless',
			selinuxMode: 'private-Z',
			enableAutoUpdate: true,
			generateSharedNetwork: false,
			extractSecretsToEnvFile: true,
		},
		provenanceNote: provenance(
			'The Pi-hole unit dry-ran with PublishPort=53:53/tcp, PublishPort=53:53/udp, PublishPort=8080:80/tcp, Environment=FTLCONF_dns_listeningMode=ALL, and Volume=/srv/pihole/etc-pihole:/etc/pihole:Z. The container was not started, and port 53 was not bound during that check.',
		),
		showGeneratedExample: true,
		exampleLayout: 'stacked',
		technicalNotes: [
			'Ports below 1024 are privileged. Rootless Podman cannot publish 53 until the host sets net.ipv4.ip_unprivileged_port_start to 53 or lower. That sysctl applies to every unprivileged process on the machine, not only Pi-hole.',
			'The official Pi-hole Compose file publishes 80/tcp and 443/tcp. This template publishes 8080:80/tcp instead, so the admin UI does not need a second privileged port. Open http://HOST:8080/admin after DNS is up.',
			'On a bridge network, Pi-hole must listen on all interfaces or published port 53 never answers LAN clients. FTLCONF_dns_listeningMode=ALL is the upstream setting for that case. Do not leave the default local-only mode.',
			'The Pi-hole image Dockerfile HEALTHCHECK runs dig against 127.0.0.1 pi.hole. This template does not set HealthCmd=, so Podman keeps that image check. DHCP on 67/udp and NET_ADMIN are omitted. Rootless Podman is a poor DHCP server.',
		],
		faqs: [
			{
				question: 'Why does rootless Pi-hole fail to publish port 53?',
				answer:
					'The kernel blocks unprivileged binds below 1024. Set net.ipv4.ip_unprivileged_port_start=53 and reload sysctl. Alternatively switch Install Scope in the tool to rootful, install the unit under /etc/containers/systemd/, and skip the sysctl. Rootful still must not collide with whatever already owns port 53.',
			},
			{
				question: 'systemd-resolved already uses port 53. What do I change?',
				answer:
					'Check the socket first with ss. On many Fedora and Ubuntu installs, systemd-resolved owns a stub on 127.0.0.53:53 and sometimes also 0.0.0.0:53. If something is bound to the address you want Pi-hole to publish, set DNSStubListener=no in resolved.conf, restart systemd-resolved, and point the host resolver at 127.0.0.1. Do this only on the DNS server, not on a laptop that still needs the stub.',
			},
			{
				question: 'Does this template replace the Immich, Nextcloud, or Vaultwarden pages?',
				answer:
					'No. Those templates stay on the self-hosted stacks page. This page is only Pi-hole DNS plus its web UI. It does not generate a DHCP server, an Unbound resolver, or a second container.',
			},
			{
				question: 'Where does the admin password go?',
				answer:
					'Secret extraction is on, so FTLCONF_webserver_api_password is removed from the unit and written to pihole.env. The sample value is sample-pihole-web-password. Replace it, install the env file next to the unit, and chmod 600 the env file. An empty password is a separate Pi-hole setting and is not what this sample does.',
			},
		],
		guideSections: [
			{
				id: 'ports-and-sysctl',
				eyebrow: 'Port 53',
				heading: 'ip_unprivileged_port_start before the unit will bind DNS',
				paragraphs: [
					'The workbench sample publishes 53/tcp, 53/udp, and 8080/tcp. Quadlet accepts those PublishPort= lines. The kernel still refuses the bind until the unprivileged port floor includes 53. Persist the sysctl, or the next reboot returns the same denial after linger has done its job.',
					'Flipping Install Scope to rootful in the tool rewrites the install path to /etc/containers/systemd/ and WantedBy=multi-user.target. That path can bind port 53 without the sysctl, and it is the right choice when you do not want every local user to bind low ports. The unit text is still produced in the browser.',
				],
				codes: [
					{
						title: 'Persist the unprivileged port floor, then read it back',
						code: `echo 'net.ipv4.ip_unprivileged_port_start=53' | sudo tee /etc/sysctl.d/99-rootless-dns.conf
sudo sysctl --system
sysctl net.ipv4.ip_unprivileged_port_start`,
					},
					{
						title: 'See who already owns DNS before you start Pi-hole',
						code: `sudo ss -H -ltnp 'sport = :53'
sudo ss -H -lunp 'sport = :53'`,
					},
					{
						title: 'Turn off the resolved stub only if it holds port 53',
						code: `printf '[Resolve]\\nDNSStubListener=no\\n' | sudo tee /etc/systemd/resolved.conf.d/no-stub.conf
sudo systemctl restart systemd-resolved`,
					},
				],
			},
			{
				id: 'v6-config',
				eyebrow: 'Pi-hole v6',
				heading: 'What this Quadlet keeps from the official Compose file',
				paragraphs: [
					'The upstream docker-pi-hole Compose example uses image pihole/pihole:latest, FTLCONF_webserver_api_password, and FTLCONF_dns_listeningMode set to ALL when the container is on a bridge. It also publishes 80 and 443, optionally 67/udp for DHCP, and adds NET_ADMIN. A fresh v6 install does not need the old etc-dnsmasq.d mount. Upgrades from v5 that already stored files there should add that volume and set FTLCONF_misc_etc_dnsmasq_d to true for the first start.',
					'This Quadlet keeps the image, the password variable, and listening mode ALL. It moves the web UI to host port 8080, drops DHCP and NET_ADMIN, and bind-mounts only /srv/pihole/etc-pihole. Create that directory and give it to the user who will run the unit. With the SELinux select on private-Z, the generated Volume= line ends in :Z. Do not point :Z at /etc or another system directory.',
				],
				bullets: [
					'mkdir -p /srv/pihole/etc-pihole and chown it to the rootless user before the first start.',
					'Replace sample-pihole-web-password in the downloaded pihole.env.',
					'AutoUpdate=registry is on. The image name is already docker.io/pihole/pihole:latest. Enable podman-auto-update.timer only if you accept rolling :latest.',
					'Clients should use the host LAN address as their DNS server, not the container bridge address.',
				],
				links: [
					{
						href: 'https://github.com/pi-hole/docker-pi-hole',
						label: 'Official Pi-hole Docker Compose example',
						external: true,
					},
				],
			},
		],
		spotlightLinks: [
			{
				href: '/quadlet-not-starting-on-boot/',
				eyebrow: 'After reboot',
				title: 'DNS that works in a shell and vanishes at boot',
				summary:
					'Enable linger and keep WantedBy=default.target, or the port 53 sysctl never gets a chance to matter.',
			},
			{
				href: '/rootless-quadlet-selinux-volume-generator/',
				eyebrow: 'SELinux volumes',
				title: 'When :Z is the wrong label for a shared directory',
				summary:
					'The Pi-hole config directory is private. A folder mounted by two containers needs shared :z instead.',
			},
		],
	},
	{
		slug: 'jellyfin-podman-quadlet',
		path: '/jellyfin-podman-quadlet/',
		navLabel: 'Jellyfin',
		h1: 'Jellyfin Podman Quadlet with hardware transcoding',
		seoTitle: 'Jellyfin Podman Quadlet | /dev/dri Transcode | QuadletGen',
		metaDescription:
			'Migrate the existing Jellyfin docker run template to Quadlet with /dev/dri, GroupAdd=keep-groups, UserNS=keep-id, and SELinux device notes.',
		primaryKeyword: 'jellyfin podman quadlet',
		heroSummary:
			'The Docker Run converter already ships a Jellyfin docker run sample. This page loads that same template, with rootless scope and private SELinux labels selected, and explains the /dev/dri lines the unit needs for Intel Quick Sync or AMD VAAPI. It does not add a second Jellyfin template.',
		defaultInputMode: 'docker-run',
		defaultTemplateId: 'docker-run-jellyfin',
		defaultOptions: {
			stackName: 'jellyfin',
			installScope: 'rootless',
			selinuxMode: 'private-Z',
			enableAutoUpdate: true,
			generateSharedNetwork: false,
			extractSecretsToEnvFile: false,
		},
		provenanceNote: provenance(
			'The existing Jellyfin docker run template dry-ran to AddDevice=/dev/dri:/dev/dri, GroupAdd=keep-groups, and UserNS=keep-id. Podman 5.8.10 compiled those to --device /dev/dri:/dev/dri, --group-add keep-groups, and --userns keep-id. The check host had no /dev/dri node, and Jellyfin was not started.',
		),
		showGeneratedExample: true,
		exampleLayout: 'stacked',
		technicalNotes: [
			'The loaded command is the repository Jellyfin template: ports 8096 and 8920, config and cache under /srv/jellyfin, a read-only /srv/media mount, --device /dev/dri:/dev/dri, --group-add keep-groups, --userns keep-id, and --user 1000:1000. Change 1000:1000 to the uid and gid from id on the host that owns the media.',
			'GroupAdd=keep-groups keeps the supplementary groups of the user running Podman. The user must already be in render and video, or the container still cannot open renderD128. AddDevice= passes the device node. It does not change group membership.',
			'SELinux private-Z on this page appends :Z to bind mounts that do not already have a label. That is correct for a Jellyfin-only config directory. If another container reads the same media tree, switch the select to shared-z so the label is :z. Never relabel /, /etc, or /usr.',
			'Jellyfin documents container_use_dri_devices for container-selinux 2.226 and newer. Older policies need the container label disabled. This template does not set privileged mode, and the converter only emits SecurityLabelDisable=true for privileged containers. NVIDIA CDI devices are a different setup and are not in this command.',
		],
		faqs: [
			{
				question: 'Which template does this page convert?',
				answer:
					'The built-in "Jellyfin Media Server (docker run)" template, the same one selected by default on the Docker Run to Quadlet page. Hardware flags were added to that template so both pages generate AddDevice=, GroupAdd=keep-groups, and UserNS=keep-id. There is no second Jellyfin sample.',
			},
			{
				question: 'Why is transcoding still software-only inside the container?',
				answer:
					'The unit can be correct while the host user is not in the render group, /dev/dri is missing, or SELinux still blocks device access. Check ls -l /dev/dri and id on the host. Then, on an enforcing system with a current container-selinux, set the container_use_dri_devices boolean. Jellyfin itself must be set to VAAPI or Quick Sync in its dashboard after the device is visible.',
			},
			{
				question: 'What does the SELinux select change on this page?',
				answer:
					'It rewrites Volume= lines. Private-Z is the page default, so config, cache, and the read-only media mount pick up :Z. Devices stay AddDevice=/dev/dri:/dev/dri with no :Z suffix. Switch to shared-z when the media path is mounted by more than one container.',
			},
			{
				question: 'Does this start Jellyfin at boot?',
				answer:
					'The generated unit has WantedBy=default.target because the scope is rootless. It still needs loginctl enable-linger for that user. The boot guide covers the linger checklist and the pasta network race, which also hits media servers.',
			},
		],
		guideSections: [
			{
				id: 'device-lines',
				eyebrow: 'From the loaded docker run',
				heading: '/dev/dri, keep-groups, and keep-id',
				paragraphs: [
					'Jellyfin hardware transcoding on Intel and AMD uses the render node under /dev/dri. The template passes the whole directory so renderD128 and the card node are both visible. The Quadlet keys are AddDevice=/dev/dri:/dev/dri, GroupAdd=keep-groups, and UserNS=keep-id next to User=1000:1000.',
					'keep-id maps the container user to the host uid you set. If the files under /srv/jellyfin and /srv/media are owned by a different uid, playback can start while transcode fails, or the server cannot write /config. Match User= to id -u and id -g, and make sure that account is in render and video before you rely on keep-groups.',
				],
				codes: [
					{
						title: 'Host checks before the first transcode',
						code: `id
ls -l /dev/dri
getent group render video
# uid and gid must match User= in the unit
# the user must be a member of render and video`,
					},
					{
						title: 'Lines the Jellyfin unit should contain',
						code: `[Container]
User=1000:1000
UserNS=keep-id
GroupAdd=keep-groups
AddDevice=/dev/dri:/dev/dri
Volume=/srv/jellyfin/config:/config:Z
Volume=/srv/jellyfin/cache:/cache:Z
Volume=/srv/media:/media:ro,Z`,
					},
				],
			},
			{
				id: 'selinux-dri',
				eyebrow: 'SELinux',
				heading: 'Device nodes and volume labels are different problems',
				paragraphs: [
					'A volume label does not grant access to /dev/dri. Jellyfin container install notes say that container-selinux 2.226 and later require the boolean container_use_dri_devices. On older policies the documented escape is to disable the container SELinux label. Prefer the boolean. This converter will not flip that host boolean for you, and the sample does not run privileged.',
					'The private :Z on /srv/media in the default output gives that tree an exclusive MCS category. A second container, such as a file sync sidecar, will then get permission denied. Change the workbench select to shared-z and export again if the library is shared. Leave config and cache private when you can, by splitting mounts into a second unit edit if one global select is too coarse.',
				],
				codes: [
					{
						title: 'SELinux boolean from the Jellyfin container docs',
						code: `sestatus
sudo setsebool -P container_use_dri_devices 1`,
					},
				],
				links: [
					{
						href: 'https://jellyfin.org/docs/general/installation/container/',
						label: 'Jellyfin container install notes for Podman and /dev/dri',
						external: true,
					},
					{
						href: '/docker-run-to-quadlet-converter/',
						label: 'Same Jellyfin template on the Docker Run converter',
					},
				],
			},
		],
		spotlightLinks: [
			{
				href: '/quadlet-not-starting-on-boot/',
				eyebrow: 'Boot',
				title: 'Jellyfin that only runs while you are logged in',
				summary:
					'Rootless WantedBy=default.target still needs loginctl enable-linger, or the server is down after reboot.',
			},
			{
				href: '/rootless-quadlet-selinux-volume-generator/',
				eyebrow: 'Labels',
				title: 'Choose :z or :Z before relabeling a media disk',
				summary:
					'The SELinux generator page is the longer reference for shared libraries and paths you must not relabel.',
			},
		],
	},
	{
		slug: 'quadlet-vs-docker-compose',
		path: '/quadlet-vs-docker-compose/',
		navLabel: 'vs Compose',
		h1: 'Quadlet vs Docker Compose',
		seoTitle: 'Quadlet vs Docker Compose | Side-by-Side Convert | QuadletGen',
		metaDescription:
			'Compare Quadlet vs Docker Compose on one Caddy and whoami stack. Convert it in the browser, then open the healthcheck, boot, Pi-hole, and Jellyfin guides.',
		primaryKeyword: 'quadlet vs docker compose',
		heroSummary:
			'Use Compose on the machine where you edit the stack every day. Use Quadlet on the machine that must come back after a reboot without a compose process. The workbench is loaded with one Caddy plus whoami stack so you can compare the YAML with the generated units and export them in one click.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'quadlet-vs-compose',
		defaultOptions: {
			stackName: 'edge',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: false,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: false,
		},
		provenanceNote: provenance(
			'The Caddy plus whoami sample dry-ran as proxy.container, api.container, edge.network, and caddy-data.volume. proxy.container kept After=api.service and Requires=api.service from the short depends_on list, which is service_started, so Notify=healthy was not added. The containers were not started.',
		),
		showGeneratedExample: true,
		exampleLayout: 'split',
		technicalNotes: [
			'The sample is two containers: caddy:2-alpine published on host port 8080, and traefik/whoami:v1.10 with no published port. A shared edge.network unit is how the proxy reaches http://api:80. Compose created that network implicitly. Quadlet does not, unless a .network file exists.',
			'Short-form depends_on is condition service_started. The proxy unit gets After=api.service and Requires=api.service and the api unit does not get Notify=healthy. If your real app must wait for a database healthcheck, use the healthcheck guide. Do not assume After= means healthy.',
			'The Caddyfile is a host file at /srv/edge/Caddyfile. Quadlet bind-mounts it. The converter does not embed the file contents. The file in the next section is the one that makes this particular stack answer on port 8080.',
			'Rootless install uses ~/.config/containers/systemd/ and WantedBy=default.target. That is the boot behavior people miss when they compare "compose up -d survived reboot" with a user Quadlet that has no linger. The boot guide is the checklist.',
		],
		faqs: [
			{
				question: 'Should I replace every Compose file with Quadlet?',
				answer:
					'No. Keep Compose where you rebuild often, run integration tests, or rely on profiles, extends, and one-shot init containers. Move a stack to Quadlet when it should start at boot under systemd, survive Podman upgrades without a generated shell script, and live in the same unit directory as the rest of the host.',
			},
			{
				question: 'What does this page convert that Compose was doing for free?',
				answer:
					'The implicit project network becomes edge.network. The named volume becomes caddy-data.volume. depends_on becomes After= and Requires=. restart becomes Restart= in [Service], and the rootless [Install] section uses WantedBy=default.target. Health-gated startup is not in this sample. It is on the healthcheck page.',
			},
			{
				question: 'How do I export the side-by-side stack?',
				answer:
					'The workbench is already on this stack. Download ZIP or copy a unit. Both stay in the browser and fire quadlet_export. Write the Caddyfile on the server yourself. It is not inside the ZIP.',
			},
			{
				question: 'Where are Pi-hole and Jellyfin in this comparison?',
				answer:
					'They are separate guides linked below. Pi-hole adds the port 53 sysctl problem. Jellyfin adds /dev/dri. Putting those into this proxy sample would hide the Compose mapping under unrelated host setup.',
			},
		],
		guideSections: [
			{
				id: 'decision',
				eyebrow: 'When to move',
				heading: 'Same stack, different job',
				paragraphs: [
					'Compose is a project runner. One command builds the network, waits on healthchecks, and tears the project down. Quadlet is a set of systemd units. Boot, logs, and restart policy belong to the user or system manager, which is what you want on a server and what you do not want while editing a Caddyfile every few minutes.',
					'Convert this stack when the proxy should start at boot and you are ready to own linger, the Caddyfile on disk, and daemon-reload. Stay on Compose when you still need service_completed_successfully init jobs or a depends_on condition this unit file cannot express yet. The healthcheck page covers service_healthy. service_completed_successfully stays a hand edit.',
				],
				bullets: [
					'Development laptop, frequent edits: Compose.',
					'Home server or VPS that reboots unattended: Quadlet, rootless with linger, or rootful if you need privileged ports without a sysctl.',
					'App must not start until Postgres answers: add Notify=healthy using the healthcheck guide. This proxy sample does not.',
					'GPU transcode or DNS on port 53: use the Jellyfin and Pi-hole guides after the units exist. The mapping is the same converter.',
				],
			},
			{
				id: 'caddyfile',
				eyebrow: 'Host file, not a unit',
				heading: 'Caddyfile the bind mount expects',
				paragraphs: [
					'Save this file on the server at /srv/edge/Caddyfile before starting proxy.service. whoami listens on port 80 inside the api container. The shared network name is edge, and the container name api is the DNS name. Host port 8080 reaches Caddy, which proxies to api:80.',
				],
				codes: [
					{
						title: '/srv/edge/Caddyfile',
						code: `:80 {
	reverse_proxy api:80
}`,
					},
					{
						title: 'Rootless install of the ZIP from this page',
						code: `install -d "$HOME/.config/containers/systemd" /srv/edge
# copy the Caddyfile to /srv/edge/Caddyfile first
unzip -d "$HOME/.config/containers/systemd" edge-quadlet.zip
systemctl --user daemon-reload
systemctl --user start proxy.service
curl -fsS http://127.0.0.1:8080/`,
					},
				],
			},
		],
		spotlightLinks: [
			{
				href: '/quadlet-depends-on-healthcheck/',
				eyebrow: 'Health',
				title: 'Quadlet depends_on healthcheck',
				summary:
					'Add Notify=healthy when a database must pass pg_isready before the app starts. This proxy sample only waits for service_started.',
			},
			{
				href: '/quadlet-not-starting-on-boot/',
				eyebrow: 'Boot',
				title: 'Quadlet not starting on boot',
				summary:
					'Rootless units need WantedBy=default.target and loginctl enable-linger, or the server is quiet after reboot.',
			},
			{
				href: '/podman-pihole-quadlet/',
				eyebrow: 'DNS',
				title: 'Podman Pi-hole Quadlet',
				summary:
					'A rootless DNS server on port 53, including ip_unprivileged_port_start and listening mode ALL.',
			},
			{
				href: '/jellyfin-podman-quadlet/',
				eyebrow: 'Media',
				title: 'Jellyfin Podman Quadlet',
				summary:
					'The existing Jellyfin docker run template, plus /dev/dri, keep-groups, and SELinux notes for transcoding.',
			},
		],
	},
	{
		slug: 'podman-quadlet-secrets-management',
		path: '/podman-quadlet-secrets-management/',
		navLabel: 'Secrets Management',
		h1: 'Podman Quadlet Secrets Management and Encryption',
		seoTitle: 'Podman Quadlet Secrets Guide & Unit Generator | QuadletGen',
		metaDescription:
			'Configure Podman Quadlet Secret directives, encrypted credential storage, and environment variable mounts without exposing plaintext passwords in unit files.',
		primaryKeyword: 'podman quadlet secret',
		heroSummary:
			'Manage production container credentials securely using Podman Quadlet Secret directives. Map Compose secrets into Podman encrypted secret stores, configure Secret= mount and env targets, and eliminate plaintext passwords from systemd units.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'quadlet-secrets',
		defaultOptions: {
			stackName: 'securestack',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: false,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: true,
		},
		provenanceNote: provenance(
			'Verified Secret directive syntax against Podman 5.8.10 specification for both type=mount and type=env targets in rootless user session storage.',
		),
		showGeneratedExample: true,
		exampleLayout: 'split',
		technicalNotes: [
			'Podman provides podman secret create to store sensitive values in an encrypted local database rather than cleartext files.',
			'Quadlet supports Secret= directives under [Container] with type=mount (mounting a file under /run/secrets/) or type=env (injecting as an environment variable).',
			'Unlike EnvironmentFile= which reads a plaintext file on disk, Secret= pulls decrypted data in memory only when the container starts.',
			'Rootless secrets live inside the user session storage under ~/.local/share/containers/storage/secrets/ and cannot be read by other unprivileged users.',
		],
		faqs: [
			{
				question: 'How does Secret= differ from EnvironmentFile=?',
				answer:
					'EnvironmentFile= reads a plaintext key-value file stored on the host filesystem. Secret= references an encrypted payload stored in Podman internal secret engine, injecting values into memory at runtime without creating unencrypted disk artifacts.',
			},
			{
				question: 'How do I create a secret for Podman Quadlet on Linux?',
				answer:
					'Run printf "my-password" | podman secret create db_password - on the target host. For rootless units, execute the command without sudo so the secret is stored in your user storage database.',
			},
			{
				question: 'Where does Podman mount secrets inside the container by default?',
				answer:
					'When using type=mount (or omitting type), Podman mounts the secret file under /run/secrets/<secret_name> inside the container namespace. Many official images like Postgres support reading passwords from files using POSTGRES_PASSWORD_FILE.',
			},
			{
				question: 'Can a single secret be shared across multiple Quadlet container units?',
				answer:
					'Yes. Any container unit running under the same user session can reference the same secret name in its Secret= directive. Both an API service and a database service can read the same credential.',
			},
		],
		guideSections: [
			{
				id: 'secrets-architecture',
				eyebrow: 'Security Architecture',
				heading: 'Why Hardcoded Passwords in systemd Units Create Security Debt',
				paragraphs: [
					'Storing plaintext passwords directly inside systemd unit files (such as Environment=POSTGRES_PASSWORD=secret) creates operational risks. Systemd unit files are frequently checked into Git repositories, mirrored across Ansible playbooks, and readable by any process inspecting systemctl show output.',
					'Podman Quadlet supports native integration with the Podman secrets manager. By utilizing Secret= directives, sensitive values stay encrypted in local host storage and are presented to the container process only while active.',
				],
				bullets: [
					'Keeps sensitive database passwords and API tokens out of version control systems.',
					'Supports both file-based (/run/secrets/) and environment variable injection methods.',
					'Isolates secrets per Linux user account in rootless mode.',
				],
			},
			{
				id: 'podman-secret-cli-workflow',
				eyebrow: 'Credential Provisioning',
				heading: 'Creating and Managing Podman Secrets with the CLI',
				paragraphs: [
					'Before starting a Quadlet unit that references a secret, the secret must be provisioned in the local Podman database. Administrators create secrets via standard input or from local files.',
				],
				codes: [
					{
						title: 'Provisioning rootless secrets via CLI',
						code: `# Create secret from piped input
printf "super-secret-password" | podman secret create db_password -

# List existing secrets
podman secret ls

# Inspect secret metadata without revealing payload
podman secret inspect db_password`,
					},
				],
			},
			{
				id: 'secret-directive-syntax',
				eyebrow: 'Syntax Reference',
				heading: 'Mount vs Environment Secret Injection in Quadlet',
				paragraphs: [
					'Quadlet supports two primary modes for secret consumption inside the [Container] section: file mounts and environment variables.',
					'The mount syntax Secret=db_password,target=my_secret mounts the plaintext value as a tmpfs file under /run/secrets/my_secret. The environment syntax Secret=db_password,type=env,target=DATABASE_PASSWORD exposes the secret value directly as an environment variable to the container process.',
				],
				codes: [
					{
						title: 'Quadlet Secret directive examples',
						code: `[Container]
Image=docker.io/library/postgres:16-alpine
# Mount secret as file under /run/secrets/db_password
Secret=db_password,type=mount,target=/run/secrets/db_password

# Inject secret as an environment variable
Secret=api_token,type=env,target=SERVICE_API_TOKEN`,
					},
				],
			},
		],
		spotlightLinks: [
			{
				href: '/quadlet-depends-on-healthcheck/',
				eyebrow: 'Health',
				title: 'Quadlet depends_on healthcheck',
				summary:
					'Pair secure database credentials with Notify=healthy so web apps wait for database availability.',
			},
			{
				href: '/rootless-quadlet-selinux-volume-generator/',
				eyebrow: 'SELinux',
				title: 'Rootless Quadlet SELinux Volume Generator',
				summary:
					'Ensure database storage mounts carry private :Z flags alongside secret credential management.',
			},
		],
	},
	{
		slug: 'debug-podman-quadlet-systemd-errors',
		path: '/debug-podman-quadlet-systemd-errors/',
		navLabel: 'Debug Systemd Errors',
		h1: 'Debugging Podman Quadlet systemd Unit Errors and Failures',
		seoTitle: 'Debug Podman Quadlet systemd Errors | Diagnostic Guide',
		metaDescription:
			'Troubleshoot Podman Quadlet errors, generator syntax failures, systemctl reload warnings, and journalctl container crash logs step by step.',
		primaryKeyword: 'how to debug podman quadlet',
		heroSummary:
			'Diagnose and resolve Podman Quadlet systemd unit errors across every stage of the lifecycle. Follow a structured 5-level troubleshooting tree from quadlet -dryrun syntax validation to journalctl log inspection and SELinux denial analysis.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'debug-quadlet',
		defaultOptions: {
			stackName: 'troubleshoot',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: false,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: false,
		},
		provenanceNote: provenance(
			'Tested dryrun diagnostics with /usr/libexec/podman/quadlet -dryrun -user on Podman 5.8.10 under Fedora and Debian user sessions.',
		),
		showGeneratedExample: true,
		exampleLayout: 'stacked',
		technicalNotes: [
			'Running /usr/libexec/podman/quadlet -dryrun -user prints the compiled systemd service definition and flags any unrecognized directives without touching systemd.',
			'Compiled transient units are written into /run/user/$UID/systemd/generator/ and can be directly inspected for syntax and parameter mapping.',
			'When a unit fails to start, journalctl --user -xeu <unit>.service reveals conmon exit codes, image pull failures, and port conflict errors.',
			'SELinux Access Vector Cache (AVC) denials show up in ausearch -m avc -ts recent when host bind mounts lack required :z or :Z attributes.',
		],
		faqs: [
			{
				question: 'What does Unit not found mean after placing files in ~/.config/containers/systemd/?',
				answer:
					'Systemd has not compiled your Quadlet files into transient services yet. Run systemctl --user daemon-reload to invoke podman-system-generator. If it still fails, check file extensions (.container, not .service) and directory permissions.',
			},
			{
				question: 'Where do compiled Quadlet service files live on the host filesystem?',
				answer:
					'For rootless units, transient generated files live in /run/user/$UID/systemd/generator/. For rootful units, they live in /run/systemd/generator/. You can cat these files to inspect the exact ExecStart podman run command.',
			},
			{
				question: 'How can I test if a Quadlet file has valid syntax without restarting containers?',
				answer:
					'Run /usr/libexec/podman/quadlet -dryrun -user (or locate quadlet binary on your distro). It validates syntax, checks referenced files, and prints the generated service definition without restarting running containers.',
			},
			{
				question: 'Why does journalctl show conmon exiting with status 125 or 127?',
				answer:
					'Exit code 125 indicates a container engine configuration failure, such as an invalid flag, non-existent image, or already bound port. Exit code 127 indicates that the executable specified in Exec= or Entrypoint= was not found inside the container image.',
			},
		],
		guideSections: [
			{
				id: 'troubleshooting-tree',
				eyebrow: 'Diagnostic Tree',
				heading: 'The 5-Level Quadlet Troubleshooting Process',
				paragraphs: [
					'When a container fails to run under Quadlet, determining whether the issue stems from YAML parsing, Quadlet generator syntax, systemd execution, or container runtime failure is essential.',
					'Follow this 5-level sequence: Level 1 validates unit syntax with quadlet -dryrun; Level 2 inspects generator output in /run/user/$UID/systemd/generator/; Level 3 checks systemctl status and daemon-reload output; Level 4 examines journalctl container runtime logs; Level 5 investigates SELinux denials using ausearch.',
				],
				bullets: [
					'Level 1: Syntax preflight (quadlet -dryrun -user).',
					'Level 2: Transient compilation check (/run/user/$UID/systemd/generator/).',
					'Level 3: Unit registration (systemctl --user daemon-reload).',
					'Level 4: Runtime output and crash analysis (journalctl --user -xeu <unit>).',
					'Level 5: Host security denials (ausearch -m avc -ts recent).',
				],
			},
			{
				id: 'dryrun-and-transient-inspection',
				eyebrow: 'Generator Inspection',
				heading: 'Using quadlet -dryrun and Inspecting Transient Output',
				paragraphs: [
					'The podman-system-generator binary can be invoked manually in dry-run mode. This command parses all files in ~/.config/containers/systemd/ and outputs the compiled systemd units to stdout.',
				],
				codes: [
					{
						title: 'Validating Quadlet units with dryrun',
						code: `/usr/libexec/podman/quadlet -dryrun -user`,
					},
					{
						title: 'Inspecting compiled systemd service units',
						code: `cat /run/user/$(id -u)/systemd/generator/troubleshoot-web.service`,
					},
				],
			},
			{
				id: 'common-exit-codes',
				eyebrow: 'Runtime Failures',
				heading: 'Deciphering conmon Exit Codes and Port Conflicts',
				paragraphs: [
					'If systemctl status reports status=failed with an exit code, conmon captured an error during container execution. Exit 125 means Podman could not initialize the container (e.g. port already bound by another process or invalid volume path). Exit 137 indicates the container was terminated by the OOM killer due to exceeding memory limits.',
				],
			},
		],
		spotlightLinks: [
			{
				href: '/quadlet-not-starting-on-boot/',
				eyebrow: 'Boot Issues',
				title: 'Quadlet not starting on boot',
				summary:
					'Resolve user lingering and default.target configuration when services fail to start after reboot.',
			},
			{
				href: '/about/',
				eyebrow: 'Methodology',
				title: 'QuadletGen Architecture and Dry-Run Guide',
				summary:
					'Review how QuadletGen synthesizes unit files and aligns with upstream Podman generator specifications.',
			},
		],
	},
	{
		slug: 'traefik-podman-quadlet-reverse-proxy',
		path: '/traefik-podman-quadlet-reverse-proxy/',
		navLabel: 'Traefik Reverse Proxy',
		h1: 'Traefik v3 Reverse Proxy on Rootless Podman Quadlet',
		seoTitle: 'Traefik Podman Quadlet Reverse Proxy Guide | QuadletGen',
		metaDescription:
			'Deploy Traefik v3 reverse proxy on rootless Podman Quadlet with socket activation, Let\'s Encrypt SSL, and dynamic service discovery.',
		primaryKeyword: 'traefik podman quadlet',
		heroSummary:
			'Deploy a production Traefik v3 reverse proxy using rootless Podman Quadlet units. Resolve rootless podman.sock permission issues, configure automatic Let\'s Encrypt certificates, and enable dynamic container routing without running Docker.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'traefik-proxy',
		defaultOptions: {
			stackName: 'traefik',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: true,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: false,
		},
		provenanceNote: provenance(
			'Tested Traefik v3.1 socket connectivity with systemctl --user enable --now podman.socket on Podman 5.8.10.',
		),
		showGeneratedExample: true,
		exampleLayout: 'stacked',
		technicalNotes: [
			'Rootless Podman provides a user socket at /run/user/$UID/podman/podman.sock managed via systemctl --user enable --now podman.socket.',
			'Traefik connects to the Podman socket via docker.endpoint=unix:///run/podman/podman.sock when mapped into the Traefik container.',
			'Setting SecurityLabelDisable=true on the Traefik unit prevents SELinux from blocking access to the user-mode Podman API socket.',
			'Binding low ports 80 and 443 in rootless mode requires configuring net.ipv4.ip_unprivileged_port_start=80 via sysctl.',
		],
		faqs: [
			{
				question: 'How does Traefik connect to the rootless Podman socket?',
				answer:
					'Enable the user socket with systemctl --user enable --now podman.socket, then bind mount /run/user/$UID/podman/podman.sock:/var/run/docker.sock into Traefik. In Traefik configuration, set providers.docker.endpoint to unix:///var/run/docker.sock.',
			},
			{
				question: 'Why does Traefik fail with permission denied on podman.sock?',
				answer:
					'On SELinux enforcing systems, container processes cannot access host sockets by default. Add SecurityLabelDisable=true under [Container] in traefik.container to disable container label confinement for the proxy.',
			},
			{
				question: 'How does Traefik discover other Quadlet containers dynamically?',
				answer:
					'When downstream Quadlet units include Label="traefik.enable=true" and routing labels, Traefik reads those labels via the Podman socket API and dynamically creates HTTP routers and services.',
			},
			{
				question: 'Can Traefik manage Let\'s Encrypt certificates when running in rootless Quadlet?',
				answer:
					'Yes. Mount a persistent volume to /letsencrypt inside the Traefik container to store acme.json. Ensure file permissions on acme.json are chmod 600.',
			},
		],
		guideSections: [
			{
				id: 'traefik-podman-architecture',
				eyebrow: 'Reverse Proxy Architecture',
				heading: 'How Traefik Interfaces with Rootless Podman Socket',
				paragraphs: [
					'Traefik uses a Docker provider to discover running containers and build dynamic routing tables. Because Podman implements the Docker-compatible API, Traefik functions seamlessly with Podman when connected to the Podman socket.',
					'In rootless mode, each user has a dedicated Podman API socket at /run/user/$UID/podman/podman.sock. Enabling systemctl --user enable --now podman.socket activates the socket listener, which spawns the API service on demand.',
				],
			},
			{
				id: 'socket-activation-and-selinux',
				eyebrow: 'Permissions & Socket',
				heading: 'Activating podman.socket and Disabling SELinux Socket Labeling',
				paragraphs: [
					'Binding the user socket into a container requires special consideration for SELinux. If SELinux confinement is active, the container cannot communicate over the Unix domain socket.',
					'Adding SecurityLabelDisable=true to traefik.container allows Traefik to read container metadata without triggering AVC security denials.',
				],
				codes: [
					{
						title: 'Enabling rootless Podman socket',
						code: `systemctl --user enable --now podman.socket
ls -la /run/user/$(id -u)/podman/podman.sock`,
					},
					{
						title: 'Traefik Quadlet unit socket configuration',
						code: `[Container]
Image=docker.io/library/traefik:v3.1
Volume=/run/user/1000/podman/podman.sock:/var/run/docker.sock
SecurityLabelDisable=true`,
					},
				],
			},
			{
				id: 'dynamic-routing-labels',
				eyebrow: 'Service Discovery',
				heading: 'Configuring Traefik Labels in Downstream Quadlet Units',
				paragraphs: [
					'To route incoming web traffic to an application container, declare Traefik labels in the application .container unit file using Label= directives.',
				],
				codes: [
					{
						title: 'Downstream container Traefik labels',
						code: `[Container]
Image=docker.io/library/node:22-alpine
Network=traefik.network
Label=traefik.enable=true
Label=traefik.http.routers.app.rule=Host("app.example.com")
Label=traefik.http.services.app.loadbalancer.server.port=3000`,
					},
				],
			},
		],
		spotlightLinks: [
			{
				href: '/immich-nextcloud-vaultwarden-quadlet-templates/',
				eyebrow: 'Templates',
				title: 'Self-Hosted Quadlet Templates',
				summary:
					'Deploy upstream applications behind your Traefik reverse proxy using shared networks.',
			},
			{
				href: '/podman-pihole-quadlet/',
				eyebrow: 'DNS Routing',
				title: 'Podman Pi-hole Quadlet',
				summary:
					'Pair Traefik reverse proxy routing with local Pi-hole DNS overrides for homelab domains.',
			},
		],
	},
	{
		slug: 'rootless-podman-quadlet-permissions-keep-id',
		path: '/rootless-podman-quadlet-permissions-keep-id/',
		navLabel: 'UID Mapping & keep-id',
		h1: 'Rootless Podman Quadlet Permissions, UserNS, and keep-id',
		seoTitle: 'Rootless Podman Quadlet Permissions & keep-id | QuadletGen',
		metaDescription:
			'Fix rootless Podman Quadlet volume permission denied errors using UserNS=keep-id, /etc/subuid mappings, and host UID/GID alignment.',
		primaryKeyword: 'rootless podman userns keep-id quadlet',
		heroSummary:
			'Master user namespace mappings and file permissions in rootless Podman Quadlet containers. Eliminate permission denied errors on host bind mounts using UserNS=keep-id, understand /etc/subuid allocation, and match host and container user IDs.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'rootless-permissions',
		defaultOptions: {
			stackName: 'appstack',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: false,
			generateSharedNetwork: false,
			extractSecretsToEnvFile: false,
		},
		provenanceNote: provenance(
			'Tested UserNS=keep-id and keep-id:uid=1000,gid=1000 mappings on Podman 5.8.10 with subuid allocations.',
		),
		showGeneratedExample: true,
		exampleLayout: 'split',
		technicalNotes: [
			'In rootless Podman, your host user (e.g. UID 1000) maps to container UID 0 by default, while subordinate IDs in /etc/subuid map higher container UIDs.',
			'Setting UserNS=keep-id ensures that host UID 1000 maps directly to container UID 1000, allowing non-root container processes to read and write host files.',
			'Podman 4.5+ supports UserNS=keep-id:uid=UID,gid=GID to map your host user to any specific container UID, such as 999 for Postgres or 10001 for Node.',
			'When container processes write files without keep-id, files on the host appear owned by subordinate IDs (e.g. 100999) rather than your login user.',
		],
		faqs: [
			{
				question: 'Why does my container fail with Permission Denied on a host directory?',
				answer:
					'In rootless mode, container processes running as non-root (such as UID 1000 or UID 999) map to subordinate host UIDs allocated in /etc/subuid (e.g. UID 100999). If the host directory is owned by UID 1000, the container process lacks write permission.',
			},
			{
				question: 'What does UserNS=keep-id do in a Quadlet .container unit?',
				answer:
					'UserNS=keep-id maps your host user ID directly to the same user ID inside the container user namespace. If your host user is UID 1000, container UID 1000 corresponds to your host user.',
			},
			{
				question: 'How do I map my host UID to a specific non-root user like postgres (UID 999)?',
				answer:
					'Use UserNS=keep-id:uid=999,gid=999 in the [Container] section. This maps your host user to container UID 999, so Postgres can read and write files owned by your host user without permission errors.',
			},
			{
				question: 'How does podman unshare help inspect and fix file ownership?',
				answer:
					'Running podman unshare opens a shell inside the user namespace. Inside this shell, your host user appears as root (UID 0), allowing you to chown files to subordinate container UIDs directly.',
			},
		],
		guideSections: [
			{
				id: 'userns-fundamentals',
				eyebrow: 'User Namespaces',
				heading: 'How Subordinate UIDs Work in Rootless Podman',
				paragraphs: [
					'Linux user namespaces provide security by running container processes without root privileges on the host. When an unprivileged user (UID 1000) launches Podman, the host kernel maps UID 1000 to container UID 0 (root inside the container).',
					'Additional container UIDs are mapped to subordinate IDs defined in /etc/subuid (for example, 65,536 IDs starting at 100000). Consequently, a process inside the container running as UID 1000 appears on the host as UID 100999.',
				],
			},
			{
				id: 'keep-id-deep-dive',
				eyebrow: 'UID Alignment',
				heading: 'Using UserNS=keep-id for Seamless Host Volume Access',
				paragraphs: [
					'When mounting host directories into containers, UID mismatches cause permission denied errors. Setting UserNS=keep-id alters the mapping so host UID 1000 becomes container UID 1000.',
					'In modern Podman (version 4.5 and newer), you can specify custom target IDs like UserNS=keep-id:uid=999,gid=999. This allows database engines like PostgreSQL or MariaDB that run as UID 999 to write directly to directories owned by your host user.',
				],
				codes: [
					{
						title: 'Quadlet keep-id configuration options',
						code: `[Container]
Image=docker.io/library/node:22-alpine
User=1000:1000
UserNS=keep-id
Volume=./data:/srv/app/data`,
					},
					{
						title: 'Mapping host user to custom container UID',
						code: `[Container]
Image=docker.io/library/postgres:16-alpine
UserNS=keep-id:uid=999,gid=999
Volume=/srv/postgres/data:/var/lib/postgresql/data`,
					},
				],
			},
			{
				id: 'podman-unshare-remediation',
				eyebrow: 'Permission Remediation',
				heading: 'Fixing Existing Directory Permissions with podman unshare',
				paragraphs: [
					'If a directory was created without keep-id, files may be owned by subordinate IDs that your regular host user cannot modify. Use podman unshare to modify permissions within the container namespace.',
				],
				codes: [
					{
						title: 'Remediating file ownership with podman unshare',
						code: `# Enter user namespace and chown directory
podman unshare chown -R 1000:1000 /srv/app/data
podman unshare chmod -R u+rwX /srv/app/data`,
					},
				],
			},
		],
		spotlightLinks: [
			{
				href: '/rootless-quadlet-selinux-volume-generator/',
				eyebrow: 'SELinux Volumes',
				title: 'Rootless Quadlet SELinux Volume Generator',
				summary:
					'Combine user namespace UID alignment with SELinux :z and :Z mount labeling.',
			},
			{
				href: '/quadlet-not-starting-on-boot/',
				eyebrow: 'Session Persistence',
				title: 'Quadlet not starting on boot',
				summary:
					'Ensure rootless user systemd sessions persist after host reboots using loginctl linger.',
			},
		],
	},
	{
		slug: 'systemd-quadlet-resource-limits-hardening',
		path: '/systemd-quadlet-resource-limits-hardening/',
		navLabel: 'Resource Limits & Hardening',
		h1: 'Podman Quadlet Resource Limits and systemd Service Hardening',
		seoTitle: 'Podman Quadlet Resource Limits & Hardening | QuadletGen',
		metaDescription:
			'Apply systemd cgroup v2 resource limits, CPUQuota, MemoryMax, and Linux security sandboxing directives to Podman Quadlet containers.',
		primaryKeyword: 'podman quadlet memory limit',
		heroSummary:
			'Enforce granular resource boundaries and enterprise security sandboxing on Podman Quadlet containers. Configure systemd cgroup v2 directives like MemoryMax and CPUQuota alongside Linux isolation flags to protect the host system.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'systemd-hardening',
		defaultOptions: {
			stackName: 'hardened',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: false,
			generateSharedNetwork: false,
			extractSecretsToEnvFile: false,
		},
		provenanceNote: provenance(
			'Verified systemd cgroup v2 resource limits and sandboxing directives on Podman 5.8.10 with systemd 256.',
		),
		showGeneratedExample: true,
		exampleLayout: 'split',
		technicalNotes: [
			'Quadlet units can include standard systemd [Service] directives such as MemoryMax=, MemoryHigh=, and CPUQuota= enforced via cgroup v2.',
			'Setting MemoryHigh= provides proactive throttling and memory reclamation before the systemd OOM killer terminates the container on MemoryMax=.',
			'Security directives like NoNewPrivileges=true, ProtectSystem=strict, and ProtectHome=read-only prevent escaped processes from altering the host.',
			'Rootless containers enforce limits inside user-delegated cgroup controllers enabled via systemd user slice management.',
		],
		faqs: [
			{
				question: 'How do I limit container memory usage in a Quadlet unit?',
				answer:
					'Add MemoryMax=2G under the [Service] section in your .container unit. Systemd cgroup v2 enforces this ceiling. You can also add MemoryHigh=1.8G to trigger page cache throttling before hard limits.',
			},
			{
				question: 'What happens when a Quadlet container exceeds MemoryMax=?',
				answer:
					'The systemd cgroup v2 out-of-memory killer terminates processes inside the container slice. The unit transitions to a failed state and restarts automatically if [Service] Restart=always is configured.',
			},
			{
				question: 'Can I limit CPU cores or percentage using systemd directives?',
				answer:
					'Yes. Add CPUQuota=150% under [Service] to limit the container to 1.5 CPU cores of compute time. You can also set CPUWeight= to establish fair-share CPU distribution during peak contention.',
			},
			{
				question: 'Which systemd security hardening directives are compatible with Quadlet?',
				answer:
					'Directives such as NoNewPrivileges=true, ProtectSystem=strict, ProtectHome=read-only, PrivateTmp=true, and CapabilityBoundingSet= work cleanly in Quadlet units, creating defense-in-depth isolation.',
			},
		],
		guideSections: [
			{
				id: 'cgroupv2-resource-management',
				eyebrow: 'cgroup v2 Architecture',
				heading: 'Enforcing Memory and CPU Limits via systemd [Service] Directives',
				paragraphs: [
					'Unlike Docker which enforces resource limits through container runtime CLI flags, Podman Quadlet leverages Linux systemd native cgroup v2 tree directly. Because each Quadlet container is a systemd service, all standard [Service] resource control directives apply.',
					'Setting MemoryMax=2G establishes a hard ceiling on memory consumption. CPUQuota=200% restricts the container to a maximum of two CPU cores across all worker threads, preventing runaway workloads from degrading neighboring services.',
				],
				codes: [
					{
						title: 'Resource limits under [Service] section',
						code: `[Service]
Restart=always
MemoryHigh=1800M
MemoryMax=2G
CPUQuota=150%
TasksMax=500`,
					},
				],
			},
			{
				id: 'oom-killer-prevention',
				eyebrow: 'Stability & OOM',
				heading: 'Using MemoryHigh to Prevent Abrupt OOM-Killer Terminations',
				paragraphs: [
					'A major advantage of systemd cgroup v2 is two-stage memory throttling. If you only specify MemoryMax=, crossing the threshold triggers an immediate SIGKILL by the Linux OOM killer.',
					'By defining MemoryHigh= below MemoryMax= (e.g. MemoryHigh=1800M with MemoryMax=2G), systemd proactively throttles the container processes and aggressively reclaims page cache memory, preventing unexpected service crashes.',
				],
			},
			{
				id: 'security-sandboxing-directives',
				eyebrow: 'Host Defense',
				heading: 'Sandboxing Containers with NoNewPrivileges and ProtectSystem',
				paragraphs: [
					'Quadlet units can include systemd security directives to enforce defense-in-depth isolation. Even if a vulnerability exists in the container payload, systemd restrictions prevent escalation.',
				],
				bullets: [
					'NoNewPrivileges=true: Blocks setuid and setgid privilege escalation.',
					'ProtectSystem=strict: Mounts /usr, /boot, /etc as read-only for the service.',
					'ProtectHome=read-only: Prevents the container from writing to user home directories.',
					'PrivateTmp=true: Isolates /tmp and /var/tmp in a private namespace.',
				],
			},
		],
		spotlightLinks: [
			{
				href: '/podman-quadlet-generator/',
				eyebrow: 'Core Generator',
				title: 'Podman Quadlet Generator',
				summary:
					'Generate foundational unit structures with AutoUpdate and restart supervision.',
			},
			{
				href: '/docker-compose-to-podman-quadlet-migration-guide/',
				eyebrow: 'Migration',
				title: 'Docker Compose to Quadlet Migration Guide',
				summary:
					'Migrate enterprise Docker Compose resource limits into native systemd cgroups.',
			},
		],
	},
	{
		slug: 'docker-compose-to-podman-quadlet-migration-guide',
		path: '/docker-compose-to-podman-quadlet-migration-guide/',
		navLabel: 'Migration Playbook',
		h1: 'Docker Compose to Podman Quadlet Production Migration Guide',
		seoTitle: 'Docker Compose to Podman Quadlet Migration Guide | QuadletGen',
		metaDescription:
			'Step-by-step production migration playbook from Docker Compose to Podman Quadlet: volume tar exports, network migration, and systemd automation.',
		primaryKeyword: 'docker compose to podman quadlet migration',
		heroSummary:
			'Execute a smooth, zero-downtime migration from Docker Compose to Podman Quadlet systemd units. Learn how to export Docker named volumes into Podman storage, adapt restart policies into systemd targets, and automate deployments with Ansible.',
		defaultInputMode: 'compose-yaml',
		defaultTemplateId: 'migration-guide',
		defaultOptions: {
			stackName: 'production',
			installScope: 'rootless',
			selinuxMode: 'none',
			enableAutoUpdate: true,
			generateSharedNetwork: true,
			extractSecretsToEnvFile: true,
		},
		provenanceNote: provenance(
			'Tested volume tar export and import pipelines between Docker 27 and Podman 5.8.10 with Quadlet unit synthesis.',
		),
		showGeneratedExample: true,
		exampleLayout: 'stacked',
		technicalNotes: [
			'Migrating from Docker to Podman eliminates the single point of failure represented by the central dockerd root daemon.',
			'Docker named volumes can be exported via docker run --rm -v name:/data alpine tar czf - -C /data . | podman volume import name - to preserve data.',
			'Docker Compose restart: always becomes systemd [Service] Restart=always and [Install] WantedBy=default.target under systemd management.',
			'Ansible provides the official containers.podman.quadlet module to template and deploy Quadlet unit files across server fleets.',
		],
		faqs: [
			{
				question: 'How do I migrate data from Docker named volumes into Podman volumes?',
				answer:
					'Stop the Docker service to prevent writes, then pipe a tar stream between Docker and Podman: docker run --rm -v myvolume:/data alpine tar czf - -C /data . | podman volume import myvolume -. This preserves permissions and file timestamps.',
			},
			{
				question: 'What is the recommended strategy for migrating a multi-container stack with minimal downtime?',
				answer:
					'Generate Quadlet units in advance using QuadletGen, test them on a staging host with /usr/libexec/podman/quadlet -dryrun, transfer volume snapshots, stop the Compose stack with docker compose down, reload systemd, and start the units.',
			},
			{
				question: 'How does Quadlet handle Compose environment variable substitution?',
				answer:
					'Quadlet unit files do not evaluate shell variables like ${PORT:-8080} dynamically. QuadletGen resolves default values during conversion and writes fixed values or moves secrets to an .env file referenced via EnvironmentFile=.',
			},
			{
				question: 'How do I manage and update Quadlet units across multiple servers automatically?',
				answer:
					'Use Ansible with the containers.podman.quadlet module or manage unit files in a Git repository deployed with systemd timers or CI/CD pipelines via SSH.',
			},
		],
		guideSections: [
			{
				id: 'daemonless-paradigm-shift',
				eyebrow: 'Architectural Comparison',
				heading: 'Why Enterprises Migrate from Docker Compose to Podman Quadlet',
				paragraphs: [
					'Docker Compose was designed as a developer convenience tool for running multi-container stacks against a local Docker engine. In production Linux environments, running services under a root daemon introduces maintenance friction during daemon upgrades and conflicts with systemd init systems.',
					'Podman Quadlet bridges this gap by translating declarative container specifications into native systemd units. Each container runs as an independent Linux system service with native logging, resource quotas, and boot management.',
				],
				bullets: [
					'No daemon restarts disrupting all running containers.',
					'Native integration with systemctl status, stop, start, and journalctl.',
					'Rootless security model preventing container escapes from gaining root host privileges.',
				],
			},
			{
				id: 'step-by-step-data-migration',
				eyebrow: 'Volume Migration',
				heading: 'Exporting Docker Named Volumes and Importing into Podman',
				paragraphs: [
					'State preservation is the most critical phase of migration. Host bind mounts can simply be repointed to the new unit paths. Named Docker volumes, however, reside in /var/lib/docker/volumes/ and must be exported cleanly.',
				],
				codes: [
					{
						title: 'Streaming Docker volume data into Podman',
						code: `# Stop Docker stack to ensure data consistency
docker compose stop

# Pipe tar archive directly from Docker to Podman
docker run --rm -v myapp_data:/source:ro alpine tar -C /source -czf - . | \\
  podman volume import myapp_data -

# Verify imported Podman volume contents
podman volume ls
podman run --rm -v myapp_data:/data:ro alpine ls -la /data`,
					},
				],
			},
			{
				id: 'ansible-and-gitops-automation',
				eyebrow: 'Fleet Automation',
				heading: 'Automating Quadlet Deployments with Ansible and GitOps',
				paragraphs: [
					'Because Quadlet files are simple text files, they integrate cleanly into GitOps workflows. The containers.podman Ansible collection includes dedicated modules for deploying Quadlet units and triggering daemon-reload across entire server fleets.',
				],
				codes: [
					{
						title: 'Ansible task for deploying Quadlet units',
						code: `- name: Deploy Quadlet container unit
  containers.podman.podman_quadlet:
    state: present
    name: webapp
    unit_type: container
    scope: user
    src: templates/webapp.container.j2`,
					},
				],
			},
		],
		spotlightLinks: [
			{
				href: '/quadlet-vs-docker-compose/',
				eyebrow: 'Comparison',
				title: 'Quadlet vs Docker Compose Comparison',
				summary:
					'Review side-by-side directive mappings and syntax contrasts for production workloads.',
			},
			{
				href: '/podlet-online-multi-container-network-packager/',
				eyebrow: 'Packager',
				title: 'Podlet Online Multi-Container Packager',
				summary:
					'Package your migrated Compose stack into a downloadable systemd deployment ZIP.',
			},
		],
	},
];
