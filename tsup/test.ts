import type { Options } from '.';

import { DIR_SRC_TEST } from './constants';
import {addRecursive} from './addRecursive';


export default function buildServerConfig(): Options {
	const entry: string[] = [];
	addRecursive(DIR_SRC_TEST, entry);

	return {
		bundle: true,
		dts: false, // d.ts files are use useless at runtime
		entry,
		esbuildOptions(options, context) {
			options.chunkNames = '_chunks/[name]-[hash]';

			options.mainFields = ['module', 'main'];

			options.outbase = DIR_SRC_TEST;
		},
		esbuildPlugins: [],
		external: [
			/^\//,
		],
		format: 'cjs',
		inject: [
		],
		minify: false, // Minifying server files makes debugging harder

		noExternal: [],

		platform: 'neutral',
		silent: ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE||''),
		shims: false, // https://tsup.egoist.dev/#inject-cjs-and-esm-shims
		splitting: true,
		sourcemap: false,
		target: 'es5',
		tsconfig: `${DIR_SRC_TEST}/tsconfig.json`,
	};
}

