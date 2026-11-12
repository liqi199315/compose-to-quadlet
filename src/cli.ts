import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { convertToQuadlet } from './lib/quadlet-engine';
import type {
	InstallScope,
	QuadletConvertOptions,
	SelinuxMode,
} from './lib/types';
import { buildZipArchive } from './lib/zip-packager';

const VERSION = '0.1.0';

export interface CliParsedArgs {
	inputPath?: string;
	runCommand?: string;
	stackName?: string;
	installScope: InstallScope;
	selinuxMode: SelinuxMode;
	outDir?: string;
	zipPath?: string;
	stdout: boolean;
	enableAutoUpdate: boolean;
	generateSharedNetwork: boolean;
	extractSecretsToEnvFile: boolean;
	help: boolean;
	version: boolean;
}

export function parseCliArgs(argv: string[]): CliParsedArgs {
	const args: CliParsedArgs = {
		installScope: 'rootless',
		selinuxMode: 'none',
		stdout: false,
		enableAutoUpdate: false,
		generateSharedNetwork: true,
		extractSecretsToEnvFile: false,
		help: false,
		version: false,
	};

	let explicitStdout = false;

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];

		if (arg === '--help' || arg === '-h') {
			args.help = true;
		} else if (arg === '--version' || arg === '-v') {
			args.version = true;
		} else if (arg === '--stdout') {
			args.stdout = true;
			explicitStdout = true;
		} else if (arg === '--auto-update') {
			args.enableAutoUpdate = true;
		} else if (arg === '--extract-secrets') {
			args.extractSecretsToEnvFile = true;
		} else if (arg === '--no-shared-network') {
			args.generateSharedNetwork = false;
		} else if (arg === '--shared-network') {
			args.generateSharedNetwork = true;
		} else if (arg === '--input' || arg === '-i') {
			i += 1;
			if (i >= argv.length) {
				throw new Error('Missing argument for --input');
			}
			args.inputPath = argv[i];
		} else if (arg.startsWith('--input=')) {
			args.inputPath = arg.slice('--input='.length);
		} else if (arg === '--run' || arg === '-r') {
			i += 1;
			if (i >= argv.length) {
				throw new Error('Missing argument for --run');
			}
			args.runCommand = argv[i];
		} else if (arg.startsWith('--run=')) {
			args.runCommand = arg.slice('--run='.length);
		} else if (arg === '--stack' || arg === '-s') {
			i += 1;
			if (i >= argv.length) {
				throw new Error('Missing argument for --stack');
			}
			args.stackName = argv[i];
		} else if (arg.startsWith('--stack=')) {
			args.stackName = arg.slice('--stack='.length);
		} else if (arg === '--scope') {
			i += 1;
			if (i >= argv.length) {
				throw new Error('Missing argument for --scope');
			}
			const val = argv[i];
			if (val !== 'rootless' && val !== 'rootful') {
				throw new Error(`Invalid --scope "${val}". Expected "rootless" or "rootful".`);
			}
			args.installScope = val;
		} else if (arg.startsWith('--scope=')) {
			const val = arg.slice('--scope='.length);
			if (val !== 'rootless' && val !== 'rootful') {
				throw new Error(`Invalid --scope "${val}". Expected "rootless" or "rootful".`);
			}
			args.installScope = val;
		} else if (arg === '--selinux') {
			i += 1;
			if (i >= argv.length) {
				throw new Error('Missing argument for --selinux');
			}
			const val = argv[i];
			if (val !== 'none' && val !== 'shared-z' && val !== 'private-Z') {
				throw new Error(`Invalid --selinux "${val}". Expected "none", "shared-z", or "private-Z".`);
			}
			args.selinuxMode = val;
		} else if (arg.startsWith('--selinux=')) {
			const val = arg.slice('--selinux='.length);
			if (val !== 'none' && val !== 'shared-z' && val !== 'private-Z') {
				throw new Error(`Invalid --selinux "${val}". Expected "none", "shared-z", or "private-Z".`);
			}
			args.selinuxMode = val;
		} else if (arg === '--out-dir' || arg === '-o') {
			i += 1;
			if (i >= argv.length) {
				throw new Error('Missing argument for --out-dir');
			}
			args.outDir = argv[i];
		} else if (arg.startsWith('--out-dir=')) {
			args.outDir = arg.slice('--out-dir='.length);
		} else if (arg === '--zip') {
			i += 1;
			if (i >= argv.length) {
				throw new Error('Missing argument for --zip');
			}
			args.zipPath = argv[i];
		} else if (arg.startsWith('--zip=')) {
			args.zipPath = arg.slice('--zip='.length);
		} else if (!arg.startsWith('-') && !args.inputPath && !args.runCommand) {
			// Positional file path fallback
			args.inputPath = arg;
		} else {
			throw new Error(`Unknown option: "${arg}". Run with --help for usage.`);
		}
	}

	if (!args.outDir && !args.zipPath && !explicitStdout) {
		args.stdout = true;
	}

	return args;
}

