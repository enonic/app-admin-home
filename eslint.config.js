const baseConfig = require('@enonic/eslint-config');
const { plugin: tsPlugin } = require('typescript-eslint');
const globals = require('globals');

module.exports = [
    ...baseConfig, // This includes the extended configuration from @enonic/eslint-config
    {
        files: ["**/*.ts", "**/*.tsx"], // Apply rules to TypeScript files
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.es6,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            'new-cap': ['warn', {'capIsNewExceptions': ['Q']}],

            // === CUSTOM RULES ===

            // '@typescript-eslint/explicit-function-return-type': ['error', {allowExpressions: true}],
            '@typescript-eslint/explicit-function-return-type': ['off'],

            // 'comma-dangle': ['error', 'always-multiline'],
            'comma-dangle': ['off'],

            // '@typescript-eslint/member-ordering': ['error'],
            '@typescript-eslint/member-ordering': ['off'],
        },
    },
    {
        ignores: [
            "**/node_modules/",
            "**/build/",
            "**/dist/",
            "**/testing/",
            "**/.xp/",
            "**/*.js",
            "**/*.d.ts",
            "**/spec/**/*",
        ]
    }
];

