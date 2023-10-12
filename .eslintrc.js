module.exports = {
    extends: '@enonic/eslint-config',
    parserOptions: {
        project: [
            './src/main/resources/tsconfig.json',
            './src/main/resources/static/tsconfig.json'
        ],
        tsconfigRootDir: __dirname,
    },
    'rules': {
        'new-cap': ['warn', {'capIsNewExceptions': ['Q']}],

        // === CUSTOM RULES ===

        // '@typescript-eslint/explicit-function-return-type': ['error', {allowExpressions: true}],
        '@typescript-eslint/explicit-function-return-type': ['off'],

        // 'comma-dangle': ['error', 'always-multiline'],
        'comma-dangle': ['off'],

        // '@typescript-eslint/member-ordering': ['error'],
        '@typescript-eslint/member-ordering': ['off'],
    },
    'env': {
        'browser': true,
        'es6': true,
    }
};
