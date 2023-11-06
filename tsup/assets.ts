import type { Options } from '.';

// import { globalExternals, globalExternalsWithRegExp } from "@fal-works/esbuild-plugin-global-externals"; // Creates a local $2 :(
    import GlobalsPlugin from 'esbuild-plugin-globals';
    // import esbuildPluginExternalGlobal from 'esbuild-plugin-external-global'; // Doesn't support regex patterns :(

import {
    DIR_DST_ASSETS,
    DIR_SRC_ASSETS
} from './constants';

export default function buildAssetConfig(): Options {
    return {
        bundle: true,
        dts: false, // d.ts files are use useless at runtime
        entry: {
            'js/launcher/bundle': `${DIR_SRC_ASSETS}/js/launcher/main.ts`,
        },
        esbuildOptions(options, context) {
            options.banner = {
                js: `const jQuery = $;` // jQuery UI Tabbable requires this
            };
        },
        esbuildPlugins: [
            GlobalsPlugin({
                '@enonic/legacy-slickgrid.*'(modulename) {
                    return 'Slick';
                },
                'jquery': '$',
                'q': 'Q',
            }),
        ],
        format: [
            'cjs'
        ],
        minify: process.env.NODE_ENV !== 'development',
        noExternal: [ // Same as dependencies in package.json
            /@enonic\/lib-admin-ui/,
            // It seems these need to be listed here for global plugins to work
            /@enonic\/legacy-slickgrid.*/,
            'jquery', // This will bundle jQuery into the bundle, unless you use the esbuildPluginExternalGlobal
            'q'
        ],
        outDir: DIR_DST_ASSETS,
        platform: 'browser',
        silent: ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE||''),
        sourcemap: process.env.NODE_ENV === 'development',
        tsconfig: `${DIR_SRC_ASSETS}/tsconfig.json`,
    };
}
