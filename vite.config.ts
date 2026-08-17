import inject from '@rollup/plugin-inject';
import autoprefixer from 'autoprefixer';
import {readdirSync, readFileSync} from 'node:fs';
import {brotliCompressSync, constants as zlibConstants, gzipSync} from 'node:zlib';
import cssnano from 'cssnano';
import path from 'path';
import postcssSortMediaQueries from 'postcss-sort-media-queries';
import {fileURLToPath} from 'url';
import {defineConfig, type Plugin, type UserConfig} from 'vite';

const allowedTargets = ['js', 'css', 'loader'] as const;
type BuildTarget = (typeof allowedTargets)[number];

const isBuildTarget = (target: string | undefined): target is BuildTarget => {
  return allowedTargets.includes(target as BuildTarget);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url)) ?? '';

export default defineConfig(({mode}) => {
  const {BUILD_TARGET} = process.env;
  const target = isBuildTarget(BUILD_TARGET) ? BUILD_TARGET : 'js';

  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  const COMPRESSIBLE = /\.(js|mjs|css|svg|json|xml|txt|webmanifest)$/;

  // Emits buildtime.json (a cache-busting timestamp embedded in asset URLs so
  // lib-static's default "immutable" cache-control is safe across upgrades) and,
  // in production, .gz/.br siblings for compressible assets. `stamp` should be
  // true for exactly one build target so the timestamp is written once.
  const assetPipeline = ({stamp}: {stamp: boolean}): Plugin => ({
    name: 'admin-home:asset-pipeline',
    apply: 'build',
    generateBundle(_options, bundle) {
      if (isProduction) {
        for (const fileName of Object.keys(bundle)) {
          if (!COMPRESSIBLE.test(fileName)) {
            continue;
          }
          const chunk = bundle[fileName];
          const source = Buffer.from(
            (chunk.type === 'asset' ? chunk.source : chunk.code) as string | Uint8Array
          );

          const gz = gzipSync(source, {level: 9});
          if (gz.length < source.length) {
            this.emitFile({type: 'asset', fileName: `${fileName}.gz`, source: gz});
          }

          const br = brotliCompressSync(source, {
            params: {[zlibConstants.BROTLI_PARAM_QUALITY]: 11}
          });
          if (br.length < source.length) {
            this.emitFile({type: 'asset', fileName: `${fileName}.br`, source: br});
          }
        }
      }

      if (stamp) {
        this.emitFile({
          type: 'asset',
          fileName: 'buildtime.json',
          source: JSON.stringify({timeSinceEpoch: Date.now()})
        });
      }
    }
  });

  const IN_PATH = path.join(__dirname, 'src/main/resources/assets');
  const OUT_PATH = path.join(__dirname, 'build/resources/main/assets');

  const copyStatic = (dirs: string[]): Plugin => ({
    name: 'admin-home:copy-static',
    apply: 'build',
    generateBundle() {
      const walk = (dir: string): string[] =>
        readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
          const full = path.join(dir, entry.name);
          return entry.isDirectory() ? walk(full) : [full];
        });

      for (const dir of dirs) {
        for (const file of walk(path.join(IN_PATH, dir))) {
          this.emitFile({
            type: 'asset',
            fileName: path.relative(IN_PATH, file).split(path.sep).join('/'),
            source: readFileSync(file)
          });
        }
      }
    }
  });

  const CONFIGS: Record<BuildTarget, UserConfig> = {
    js: {
      root: IN_PATH,
      base: './',

      plugins: [copyStatic(['icons', 'images']), assetPipeline({stamp: true})],

      build: {
        outDir: OUT_PATH,
        emptyOutDir: false,
        target: 'ES2023',
        minify: isProduction,
        sourcemap: isDevelopment ? true : false,
        ...(isProduction && {
          reportCompressedSize: true,
          chunkSizeWarningLimit: 1000
        }),
        rollupOptions: {
          plugins: [
            inject({
              $: 'jquery',
              jQuery: 'jquery',
              'window.jQuery': 'jquery'
            }),
          ],
          input: {
            'js/dashboard/bundle': path.join(IN_PATH, 'js/dashboard/main.ts'),
            'js/menu/bundle': path.join(IN_PATH, 'js/menu/main.ts')
          },
          output: {
            format: 'es',
            entryFileNames: '[name].js',
            chunkFileNames: 'js/chunks/[name]-[hash].js',
            assetFileNames: (assetInfo) => {
              const assetName = assetInfo.names?.[0] ?? '';
              if (/\.(svg|png|jpg|gif|ico)$/.test(assetName)) {
                return 'icons/[name][extname]';
              }
              if (/\.(woff|woff2|ttf|eot)$/.test(assetName)) {
                return 'fonts/[name][extname]';
              }
              return '[name][extname]';
            },
            ...(isProduction && {
              compact: true,
              generatedCode: {
                constBindings: true
              }
            })
          },
          external: []
        }
      },
      esbuild: {
        minifyIdentifiers: false,
        keepNames: true,
        treeShaking: true,
        ...(isProduction && {
          drop: ['console', 'debugger'],
          legalComments: 'none'
        })
      },
      resolve: {
        alias: {
          '@enonic/lib-admin-ui': path.join(__dirname, '.xp/dev/lib-admin-ui')
        },
        extensions: ['.ts', '.js']
      },
      ...(isDevelopment && {
        server: {
          open: false,
          hmr: true
        },
        clearScreen: false
      }),
      ...(isProduction && {
        logLevel: 'warn'
      })
    },
    loader: {
      root: IN_PATH,
      base: './',
      plugins: [assetPipeline({stamp: false})],
      build: {
        outDir: OUT_PATH,
        emptyOutDir: false,
        target: 'ES2023',
        minify: isProduction,
        sourcemap: isDevelopment ? true : false,
        rollupOptions: {
          plugins: [
            inject({
              $: 'jquery',
              jQuery: 'jquery',
              'window.jQuery': 'jquery'
            }),
          ],
          input: path.join(IN_PATH, 'js/menu/loader.ts'),
          output: {
            format: 'es',
            entryFileNames: 'js/menu/loader.js',
            inlineDynamicImports: true,
            ...(isProduction && {
              compact: true,
              generatedCode: {
                constBindings: true
              }
            })
          }
        }
      },
      esbuild: {
        minifyIdentifiers: false,
        keepNames: true,
        treeShaking: true,
        ...(isProduction && {
          drop: ['console', 'debugger'],
          legalComments: 'none'
        })
      },
      resolve: {
        alias: {
          '@enonic/lib-admin-ui': path.join(__dirname, '.xp/dev/lib-admin-ui')
        },
        extensions: ['.ts', '.js']
      },
      ...(isProduction && {
        logLevel: 'warn'
      })
    },
    css: {
      root: IN_PATH,
      base: './',
      plugins: [assetPipeline({stamp: false})],
      build: {
        outDir: OUT_PATH,
        emptyOutDir: false,
        minify: isProduction,
        sourcemap: isDevelopment,
        rollupOptions: {
          input: {
            'styles/dashboard': path.join(IN_PATH, 'styles/dashboard.less'),
            'styles/menu': path.join(IN_PATH, 'styles/menu.less'),
            'styles/extensions/youtube': path.join(IN_PATH, 'styles/extensions/youtube.less')
          },
          output: {
            assetFileNames: (assetInfo) => {
              const assetName = assetInfo.names?.[0] ?? '';
              if (assetName.endsWith('.css')) {
                const name = assetName.replace(/\.(less|css)$/, '');
                return `${name}.css`;
              }
              if (/\.(svg|png|jpg|gif|ico)$/.test(assetName)) {
                return 'icons/[name][extname]';
              }
              if (/\.(woff|woff2|ttf|eot)$/.test(assetName)) {
                return 'fonts/[name][extname]';
              }
              return '[name][extname]';
            }
          }
        }
      },
      resolve: {
        alias: {
          '~enonic-admin-artifacts': 'enonic-admin-artifacts/index.less'
        },
        extensions: ['.less', '.css']
      },
      css: {
        preprocessorOptions: {
          less: {
            javascriptEnabled: true
          }
        },
        postcss: {
          plugins: [
            autoprefixer(),
            postcssSortMediaQueries({sort: 'desktop-first'}),
            ...(isProduction ? [cssnano({preset: ['default', {normalizeUrl: false}]})] : [])
          ]
        }
      }
    }
  };

  return CONFIGS[target];
});
