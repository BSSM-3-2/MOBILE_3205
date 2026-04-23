import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
    expoConfig,
    {
        languageOptions: {
            ecmaVersion: 2021,
            globals: {
                ...globals.browser,
                ...globals.amd,
                ...globals.node,
            },
        },
        plugins: {
            'unused-imports': unusedImports,
            ts: typescriptEslintPlugin,
        },
        rules: {
            'no-unused-vars': 'off',
            'ts/no-unused-vars': 'off',

            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],

            'ts/no-explicit-any': 'off',

            'ts/no-unsafe-function-type': 'off',
            'ts/no-empty-object-type': 'off',

            'ts/naming-convention': [
                'error',
                {
                    selector: 'typeParameter',
                    format: ['PascalCase'],
                },
                {
                    selector: 'class',
                    format: ['PascalCase'],
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
            ],

            'prettier/prettier': 'error',
        },
        ignores: ['dist/*', 'commitlint.config.js', 'eslint.config.mjs'],
    },
    eslintPluginPrettierRecommended,
]);
