import inject from '@rollup/plugin-inject';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import path from 'path';
import postcssSortMediaQueries from 'postcss-sort-media-queries';
import {fileURLToPath} from 'url';
import {defineConfig, type UserConfig} from 'vite';

const allowedTargets = ['js', 'css'] as const;
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

  const IN_PATH = path.join(__dirname, 'src/main/resources/assets');
  const OUT_PATH = path.join(__dirname, 'build/resources/main/assets');

  const CONFIGS: Record<BuildTarget, UserConfig> = {
    js: {
      root: IN_PATH,
      base: './',

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
            'js/home/bundle': path.join(IN_PATH, 'js/home/main.ts'),
            'js/launcher/bundle': path.join(IN_PATH, 'js/launcher/main.ts'),
            'js/widgets/shortcuts': path.join(IN_PATH, 'js/widgets/shortcuts.ts')
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
    css: {
      root: IN_PATH,
      base: './',
      build: {
        outDir: OUT_PATH,
        emptyOutDir: false,
        minify: isProduction,
        sourcemap: isDevelopment,
        rollupOptions: {
          input: {
            'styles/home': path.join(IN_PATH, 'styles/home.less'),
            'styles/launcher': path.join(IN_PATH, 'styles/launcher.less'),
            'styles/widgets/shortcuts': path.join(IN_PATH, 'styles/widgets/shortcuts.less'),
            'styles/widgets/youtube': path.join(IN_PATH, 'styles/widgets/youtube.less')
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