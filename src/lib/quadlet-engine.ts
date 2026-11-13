import { parse } from 'yaml';
import type {
	ConversionWarning,
	GeneratedUnitFile,
	InputMode,
	InstallScope,
	QuadletConversionResult,
	QuadletConvertOptions,
	SelinuxMode,
} from './types';

interface NormalizedHealthcheck {
	cmd?: string;
	interval?: string;
	retries?: number;
	timeout?: string;
	startPeriod?: string;
}

interface EnvEntry {
	key: string;
	value: string;
}

interface VolumeMount {
	source?: string;
	target: string;
	options: string[];
}

type DependsCondition = 'service_started' | 'service_healthy' | 'service_completed_successfully';

interface ServiceDependency {
	name: string;
	condition: DependsCondition;
	required: boolean;
}

interface NormalizedService {
	name: string;
	unitName: string;
	image: string;
	containerName: string;
	ports: string[];
	volumes: VolumeMount[];
	tmpfs: string[];
	environment: EnvEntry[];
	envFiles: string[];
	networks: string[];
	networkMode?: string;
	dependsOn: ServiceDependency[];
	restart?: string;
	user?: string;
	userNs?: string;
	workingDir?: string;
	hostname?: string;
	entrypoint?: string;
	exec?: string;
	capAdd: string[];
	capDrop: string[];
	groupAdd: string[];
	devices: string[];
	labels: string[];
	readOnly: boolean;
	init: boolean;
	privileged: boolean;
	shmSize?: string;
	healthcheck?: NormalizedHealthcheck;
}

interface NormalizedStack {
	services: NormalizedService[];
	namedVolumes: Set<string>;
	externalVolumes: Set<string>;
	hasExplicitNetworks: boolean;
	warnings: ConversionWarning[];
}

type ParseResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: string };

const SECRET_KEY_PATTERN = /PASSWORD|SECRET|TOKEN|KEY|API_KEY/i;

const SHORT_BOOLEAN_FLAGS = new Set(['d', 'i', 't', 'P']);

const LONG_BOOLEAN_FLAGS = new Set([
	'--detach',
	'--interactive',
	'--tty',
	'--rm',
	'--publish-all',
	'--init',
	'--read-only',
	'--privileged',
]);

type ValueFlagHandler = (service: NormalizedService, value: string, stack: NormalizedStack) => void;

const VALUE_FLAG_HANDLERS: Record<string, ValueFlagHandler> = {
	'-p': (s, v) => s.ports.push(v),
	'--publish': (s, v) => s.ports.push(v),
	'-v': (s, v, stack) => {
		const parsed = parseVolumeSpecString(v);
		if (parsed) {
			registerImplicitNamedVolume(parsed, stack);
			s.volumes.push(parsed);
		}
	},
	'--volume': (s, v, stack) => {
		const parsed = parseVolumeSpecString(v);
		if (parsed) {
			registerImplicitNamedVolume(parsed, stack);
			s.volumes.push(parsed);
		}
	},
	'--tmpfs': (s, v) => s.tmpfs.push(v),
	'-e': (s, v) => s.environment.push(parseEnvString(v)),
	'--env': (s, v) => s.environment.push(parseEnvString(v)),
	'--env-file': (s, v) => s.envFiles.push(v),
	'--name': (s, v) => {
		const clean = sanitizeUnitName(v);
		s.name = clean;
		s.unitName = clean;
		s.containerName = v.trim();
	},
	'--network': (s, v, stack) => {
		const trimmed = v.trim();
		if (trimmed === 'host' || trimmed === 'none') {
			s.networkMode = trimmed;
		} else if (trimmed !== 'bridge' && trimmed.length > 0) {
			s.networks.push(trimmed);
			stack.hasExplicitNetworks = true;
		}
	},
	'--net': (s, v, stack) => {
		const trimmed = v.trim();
		if (trimmed === 'host' || trimmed === 'none') {
			s.networkMode = trimmed;
		} else if (trimmed !== 'bridge' && trimmed.length > 0) {
			s.networks.push(trimmed);
			stack.hasExplicitNetworks = true;
		}
	},
	'--restart': (s, v) => {
		s.restart = v.trim();
	},
	'-u': (s, v) => {
		s.user = v.trim();
	},
	'--user': (s, v) => {
		s.user = v.trim();
	},
	'--userns': (s, v) => {
		s.userNs = v.trim();
	},
	'--cap-add': (s, v) => s.capAdd.push(v.trim()),
	'--cap-drop': (s, v) => s.capDrop.push(v.trim()),
	'--group-add': (s, v) => {
		const group = v.trim();
		if (group) {
			s.groupAdd.push(group);
		}
	},
	'--device': (s, v) => s.devices.push(v.trim()),
	'-l': (s, v) => s.labels.push(v.trim()),
	'--label': (s, v) => s.labels.push(v.trim()),
	'-h': (s, v) => {
		s.hostname = v.trim();
	},
	'--hostname': (s, v) => {
		s.hostname = v.trim();
	},
	'-w': (s, v) => {
		s.workingDir = v.trim();
	},
	'--workdir': (s, v) => {
		s.workingDir = v.trim();
	},
	'--entrypoint': (s, v) => {
		s.entrypoint = v.trim();
	},
	'--shm-size': (s, v) => {
		s.shmSize = v.trim();
	},
	'--health-cmd': (s, v) => {
		s.healthcheck = { ...s.healthcheck, cmd: v.trim() };
	},
	'--health-interval': (s, v) => {
		s.healthcheck = { ...s.healthcheck, interval: v.trim() };
	},
	'--health-retries': (s, v) => {
		const retries = Number.parseInt(v.trim(), 10);
		if (!Number.isNaN(retries)) {
			s.healthcheck = { ...s.healthcheck, retries };
		}
	},
	'--health-timeout': (s, v) => {
		s.healthcheck = { ...s.healthcheck, timeout: v.trim() };
	},
	'--health-start-period': (s, v) => {
		s.healthcheck = { ...s.healthcheck, startPeriod: v.trim() };
	},
	'--pull': () => {},
};

const SHORT_VALUE_FLAG_MAP: Record<string, string> = {
	p: '-p',
	v: '-v',
	e: '-e',
	u: '-u',
	l: '-l',
	h: '-h',
	w: '-w',
};

