import type { Options } from '.';


import CopyWithHashPlugin from '@enonic/esbuild-plugin-copy-with-hash';
import TsupPluginManifest from '@enonic/tsup-plugin-manifest';
// import { globalExternals, globalExternalsWithRegExp } from "@fal-works/esbuild-plugin-global-externals"; // Creates a local $2 :(
import GlobalsPlugin from 'esbuild-plugin-globals';
// import esbuildPluginExternalGlobal from 'esbuild-plugin-external-global'; // Doesn't support regex patterns :(
import {
    DIR_DST_STATIC,
    DIR_SRC_STATIC
} from './constants';


export default function buildStaticConfig(): Options {
    return {
        bundle: true,
        dts: false,
        entry: {
            'home/bundle': `${DIR_SRC_STATIC}/home/main.ts`,
            // 'launcher/bundle': `${DIR_SRC_STATIC}/launcher/main.ts`,
            'widgets/shortcuts': `${DIR_SRC_STATIC}/widgets/shortcuts.ts`,
        },
        esbuildOptions(options, context) {
            options.keepNames = true;
        },
        esbuildPlugins: [
            GlobalsPlugin({
                '@enonic/legacy-slickgrid.*'(modulename) {
                    return 'Slick';
                },
                'jquery': '$',
            }),
            CopyWithHashPlugin({
                context: 'node_modules',
                manifest: `node_modules-manifest.json`,
                patterns: [
                    '@enonic/legacy-slickgrid/index.js',
                    'jquery/dist/*.*',
                    'jquery-ui-dist/*.*',
                    // 'q/*.js',
                ]
            }),
            TsupPluginManifest({
                generate: (entries) => {// Executed once per format
                    const newEntries = {};
                    Object.entries(entries).forEach(([k,v]) => {
                        console.log(k,v);
                        const ext = v.split('.').pop() as string;
                        const parts = k.replace(`${DIR_SRC_STATIC}/`, '').split('.');
                        parts.pop();
                        parts.push(ext);
                        newEntries[parts.join('.')] = v.replace(`${DIR_DST_STATIC}/`, '');
                    });
                    return newEntries;
                }
            }),
        ], // plugins

        format: [
            'cjs'
        ],

        minify: false,
        // minify: process.env.NODE_ENV !== 'development',

        noExternal: [ // Same as dependencies in package.json
            /@enonic\/lib-admin-ui.*/,
            // It seems these need to be listed here for global plugins to work
            /@enonic\/legacy-slickgrid.*/,
            'jquery',
            'q',
        ],
        outDir: DIR_DST_STATIC,
        platform: 'browser',
        silent: ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE||''),
        splitting: false,

        // sourcemap: 'inline', // Needed for CopyWithHashPlugin to also copy .map files
        // sourcemap: true, // Needed for CopyWithHashPlugin to also copy .map files
        sourcemap: process.env.NODE_ENV === 'development',

        // INFO: Sourcemaps works when target is set here, rather than in tsconfig.json
        target: 'es2020',

        tsconfig: `${DIR_SRC_STATIC}/tsconfig.json`
    } as Options;
}