export function printHelp(): void {
	const helpText = `compose-to-quadlet v${VERSION}

Convert Docker Compose YAML stacks and docker run CLI flags into declarative
Podman 4.4+ systemd Quadlet unit files (.container, .network, .volume, .env).

Looking for an interactive visual workbench?
Visit https://quadletgen.com for browser-local conversion and instant ZIP export.

USAGE:
  compose-to-quadlet --input <compose.yml> [options]
  compose-to-quadlet --run "<docker run ...>" [options]

OPTIONS:
  -i, --input <file>        Path to Docker Compose YAML file
  -r, --run "<command>"     docker run or podman run command string
  -s, --stack <name>        Stack/service group name (default: file basename or "app")
      --scope <scope>       Target install scope: rootless or rootful (default: rootless)
      --selinux <mode>      SELinux volume relabeling: none, shared-z, private-Z (default: none)
  -o, --out-dir <dir>       Directory to write generated Quadlet files
      --zip <file.zip>      Path to export generated files as a ZIP bundle
      --stdout              Print generated unit files to standard output
      --auto-update         Add AutoUpdate=registry directive to [Container] sections
      --extract-secrets     Extract sensitive keys into separate .env file
      --no-shared-network   Disable automatic shared .network unit generation
  -h, --help                Show this help message and exit
  -v, --version             Print version number and exit

EXAMPLES:
  # Convert a docker-compose.yml file and print units to stdout
  compose-to-quadlet --input docker-compose.yml

  # Convert a compose file and save units to ~/.config/containers/systemd/
  compose-to-quadlet -i compose.yaml --out-dir ~/.config/containers/systemd/

  # Convert a docker run command with SELinux private-Z relabeling
  compose-to-quadlet --run "docker run -d --name web -p 80:80 -v ./html:/usr/share/nginx/html nginx" --selinux private-Z

  # Export multi-service stack as a ZIP bundle
  compose-to-quadlet -i stack.yaml --stack prod-app --zip quadlet-units.zip

Online Web Tool: https://quadletgen.com`;

	console.log(helpText);
}

export async function runCli(argv: string[]): Promise<number> {
	let args: CliParsedArgs;
	try {
		args = parseCliArgs(argv);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`Error: ${message}`);
		return 1;
	}

	if (args.help) {
		printHelp();
		return 0;
	}

	if (args.version) {
		console.log(VERSION);
		return 0;
	}

	if (!args.inputPath && !args.runCommand) {
		console.error('Error: Either --input <compose.yml> or --run "<docker run ...>" is required.');
		console.error('Run with --help for full usage instructions or visit https://quadletgen.com');
		return 1;
	}

	let rawInput = '';
	let inferredStack = 'app';

	if (args.inputPath) {
		const resolvedPath = path.resolve(process.cwd(), args.inputPath);
		if (!existsSync(resolvedPath)) {
			console.error(`Error: Input file not found: ${resolvedPath}`);
			return 1;
		}
		try {
			rawInput = readFileSync(resolvedPath, 'utf8');
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`Error reading input file: ${message}`);
			return 1;
		}

		const parsedPath = path.parse(args.inputPath);
		const base = parsedPath.name;
		if (base && base !== 'docker-compose' && base !== 'compose') {
			inferredStack = base;
		} else {
			const parentDir = path.basename(parsedPath.dir || process.cwd());
			if (parentDir && parentDir !== '.' && parentDir !== '/') {
				inferredStack = parentDir;
			}
		}
	} else if (args.runCommand) {
		rawInput = args.runCommand;
	}

	const stackName = args.stackName || inferredStack;

	const convertOptions: QuadletConvertOptions = {
		stackName,
		installScope: args.installScope,
		selinuxMode: args.selinuxMode,
		enableAutoUpdate: args.enableAutoUpdate,
		generateSharedNetwork: args.generateSharedNetwork,
		extractSecretsToEnvFile: args.extractSecretsToEnvFile,
	};

	const result = convertToQuadlet(rawInput, convertOptions);

	if (!result.ok) {
		console.error(`Conversion failed: ${result.error}`);
		return 1;
	}

	if (result.warnings.length > 0) {
		for (const warning of result.warnings) {
			const prefix = warning.service ? `[${warning.service}] ` : '';
			console.error(`Warning: ${prefix}${warning.message}`);
		}
	}

	if (args.outDir) {
		const resolvedOutDir = path.resolve(process.cwd(), args.outDir);
		try {
			mkdirSync(resolvedOutDir, { recursive: true });
			for (const file of result.files) {
				const filePath = path.join(resolvedOutDir, file.filename);
				writeFileSync(filePath, file.content, 'utf8');
			}
			console.error(
				`Successfully wrote ${result.files.length} Quadlet file(s) to ${resolvedOutDir}`,
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`Error writing output files: ${message}`);
			return 1;
		}
	}

	if (args.zipPath) {
		const resolvedZipPath = path.resolve(process.cwd(), args.zipPath);
		try {
			const zipParent = path.dirname(resolvedZipPath);
			mkdirSync(zipParent, { recursive: true });
			const zipBytes = buildZipArchive(result.files);
			writeFileSync(resolvedZipPath, zipBytes);
			console.error(
				`Successfully exported ${result.files.length} Quadlet file(s) to ${resolvedZipPath}`,
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`Error writing ZIP file: ${message}`);
			return 1;
		}
	}

	if (args.stdout) {
		for (let i = 0; i < result.files.length; i += 1) {
			const file = result.files[i];
			if (result.files.length > 1) {
				console.log(`### FILE: ${file.filename} (${file.installPath}) ###`);
			}
			console.log(file.content);
			if (i < result.files.length - 1) {
				console.log('');
			}
		}
	}

	return 0;
}

if (process.argv[1] && (process.argv[1].endsWith('compose-to-quadlet.mjs') || process.argv[1].endsWith('cli.ts'))) {
	runCli(process.argv.slice(2)).then((code) => {
		if (code !== 0) {
			process.exit(code);
		}
	});
}
