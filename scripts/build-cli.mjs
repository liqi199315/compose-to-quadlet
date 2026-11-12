import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

async function buildCli() {
	await esbuild.build({
		entryPoints: [path.join(projectRoot, 'src/cli.ts')],
		bundle: true,
		platform: 'node',
		format: 'esm',
		target: 'node18',
		banner: {
			js: `#!/usr/bin/env node\nimport { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);`,
		},
		outfile: path.join(projectRoot, 'bin/compose-to-quadlet.mjs'),
	});
	console.log('Built bin/compose-to-quadlet.mjs successfully.');
}

buildCli().catch((err) => {
	console.error('Failed to build CLI:', err);
	process.exit(1);
});