export function convertToQuadlet(
	rawInput: string,
	options: QuadletConvertOptions,
): QuadletConversionResult {
	const trimmed = rawInput.trim();
	if (!trimmed) {
		return {
			ok: false,
			error: 'Input cannot be empty. Paste a Docker Compose YAML document or a docker run command.',
		};
	}

	const stackName = sanitizeUnitName(options.stackName || 'app');
	const normalizedOptions: QuadletConvertOptions = {
		...options,
		stackName,
	};

	const inputMode = detectInputMode(trimmed);
	const parsed =
		inputMode === 'docker-run'
			? parseDockerRunInput(trimmed, stackName)
			: parseComposeYamlInput(trimmed, stackName);

	if (!parsed.ok) {
		return {
			ok: false,
			error: stripLongDashes(parsed.error),
		};
	}

	return emitQuadletUnits(parsed.value, inputMode, normalizedOptions);
}

function detectInputMode(trimmedInput: string): InputMode {
	const meaningfulLines = trimmedInput
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0 && !line.startsWith('#'));

	const firstLine = (meaningfulLines[0] ?? '').replace(/^\$\s+/, '');
	if (/^(?:sudo\s+)?(?:docker|podman)\s+(?:container\s+)?run(?:\s|\\|$)/.test(firstLine)) {
		return 'docker-run';
	}
	return 'compose-yaml';
}

function sanitizeUnitName(raw: string): string {
	const cleaned = raw
		.trim()
		.replace(/[^a-zA-Z0-9_.-]+/g, '-')
		.replace(/^[-.]+|[-.]+$/g, '');
	return cleaned || 'app';
}

function stripLongDashes(text: string): string {
	return text.replace(/[\u2013\u2014]/g, '-');
}

export function qualifyImageName(rawImage: string): string {
	const image = rawImage.trim();
	if (!image || image.startsWith('$')) {
		return image;
	}

	const slashIndex = image.indexOf('/');
	if (slashIndex === -1) {
		return `docker.io/library/${image}`;
	}

	const firstSegment = image.slice(0, slashIndex);
	const hasRegistryHost =
		firstSegment.includes('.') ||
		firstSegment.includes(':') ||
		firstSegment === 'localhost';

	if (hasRegistryHost) {
		return image;
	}

	return `docker.io/${image}`;
}

function createEmptyService(name: string): NormalizedService {
	const unitName = sanitizeUnitName(name);
	return {
		name,
		unitName,
		image: '',
		containerName: name,
		ports: [],
		volumes: [],
		tmpfs: [],
		environment: [],
		envFiles: [],
		networks: [],
		dependsOn: [],
		capAdd: [],
		capDrop: [],
		groupAdd: [],
		devices: [],
		labels: [],
		readOnly: false,
		init: false,
		privileged: false,
	};
}

function tokenizeShellCommand(rawInput: string): ParseResult<string[]> {
	const tokens: string[] = [];
	let current = '';
	let inToken = false;
	let quote: 'single' | 'double' | null = null;
	let i = 0;

	while (i < rawInput.length) {
		const ch = rawInput[i]!;

		if (quote === 'single') {
			if (ch === "'") {
				quote = null;
			} else {
				current += ch;
			}
			i += 1;
			continue;
		}

		if (quote === 'double') {
			if (ch === '"') {
				quote = null;
				i += 1;
				continue;
			}
			if (ch === '\\') {
				const lineCont = matchLineContinuation(rawInput, i);
				if (lineCont > 0) {
					i += lineCont;
					continue;
				}
				if (i + 1 < rawInput.length) {
					current += rawInput[i + 1]!;
					i += 2;
					continue;
				}
			}
			current += ch;
			i += 1;
			continue;
		}

		if (ch === '\\') {
			const lineCont = matchLineContinuation(rawInput, i);
			if (lineCont > 0) {
				i += lineCont;
				continue;
			}
			if (i + 1 < rawInput.length) {
				current += rawInput[i + 1]!;
				inToken = true;
				i += 2;
				continue;
			}
			current += ch;
			inToken = true;
			i += 1;
			continue;
		}

		if (!inToken && ch === '#') {
			while (i < rawInput.length && rawInput[i] !== '\n') {
				i += 1;
			}
			continue;
		}

		if (ch === "'") {
			quote = 'single';
			inToken = true;
			i += 1;
			continue;
		}

		if (ch === '"') {
			quote = 'double';
			inToken = true;
			i += 1;
			continue;
		}

		if (/\s/.test(ch)) {
			if (inToken) {
				tokens.push(current);
				current = '';
				inToken = false;
			}
			i += 1;
			continue;
		}

		current += ch;
		inToken = true;
		i += 1;
	}

	if (quote !== null) {
		return {
			ok: false,
			error: `Unterminated ${quote} quote in docker run command.`,
		};
	}

	if (inToken) {
		tokens.push(current);
	}

	return { ok: true, value: tokens };
}

function matchLineContinuation(input: string, index: number): number {
	let cursor = index + 1;
	while (cursor < input.length && (input[cursor] === ' ' || input[cursor] === '\t')) {
		cursor += 1;
	}
	if (input[cursor] === '\r' && input[cursor + 1] === '\n') {
		return cursor + 2 - index;
	}
	if (input[cursor] === '\n') {
		return cursor + 1 - index;
	}
	return 0;
}

