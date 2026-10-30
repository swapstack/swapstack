import path from 'node:path';
import { fileURLToPath } from 'node:url';

import antfu from '@antfu/eslint-config';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import reactCompiler from 'eslint-plugin-react-compiler';
import testingLibrary from 'eslint-plugin-testing-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default antfu(
  {
    react: true,
    typescript: true,
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: true,
    },
    ignores: [
      'dist/*',
      'node_modules',
      '__tests__/',
      'coverage',
      '.expo',
      '.expo-shared',
      'android',
      'ios',
      '.vscode',
      'expo-env.d.ts',
      'migration/*',
      '.agents/**',
      '.github/**',
      'packages/*/dist/**',
    ],
  },
  {
    rules: {
      'max-params': ['warn', 4],
      'max-lines-per-function': ['error', {
        max: 180,
        skipBlankLines: true,
        skipComments: true,
      }],
      'react/display-name': 'off',
      'react/no-inline-styles': 'off',
      'react/destructuring-assignment': 'off',
      'react/require-default-props': 'off',
      'react-refresh/only-export-components': 'warn',
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: ['/android', '/ios', 'README.md', 'DESIGN.md', 'PRODUCT.md', 'THIRD_PARTY_NOTICES.md'],
        },
      ],
      'node/prefer-global/process': 'off',
      'test/no-import-node-test': 'off',
      'ts/no-require-imports': 'off',
      'ts/no-use-before-define': 'off',
      'no-console': 'off',
      'no-cond-assign': 'off',
      'regexp/no-super-linear-backtracking': 'off',
      'regexp/no-unused-capturing-group': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'ts/consistent-type-definitions': ['error', 'type'],
      'react-hooks/refs': 'off',
      'ts/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...betterTailwindcss.configs.recommended,
    settings: {
      'better-tailwindcss': {
        entryPoint: path.resolve(__dirname, './src/global.css'),
      },
    },
    rules: {
      ...betterTailwindcss.configs.recommended.rules,
      'better-tailwindcss/no-unnecessary-whitespace': 'warn',
      'better-tailwindcss/no-unknown-classes': 'warn',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
    },
  },
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    plugins: { 'testing-library': testingLibrary },
    rules: {
      ...testingLibrary.configs.react.rules,
    },
  },
);
