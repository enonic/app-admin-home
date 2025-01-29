module.exports = {
    extends: '@enonic/eslint-config',
    parserOptions: {
        project: './tsconfig.json',
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
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
    },
    'env': {
        'browser': true,
        'es6': true,
    }
};