function parseDockerRunInput(rawInput: string, defaultStackName: string): ParseResult<NormalizedStack> {
	const cleaned = rawInput.replace(/^\s*\$\s+/, '');
	const tokenized = tokenizeShellCommand(cleaned);
	if (!tokenized.ok) {
		return tokenized;
	}

	const tokens = tokenized.value;
	let idx = 0;

	if (tokens[idx] === 'sudo') {
		idx += 1;
	}
	if (tokens[idx] === 'docker' || tokens[idx] === 'podman') {
		idx += 1;
	} else {
		return {
			ok: false,
			error: 'Expected command starting with docker run or podman run.',
		};
	}
	if (tokens[idx] === 'container') {
		idx += 1;
	}
	if (tokens[idx] !== 'run') {
		return {
			ok: false,
			error: 'Only docker run and podman run CLI commands are supported.',
		};
	}
	idx += 1;

	const service = createEmptyService(defaultStackName);
	const stack: NormalizedStack = {
		services: [service],
		namedVolumes: new Set<string>(),
		externalVolumes: new Set<string>(),
		hasExplicitNetworks: false,
		warnings: [],
	};

	while (idx < tokens.length) {
		const token = tokens[idx]!;

		if (token === '--') {
			idx += 1;
			break;
		}

		if (!token.startsWith('-') || token === '-') {
			break;
		}

		if (token.startsWith('--')) {
			const eqIdx = token.indexOf('=');
			const flagName = eqIdx === -1 ? token : token.slice(0, eqIdx);
			const inlineVal = eqIdx === -1 ? undefined : token.slice(eqIdx + 1);

			if (LONG_BOOLEAN_FLAGS.has(flagName)) {
				applyBooleanFlag(service, flagName, inlineVal, stack);
				idx += 1;
				continue;
			}

			const handler = VALUE_FLAG_HANDLERS[flagName];
			if (handler) {
				const value = inlineVal !== undefined ? inlineVal : tokens[idx + 1];
				if (value === undefined) {
					return {
						ok: false,
						error: `Flag ${flagName} is missing its argument in docker run command.`,
					};
				}
				handler(service, value, stack);
				idx += inlineVal !== undefined ? 1 : 2;
				continue;
			}

			if (flagName === '--mount') {
				const value = inlineVal !== undefined ? inlineVal : tokens[idx + 1];
				if (value === undefined) {
					return { ok: false, error: 'Flag --mount is missing its argument.' };
				}
				applyMountFlag(service, value, stack);
				idx += inlineVal !== undefined ? 1 : 2;
				continue;
			}

			stack.warnings.push({
				service: service.name,
				field: flagName,
				message: `CLI flag ${flagName} has no direct first-class mapping and was skipped. Add PodmanArgs=${flagName} in [Container] if needed.`,
			});
			if (inlineVal !== undefined) {
				idx += 1;
			} else if (idx + 1 < tokens.length && !tokens[idx + 1]!.startsWith('-')) {
				idx += 2;
			} else {
				idx += 1;
			}
			continue;
		}

		const shortCluster = token.slice(1);
		let consumedNext = false;
		let clusterPos = 0;

		while (clusterPos < shortCluster.length) {
			const ch = shortCluster[clusterPos]!;
			if (SHORT_BOOLEAN_FLAGS.has(ch)) {
				clusterPos += 1;
				continue;
			}

			const mappedFlag = SHORT_VALUE_FLAG_MAP[ch];
			if (mappedFlag) {
				const rest = shortCluster.slice(clusterPos + 1);
				const attachedVal = rest.startsWith('=') ? rest.slice(1) : rest;
				const handler = VALUE_FLAG_HANDLERS[mappedFlag]!;
				if (attachedVal.length > 0) {
					handler(service, attachedVal, stack);
				} else {
					const nextToken = tokens[idx + 1];
					if (nextToken === undefined) {
						return {
							ok: false,
							error: `Flag -${ch} is missing its argument in docker run command.`,
						};
					}
					handler(service, nextToken, stack);
					consumedNext = true;
				}
				break;
			}

			stack.warnings.push({
				service: service.name,
				field: `-${ch}`,
				message: `Short flag -${ch} was not recognized and was skipped.`,
			});
			clusterPos += 1;
		}

		idx += consumedNext ? 2 : 1;
	}

	const imageToken = tokens[idx];
	if (!imageToken) {
		return {
			ok: false,
			error: 'No container image found in docker run command.',
		};
	}

	service.image = imageToken;
	const commandArgs = tokens.slice(idx + 1);
	if (commandArgs.length > 0) {
		service.exec = formatCommandArray(commandArgs);
	}

	if (service.privileged) {
		stack.warnings.push({
			service: service.name,
			field: 'privileged',
			message: 'Privileged mode sets SecurityLabelDisable=true. Prefer granular AddCapability= and AddDevice= entries where possible.',
		});
	}

	return { ok: true, value: stack };
}

function applyBooleanFlag(
	service: NormalizedService,
	flagName: string,
	inlineVal: string | undefined,
	_stack: NormalizedStack,
): void {
	const enabled = inlineVal === undefined || inlineVal.toLowerCase() !== 'false';
	if (flagName === '--init') {
		service.init = enabled;
	} else if (flagName === '--read-only') {
		service.readOnly = enabled;
	} else if (flagName === '--privileged') {
		service.privileged = enabled;
	}
}

