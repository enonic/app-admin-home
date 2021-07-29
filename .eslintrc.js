module.exports = {
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 2019,
        'project': 'tsconfig.json',
        'tsconfigRootDir': '.',
    },
    'rules': {
        'max-len': ['error', {'code': 140, 'comments': 180}],
        'block-spacing': ['error', 'always'],
        'space-before-function-paren': ['error', {'anonymous': 'always', 'named': 'never'}],
        'space-in-parens': ['error', 'never'],
        'object-curly-spacing': ['error', 'never'],
        'lines-between-class-members': ['error', 'always', {exceptAfterSingleLine: true}],
        'arrow-spacing': ['error', {'before': true, 'after': true}],
        'array-bracket-spacing': ['error', 'never'],
        'computed-property-spacing': ['error', 'never'],
        'template-curly-spacing': ['error', 'never'],
        'object-property-newline': ['off', {'allowMultiplePropertiesPerLine': true}],
        'quotes': ['error', 'single', {'avoidEscape': true}],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['off'],
        'semi': 'off',
        '@typescript-eslint/semi': ['error'],
        'no-control-regex': 'off',
        'comma-dangle': ['error', 'always-multiline'],
        'spaced-comment': ['error', 'always', {'exceptions': ['-', '+']}],
        '@typescript-eslint/no-use-before-define': ['error', {'functions': false, 'classes': true}],
        '@typescript-eslint/unbound-method': ['error', {ignoreStatic: true}],

        // TODO: Remove rules, during the refactoring

        // === CUSTOM RULES ===

        // '@typescript-eslint/explicit-function-return-type': ['error', {allowExpressions: true}],
        '@typescript-eslint/explicit-function-return-type': ['off'],

        // '@typescript-eslint/member-ordering': ['error'],
        '@typescript-eslint/member-ordering': ['off'],
    },
    'env': {
        'browser': true,
        'es6': true,
    }
};