function applyMountFlag(service: NormalizedService, rawMount: string, stack: NormalizedStack): void {
	const kv: Record<string, string> = {};
	let readOnly = false;
	for (const part of rawMount.split(',')) {
		const eq = part.indexOf('=');
		if (eq === -1) {
			if (part === 'readonly' || part === 'ro') {
				readOnly = true;
			}
			continue;
		}
		kv[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
	}

	const mountType = kv.type ?? 'volume';
	const target = kv.target ?? kv.destination ?? kv.dst;
	const source = kv.source ?? kv.src;
	if (!target) {
		return;
	}

	if (mountType === 'tmpfs') {
		service.tmpfs.push(target);
		return;
	}

	const mount: VolumeMount = {
		source,
		target,
		options: readOnly || kv.readonly === 'true' ? ['ro'] : [],
	};
	registerImplicitNamedVolume(mount, stack);
	service.volumes.push(mount);
}

function parseComposeYamlInput(rawInput: string, stackName: string): ParseResult<NormalizedStack> {
	let doc: unknown;
	try {
		doc = parse(rawInput);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Invalid YAML syntax.';
		return {
			ok: false,
			error: `Failed to parse Compose YAML. ${message}`,
		};
	}

	if (!isRecord(doc)) {
		return {
			ok: false,
			error: 'Compose YAML must be a mapping containing a "services" section.',
		};
	}

	const rawServices = doc.services;
	if (!isRecord(rawServices) || Object.keys(rawServices).length === 0) {
		return {
			ok: false,
			error: 'Compose YAML must define a non-empty "services" mapping.',
		};
	}

	const stack: NormalizedStack = {
		services: [],
		namedVolumes: new Set<string>(),
		externalVolumes: new Set<string>(),
		hasExplicitNetworks: false,
		warnings: [],
	};

	if (isRecord(doc.volumes)) {
		for (const [volName, volConfig] of Object.entries(doc.volumes)) {
			if (isRecord(volConfig) && volConfig.external === true) {
				stack.externalVolumes.add(volName);
			} else {
				stack.namedVolumes.add(volName);
			}
		}
	}

	if (isRecord(doc.networks) && Object.keys(doc.networks).length > 0) {
		stack.hasExplicitNetworks = true;
	}

	if (isRecord(doc.secrets)) {
		stack.warnings.push({
			field: 'secrets',
			message: 'Top-level Compose secrets require podman secret create commands and Secret= directives in [Container].',
		});
	}

	if (isRecord(doc.configs)) {
		stack.warnings.push({
			field: 'configs',
			message: 'Top-level Compose configs have no direct Quadlet generator unit. Mount read-only config files via Volume= instead.',
		});
	}

	for (const [serviceKey, rawSvc] of Object.entries(rawServices)) {
		if (!isRecord(rawSvc)) {
			return {
				ok: false,
				error: `Service "${serviceKey}" must be a YAML object.`,
			};
		}

		const svcResult = normalizeComposeService(serviceKey, rawSvc, stackName, stack);
		if (!svcResult.ok) {
			return svcResult;
		}
		stack.services.push(svcResult.value);
	}

	return { ok: true, value: stack };
}

function normalizeComposeService(
	serviceKey: string,
	rawSvc: Record<string, unknown>,
	stackName: string,
	stack: NormalizedStack,
): ParseResult<NormalizedService> {
	const service = createEmptyService(serviceKey);

	if (rawSvc.build !== undefined) {
		stack.warnings.push({
			service: serviceKey,
			field: 'build',
			message: 'Quadlet .container units pull prebuilt images. Build and push the image first, or add a companion .build Quadlet unit.',
		});
	}

	if (typeof rawSvc.image === 'string' && rawSvc.image.trim().length > 0) {
		service.image = rawSvc.image.trim();
	} else if (rawSvc.build !== undefined) {
		service.image = `localhost/${stackName}-${service.unitName}:latest`;
	} else {
		return {
			ok: false,
			error: `Service "${serviceKey}" must define an "image" field.`,
		};
	}

	if (typeof rawSvc.container_name === 'string' && rawSvc.container_name.trim().length > 0) {
		service.containerName = rawSvc.container_name.trim();
	}

	if (Array.isArray(rawSvc.ports)) {
		for (const p of rawSvc.ports) {
			const formatted = formatComposePort(p);
			if (formatted) {
				service.ports.push(formatted);
			}
		}
	}

	if (Array.isArray(rawSvc.volumes)) {
		for (const v of rawSvc.volumes) {
			if (typeof v === 'string') {
				const parsed = parseVolumeSpecString(v);
				if (parsed) {
					registerImplicitNamedVolume(parsed, stack);
					service.volumes.push(parsed);
				}
			} else if (isRecord(v) && typeof v.target === 'string') {
				if (v.type === 'tmpfs') {
					service.tmpfs.push(v.target);
				} else {
					const opts: string[] = [];
					if (v.read_only === true) {
						opts.push('ro');
					}
					const mount: VolumeMount = {
						source: typeof v.source === 'string' ? v.source : undefined,
						target: v.target,
						options: opts,
					};
					registerImplicitNamedVolume(mount, stack);
					service.volumes.push(mount);
				}
			}
		}
	}

	if (typeof rawSvc.tmpfs === 'string') {
		service.tmpfs.push(rawSvc.tmpfs);
	} else if (Array.isArray(rawSvc.tmpfs)) {
		for (const t of rawSvc.tmpfs) {
			if (typeof t === 'string') {
				service.tmpfs.push(t);
			}
		}
	}

	service.environment.push(...normalizeComposeEnvironment(rawSvc.environment));
	service.envFiles.push(...normalizeComposeEnvFile(rawSvc.env_file));

	if (typeof rawSvc.network_mode === 'string') {
		service.networkMode = rawSvc.network_mode.trim();
	}

	if (Array.isArray(rawSvc.networks)) {
		for (const net of rawSvc.networks) {
			if (typeof net === 'string' && net.trim()) {
				service.networks.push(net.trim());
				stack.hasExplicitNetworks = true;
			}
		}
	} else if (isRecord(rawSvc.networks)) {
		for (const net of Object.keys(rawSvc.networks)) {
			service.networks.push(net);
			stack.hasExplicitNetworks = true;
		}
	}

	if (Array.isArray(rawSvc.depends_on)) {
		for (const dep of rawSvc.depends_on) {
			if (typeof dep === 'string' && dep.trim()) {
				service.dependsOn.push({
					name: dep.trim(),
					condition: 'service_started',
					required: true,
				});
			}
		}
	} else if (isRecord(rawSvc.depends_on)) {
		for (const [depName, depSpec] of Object.entries(rawSvc.depends_on)) {
			const name = depName.trim();
			if (!name) {
				continue;
			}
			service.dependsOn.push(readDependsSpec(depSpec, serviceKey, name, stack));
		}
	}

	if (typeof rawSvc.restart === 'string') {
		service.restart = rawSvc.restart.trim();
	}
	if (typeof rawSvc.user === 'string' || typeof rawSvc.user === 'number') {
		service.user = String(rawSvc.user);
	}
	if (typeof rawSvc.userns_mode === 'string' && rawSvc.userns_mode.trim()) {
		service.userNs = rawSvc.userns_mode.trim();
	}
	if (Array.isArray(rawSvc.group_add)) {
		for (const group of rawSvc.group_add) {
			if (typeof group === 'string' || typeof group === 'number') {
				const value = String(group).trim();
				if (value) {
					service.groupAdd.push(value);
				}
			}
		}
	}
	if (typeof rawSvc.working_dir === 'string') {
		service.workingDir = rawSvc.working_dir.trim();
	}
	if (typeof rawSvc.hostname === 'string') {
		service.hostname = rawSvc.hostname.trim();
	}

	if (typeof rawSvc.entrypoint === 'string') {
		service.entrypoint = rawSvc.entrypoint.trim();
	} else if (Array.isArray(rawSvc.entrypoint)) {
		const parts = rawSvc.entrypoint.map(String);
		service.entrypoint = parts.length === 1 ? parts[0] : JSON.stringify(parts);
	}

	if (typeof rawSvc.command === 'string') {
		service.exec = rawSvc.command.trim();
	} else if (Array.isArray(rawSvc.command)) {
		service.exec = formatCommandArray(rawSvc.command.map(String));
	}

	if (Array.isArray(rawSvc.cap_add)) {
		for (const cap of rawSvc.cap_add) {
			if (typeof cap === 'string') service.capAdd.push(cap.trim());
		}
	}
	if (Array.isArray(rawSvc.cap_drop)) {
		for (const cap of rawSvc.cap_drop) {
			if (typeof cap === 'string') service.capDrop.push(cap.trim());
		}
	}
	if (Array.isArray(rawSvc.devices)) {
		for (const dev of rawSvc.devices) {
			if (typeof dev === 'string') service.devices.push(dev.trim());
		}
	}

	service.labels.push(...normalizeComposeLabels(rawSvc.labels));

	if (rawSvc.read_only === true) {
		service.readOnly = true;
	}
	if (rawSvc.init === true) {
		service.init = true;
	}
	if (rawSvc.privileged === true) {
		service.privileged = true;
		stack.warnings.push({
			service: serviceKey,
			field: 'privileged',
			message: 'Privileged mode sets SecurityLabelDisable=true. Prefer granular AddCapability= and AddDevice= entries where possible.',
		});
	}
	if (typeof rawSvc.shm_size === 'string' || typeof rawSvc.shm_size === 'number') {
		service.shmSize = String(rawSvc.shm_size);
	}

	if (isRecord(rawSvc.healthcheck) && rawSvc.healthcheck.disable !== true) {
		const hc = normalizeComposeHealthcheck(rawSvc.healthcheck);
		if (hc) {
			service.healthcheck = hc;
		}
	}

	collectUnsupportedServiceWarnings(serviceKey, rawSvc, stack.warnings);

	return { ok: true, value: service };
}

function collectUnsupportedServiceWarnings(
	serviceKey: string,
	rawSvc: Record<string, unknown>,
	warnings: ConversionWarning[],
): void {
	if (isRecord(rawSvc.deploy)) {
		const replicas = rawSvc.deploy.replicas;
		if (typeof replicas === 'number' && replicas !== 1) {
			warnings.push({
				service: serviceKey,
				field: 'deploy.replicas',
				message: `Compose deploy.replicas (${replicas}) targets Swarm. Use systemd template units (${sanitizeUnitName(serviceKey)}@.container) to run multiple instances.`,
			});
		} else {
			warnings.push({
				service: serviceKey,
				field: 'deploy',
				message: 'Compose deploy settings are not read by Quadlet. Map memory or CPU limits to [Service] directives such as MemoryMax= and CPUQuota=.',
			});
		}
	}

	if (rawSvc.links !== undefined) {
		warnings.push({
			service: serviceKey,
			field: 'links',
			message: 'Legacy Compose links are ignored. Services attached to the shared .network unit resolve each other by service name.',
		});
	}

	if (rawSvc.extends !== undefined) {
		warnings.push({
			service: serviceKey,
			field: 'extends',
			message: 'Compose extends is not expanded automatically. Inline inherited fields before converting.',
		});
	}

	if (rawSvc.profiles !== undefined) {
		warnings.push({
			service: serviceKey,
			field: 'profiles',
			message: 'Compose profiles have no Quadlet counterpart. Omit WantedBy= on optional units and start them on demand with systemctl.',
		});
	}

	if (rawSvc.secrets !== undefined) {
		warnings.push({
			service: serviceKey,
			field: 'secrets',
			message: 'Service secrets require pre-created Podman secrets and Secret= entries in [Container].',
		});
	}

	if (rawSvc.configs !== undefined) {
		warnings.push({
			service: serviceKey,
			field: 'configs',
			message: 'Service configs are not supported by Quadlet. Mount read-only host files with Volume= instead.',
		});
	}
}

function readDependsSpec(
	raw: unknown,
	serviceKey: string,
	depName: string,
	stack: NormalizedStack,
): ServiceDependency {
	let condition: DependsCondition = 'service_started';
	let required = true;
	if (isRecord(raw)) {
		if (raw.required === false) {
			required = false;
		}
		if (typeof raw.condition === 'string' && raw.condition.trim()) {
			const value = raw.condition.trim();
			if (
				value === 'service_started' ||
				value === 'service_healthy' ||
				value === 'service_completed_successfully'
			) {
				condition = value;
			} else {
				stack.warnings.push({
					service: serviceKey,
					field: 'depends_on',
					message: `Condition ${value} on ${depName} is not a Compose condition this converter maps. Treated as service_started.`,
				});
			}
		}
	}
	return { name: depName, condition, required };
}

function servicesNeedingHealthyNotify(stack: NormalizedStack, warnings: ConversionWarning[]): Set<string> {
	const known = new Set(stack.services.map((svc) => svc.name));
	const healthyWaiters = new Map<string, string[]>();
	const startedWaiters = new Map<string, string[]>();

	for (const svc of stack.services) {
		for (const dep of svc.dependsOn) {
			if (!known.has(dep.name)) {
				warnings.push({
					service: svc.name,
					field: 'depends_on',
					message: `Service ${dep.name} is not defined in this Compose file. After= was still written, and systemd will not start ${svc.name} until that unit exists.`,
				});
			}
			if (!dep.required) {
				warnings.push({
					service: svc.name,
					field: 'depends_on',
					message: `${dep.name} sets required: false. The unit uses Wants= and After= so a stopped dependency does not fail ${svc.name}.`,
				});
			}
			if (dep.condition === 'service_completed_successfully') {
				warnings.push({
					service: svc.name,
					field: 'depends_on',
					message: `Compose condition service_completed_successfully for ${dep.name} has no Quadlet key. After= only orders the start. A one-shot init container needs Type=oneshot and RemainAfterExit=yes added by hand on ${sanitizeUnitName(dep.name)}.container.`,
				});
			} else if (dep.condition === 'service_healthy') {
				const list = healthyWaiters.get(dep.name) ?? [];
				list.push(svc.name);
				healthyWaiters.set(dep.name, list);
			} else {
				const list = startedWaiters.get(dep.name) ?? [];
				list.push(svc.name);
				startedWaiters.set(dep.name, list);
			}
		}
	}

	const notifyHealthy = new Set<string>();
	for (const [depName, waiters] of healthyWaiters) {
		const depSvc = stack.services.find((svc) => svc.name === depName);
		if (!depSvc) {
			continue;
		}
		if (!depSvc.healthcheck?.cmd) {
			warnings.push({
				service: depName,
				field: 'healthcheck',
				message: `${waiters.join(', ')} wait with condition service_healthy, but ${depName} has no healthcheck.test. Notify=healthy was left off because Podman would never report the unit started.`,
			});
			continue;
		}
		notifyHealthy.add(depName);
		const alsoStarted = startedWaiters.get(depName) ?? [];
		if (alsoStarted.length > 0) {
			warnings.push({
				service: depName,
				field: 'depends_on',
				message: `${waiters.join(', ')} wait for service_healthy and ${alsoStarted.join(', ')} wait for service_started. Notify=healthy makes every After= dependency wait for the healthcheck, which is stricter than Compose service_started.`,
			});
		}
	}
	return notifyHealthy;
}

function formatComposePort(port: unknown): string | null {
	if (typeof port === 'number') {
		return String(port);
	}
	if (typeof port === 'string') {
		const trimmed = port.trim();
		return trimmed.length > 0 ? trimmed : null;
	}
	if (isRecord(port) && (typeof port.target === 'number' || typeof port.target === 'string')) {
		const target = String(port.target);
		const published =
			port.published !== undefined && port.published !== null ? String(port.published) : undefined;
		const hostIp = typeof port.host_ip === 'string' && port.host_ip ? port.host_ip : undefined;
		const protocol =
			typeof port.protocol === 'string' && port.protocol !== 'tcp' ? `/${port.protocol}` : '';

		if (hostIp && published) {
			return `${hostIp}:${published}:${target}${protocol}`;
		}
		if (published) {
			return `${published}:${target}${protocol}`;
		}
		return `${target}${protocol}`;
	}
	return null;
}

function parseVolumeSpecString(rawSpec: string): VolumeMount | null {
	const spec = rawSpec.trim();
	if (!spec) {
		return null;
	}

	const firstColon = spec.indexOf(':');
	if (firstColon === -1) {
		return {
			target: spec,
			options: [],
		};
	}

	const source = spec.slice(0, firstColon);
	const remainder = spec.slice(firstColon + 1);
	const secondColon = remainder.indexOf(':');

	if (secondColon === -1) {
		return {
			source,
			target: remainder,
			options: [],
		};
	}

	const target = remainder.slice(0, secondColon);
	const rawOpts = remainder.slice(secondColon + 1);
	const options = rawOpts
		.split(',')
		.map((o) => o.trim())
		.filter((o) => o.length > 0);

	return {
		source,
		target,
		options,
	};
}

function isNamedVolumeSource(source: string | undefined): source is string {
	if (!source) {
		return false;
	}
	return (
		!source.includes('/') &&
		!source.includes('\\') &&
		!source.startsWith('.') &&
		!source.startsWith('~') &&
		!source.startsWith('%') &&
		!source.startsWith('$')
	);
}

function registerImplicitNamedVolume(mount: VolumeMount, stack: NormalizedStack): void {
	if (isNamedVolumeSource(mount.source) && !stack.externalVolumes.has(mount.source)) {
		stack.namedVolumes.add(mount.source);
	}
}

function parseEnvString(raw: string): EnvEntry {
	const eqIdx = raw.indexOf('=');
	if (eqIdx === -1) {
		return { key: raw.trim(), value: '' };
	}
	const key = raw.slice(0, eqIdx).trim();
	const rawVal = raw.slice(eqIdx + 1);
	return {
		key,
		value: stripMatchingOuterQuotes(rawVal),
	};
}

function stripMatchingOuterQuotes(val: string): string {
	if (
		val.length >= 2 &&
		((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
	) {
		return val.slice(1, -1);
	}
	return val;
}

function normalizeComposeEnvironment(rawEnv: unknown): EnvEntry[] {
	const entries: EnvEntry[] = [];
	if (Array.isArray(rawEnv)) {
		for (const item of rawEnv) {
			if (typeof item === 'string') {
				entries.push(parseEnvString(item));
			}
		}
	} else if (isRecord(rawEnv)) {
		for (const [key, val] of Object.entries(rawEnv)) {
			entries.push({
				key: key.trim(),
				value: val === null || val === undefined ? '' : String(val),
			});
		}
	}
	return entries;
}

function normalizeComposeEnvFile(rawEnvFile: unknown): string[] {
	if (typeof rawEnvFile === 'string') {
		return [rawEnvFile.trim()];
	}
	if (Array.isArray(rawEnvFile)) {
		const files: string[] = [];
		for (const entry of rawEnvFile) {
			if (typeof entry === 'string' && entry.trim()) {
				files.push(entry.trim());
			} else if (isRecord(entry) && typeof entry.path === 'string' && entry.path.trim()) {
				files.push(entry.path.trim());
			}
		}
		return files;
	}
	return [];
}

function normalizeComposeLabels(rawLabels: unknown): string[] {
	const labels: string[] = [];
	if (Array.isArray(rawLabels)) {
		for (const item of rawLabels) {
			if (typeof item === 'string' && item.trim()) {
				labels.push(item.trim());
			}
		}
	} else if (isRecord(rawLabels)) {
		for (const [key, val] of Object.entries(rawLabels)) {
			const strVal = val === null || val === undefined ? '' : String(val);
			labels.push(`${key}=${strVal}`);
		}
	}
	return labels;
}

function normalizeComposeHealthcheck(rawHc: Record<string, unknown>): NormalizedHealthcheck | null {
	let cmd: string | undefined;
	if (typeof rawHc.test === 'string') {
		cmd = rawHc.test.trim();
	} else if (Array.isArray(rawHc.test) && rawHc.test.length > 0) {
		const parts = rawHc.test.map(String);
		if (parts[0] === 'NONE') {
			return null;
		}
		if (parts[0] === 'CMD-SHELL') {
			cmd = parts.slice(1).join(' ').trim();
		} else if (parts[0] === 'CMD') {
			cmd = formatCommandArray(parts.slice(1));
		} else {
			cmd = formatCommandArray(parts);
		}
	}

	const retries =
		typeof rawHc.retries === 'number'
			? rawHc.retries
			: typeof rawHc.retries === 'string'
				? Number.parseInt(rawHc.retries, 10)
				: undefined;

	return {
		cmd,
		interval: typeof rawHc.interval === 'string' ? rawHc.interval.trim() : undefined,
		retries: retries !== undefined && !Number.isNaN(retries) ? retries : undefined,
		timeout: typeof rawHc.timeout === 'string' ? rawHc.timeout.trim() : undefined,
		startPeriod: typeof rawHc.start_period === 'string' ? rawHc.start_period.trim() : undefined,
	};
}

function emitQuadletUnits(
	stack: NormalizedStack,
	inputMode: InputMode,
	options: QuadletConvertOptions,
): QuadletConversionResult {
	const { stackName, installScope, selinuxMode, enableAutoUpdate } = options;
	const baseInstallDir =
		installScope === 'rootless' ? '~/.config/containers/systemd' : '/etc/containers/systemd';
	const systemdEnvFileRef =
		installScope === 'rootless'
			? `%h/.config/containers/systemd/${stackName}.env`
			: `/etc/containers/systemd/${stackName}.env`;

	const useSharedNetwork =
		options.generateSharedNetwork && (stack.services.length >= 2 || stack.hasExplicitNetworks);

	const volumeUnitMap = new Map<string, string>();
	for (const volName of stack.namedVolumes) {
		volumeUnitMap.set(volName, sanitizeUnitName(volName));
	}

	const extractedSecrets = new Map<string, string>();
	const warnings = [...stack.warnings];
	const notifyHealthy = servicesNeedingHealthyNotify(stack, warnings);

	const containerFiles: GeneratedUnitFile[] = [];

	for (const svc of stack.services) {
		const inlineEnv: EnvEntry[] = [];
		let serviceUsesSecretEnvFile = false;

		for (const entry of svc.environment) {
			if (options.extractSecretsToEnvFile && SECRET_KEY_PATTERN.test(entry.key)) {
				serviceUsesSecretEnvFile = true;
				const prev = extractedSecrets.get(entry.key);
				if (prev !== undefined && prev !== entry.value) {
					warnings.push({
						service: svc.name,
						field: `environment.${entry.key}`,
						message: `Secret key ${entry.key} has conflicting values across services. Verify ${stackName}.env before starting units.`,
					});
				} else {
					extractedSecrets.set(entry.key, entry.value);
				}
			} else {
				inlineEnv.push(entry);
			}
		}

		const content = renderContainerUnit(svc, {
			stackName,
			installScope,
			selinuxMode,
			enableAutoUpdate,
			useSharedNetwork,
			volumeUnitMap,
			inlineEnv,
			secretEnvFileRef: serviceUsesSecretEnvFile ? systemdEnvFileRef : undefined,
			notifyHealthy: notifyHealthy.has(svc.name),
		});

		const filename = `${svc.unitName}.container`;
		containerFiles.push({
			filename,
			unitType: 'container',
			installPath: `${baseInstallDir}/${filename}`,
			content,
		});
	}

	const networkFiles: GeneratedUnitFile[] = [];
	if (useSharedNetwork) {
		const filename = `${stackName}.network`;
		networkFiles.push({
			filename,
			unitType: 'network',
			installPath: `${baseInstallDir}/${filename}`,
			content: `[Unit]\nDescription=${stackName} shared Podman network\n\n[Network]\nNetworkName=${stackName}\n`,
		});
	}

	const volumeFiles: GeneratedUnitFile[] = [];
	for (const [rawVolName, volUnitName] of volumeUnitMap.entries()) {
		const filename = `${volUnitName}.volume`;
		volumeFiles.push({
			filename,
			unitType: 'volume',
			installPath: `${baseInstallDir}/${filename}`,
			content: `[Unit]\nDescription=${rawVolName} Podman volume\n\n[Volume]\nVolumeName=${rawVolName}\n`,
		});
	}

	const envFiles: GeneratedUnitFile[] = [];
	if (extractedSecrets.size > 0) {
		const filename = `${stackName}.env`;
		const envLines: string[] = [];
		for (const [key, value] of extractedSecrets.entries()) {
			envLines.push(formatEnvFileAssignment(key, value));
		}
		envFiles.push({
			filename,
			unitType: 'env',
			installPath: `${baseInstallDir}/${filename}`,
			content: `${envLines.join('\n')}\n`,
		});
	}

	const files = [...containerFiles, ...networkFiles, ...volumeFiles, ...envFiles];
	const systemdCommands = buildSystemdCommands(
		stack.services.map((s) => `${s.unitName}.service`),
		installScope,
		extractedSecrets.size > 0 ? `${stackName}.env` : undefined,
	);

	return {
		ok: true,
		inputMode,
		serviceCount: stack.services.length,
		files,
		warnings,
		systemdCommands,
	};
}

interface RenderContainerContext {
	stackName: string;
	installScope: InstallScope;
	selinuxMode: SelinuxMode;
	enableAutoUpdate: boolean;
	useSharedNetwork: boolean;
	volumeUnitMap: Map<string, string>;
	inlineEnv: EnvEntry[];
	secretEnvFileRef?: string;
	notifyHealthy: boolean;
}

function renderContainerUnit(svc: NormalizedService, ctx: RenderContainerContext): string {
	const attachesToSharedNetwork =
		ctx.useSharedNetwork && svc.networkMode !== 'host' && svc.networkMode !== 'none';

	const unitLines: string[] = [
		'[Unit]',
		`Description=${ctx.stackName} ${svc.name} container`,
		'Wants=network-online.target',
		'After=network-online.target',
	];

	if (attachesToSharedNetwork) {
		unitLines.push(`After=${ctx.stackName}-network.service`);
	}

	for (const dep of svc.dependsOn) {
		const depUnit = `${sanitizeUnitName(dep.name)}.service`;
		unitLines.push(`After=${depUnit}`);
		unitLines.push(`${dep.required ? 'Requires' : 'Wants'}=${depUnit}`);
	}

	const containerLines: string[] = [
		'[Container]',
		`Image=${qualifyImageName(svc.image)}`,
		`ContainerName=${svc.containerName}`,
	];

	if (ctx.enableAutoUpdate) {
		containerLines.push('AutoUpdate=registry');
	}

	if (attachesToSharedNetwork) {
		containerLines.push(`Network=${ctx.stackName}.network`);
		if (svc.containerName !== svc.name) {
			containerLines.push(`NetworkAlias=${svc.name}`);
		}
	} else if (svc.networkMode) {
		containerLines.push(`Network=${svc.networkMode}`);
	} else {
		for (const net of svc.networks) {
			containerLines.push(`Network=${net}`);
		}
	}

	if (svc.hostname) {
		containerLines.push(`HostName=${svc.hostname}`);
	}
	if (svc.user) {
		containerLines.push(`User=${svc.user}`);
	}
	if (svc.userNs) {
		containerLines.push(`UserNS=${svc.userNs}`);
	}
	for (const group of svc.groupAdd) {
		containerLines.push(`GroupAdd=${group}`);
	}
	if (svc.workingDir) {
		containerLines.push(`WorkingDir=${svc.workingDir}`);
	}
	if (svc.entrypoint) {
		containerLines.push(`Entrypoint=${svc.entrypoint}`);
	}
	if (svc.exec) {
		containerLines.push(`Exec=${svc.exec}`);
	}

	for (const port of svc.ports) {
		containerLines.push(`PublishPort=${port}`);
	}

	for (const mount of svc.volumes) {
		containerLines.push(`Volume=${formatQuadletVolume(mount, ctx.selinuxMode, ctx.volumeUnitMap)}`);
	}

	for (const tmpfsPath of svc.tmpfs) {
		containerLines.push(`Tmpfs=${tmpfsPath}`);
	}

	for (const envFile of svc.envFiles) {
		containerLines.push(`EnvironmentFile=${envFile}`);
	}

	if (ctx.secretEnvFileRef) {
		containerLines.push(`EnvironmentFile=${ctx.secretEnvFileRef}`);
	}

	for (const entry of ctx.inlineEnv) {
		containerLines.push(`Environment=${formatQuadletEnvEntry(entry)}`);
	}

	for (const cap of svc.capAdd) {
		containerLines.push(`AddCapability=${cap}`);
	}
	for (const cap of svc.capDrop) {
		containerLines.push(`DropCapability=${cap}`);
	}
	for (const dev of svc.devices) {
		containerLines.push(`AddDevice=${dev}`);
	}
	for (const label of svc.labels) {
		containerLines.push(`Label=${quoteIfNeeded(label)}`);
	}

	if (svc.readOnly) {
		containerLines.push('ReadOnly=true');
	}
	if (svc.init) {
		containerLines.push('RunInit=true');
	}
	if (svc.privileged) {
		containerLines.push('SecurityLabelDisable=true');
	}
	if (svc.shmSize) {
		containerLines.push(`ShmSize=${svc.shmSize}`);
	}

	if (svc.healthcheck) {
		if (svc.healthcheck.cmd) {
			containerLines.push(`HealthCmd=${svc.healthcheck.cmd}`);
		}
		if (svc.healthcheck.interval) {
			containerLines.push(`HealthInterval=${svc.healthcheck.interval}`);
		}
		if (svc.healthcheck.retries !== undefined) {
			containerLines.push(`HealthRetries=${svc.healthcheck.retries}`);
		}
		if (svc.healthcheck.timeout) {
			containerLines.push(`HealthTimeout=${svc.healthcheck.timeout}`);
		}
		if (svc.healthcheck.startPeriod) {
			containerLines.push(`HealthStartPeriod=${svc.healthcheck.startPeriod}`);
		}
	}

	if (ctx.notifyHealthy) {
		containerLines.push('Notify=healthy');
	}

	const serviceLines: string[] = [
		'[Service]',
		`Restart=${mapRestartPolicy(svc.restart)}`,
		'TimeoutStartSec=900',
	];

	const wantedBy = ctx.installScope === 'rootless' ? 'default.target' : 'multi-user.target';
	const installLines: string[] = ['[Install]', `WantedBy=${wantedBy}`];

	return `${[
		unitLines.join('\n'),
		containerLines.join('\n'),
		serviceLines.join('\n'),
		installLines.join('\n'),
	].join('\n\n')}\n`;
}

function formatQuadletVolume(
	mount: VolumeMount,
	selinuxMode: SelinuxMode,
	volumeUnitMap: Map<string, string>,
): string {
	if (!mount.source) {
		return mount.target;
	}

	const mappedUnit = volumeUnitMap.get(mount.source);
	const resolvedSource = mappedUnit ? `${mappedUnit}.volume` : mount.source;
	const opts = [...mount.options];

	if (selinuxMode !== 'none' && !opts.includes('z') && !opts.includes('Z')) {
		opts.push(selinuxMode === 'shared-z' ? 'z' : 'Z');
	}

	if (opts.length === 0) {
		return `${resolvedSource}:${mount.target}`;
	}
	return `${resolvedSource}:${mount.target}:${opts.join(',')}`;
}

function formatQuadletEnvEntry(entry: EnvEntry): string {
	const combined = `${entry.key}=${entry.value}`;
	return quoteIfNeeded(combined);
}

function formatEnvFileAssignment(key: string, value: string): string {
	if (/[\s#"']/.test(value)) {
		const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
		return `${key}="${escaped}"`;
	}
	return `${key}=${value}`;
}

function quoteIfNeeded(raw: string): string {
	if (/[\s#"';\\]/.test(raw)) {
		const escaped = raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
		return `"${escaped}"`;
	}
	return raw;
}

function formatCommandArray(args: string[]): string {
	return args
		.map((arg) => {
			if (arg.length === 0 || /[\s"'\\]/.test(arg)) {
				return `"${arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
			}
			return arg;
		})
		.join(' ');
}

function mapRestartPolicy(restart?: string): string {
	if (!restart) {
		return 'on-failure';
	}
	const normalized = restart.toLowerCase();
	if (normalized === 'always' || normalized === 'unless-stopped') {
		return 'always';
	}
	if (normalized.startsWith('on-failure')) {
		return 'on-failure';
	}
	if (normalized === 'no' || normalized === 'never') {
		return 'no';
	}
	return 'on-failure';
}

function buildSystemdCommands(
	serviceUnits: string[],
	installScope: InstallScope,
	envFilename?: string,
): string[] {
	const joinedUnits = serviceUnits.join(' ');
	if (installScope === 'rootless') {
		const cmds = ['mkdir -p ~/.config/containers/systemd'];
		if (envFilename) {
			cmds.push(`chmod 600 ~/.config/containers/systemd/${envFilename}`);
		}
		cmds.push(`systemctl --user daemon-reload && systemctl --user start ${joinedUnits}`);
		cmds.push(`systemctl --user status ${joinedUnits}`);
		cmds.push('loginctl enable-linger $USER');
		return cmds;
	}

	const cmds = ['sudo mkdir -p /etc/containers/systemd'];
	if (envFilename) {
		cmds.push(`sudo chmod 600 /etc/containers/systemd/${envFilename}`);
	}
	cmds.push(`sudo systemctl daemon-reload && sudo systemctl start ${joinedUnits}`);
	cmds.push(`sudo systemctl status ${joinedUnits}`);
	return cmds;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
