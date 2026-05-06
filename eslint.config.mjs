import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import unusedImports from 'eslint-plugin-unused-imports';
import vitestPlugin from 'eslint-plugin-vitest';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.json'],
        },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'import/no-unused-modules': [
        'error',
        {
          unusedExports: true,
          ignoreExports: [
            'src/**/*.test.js',
            'src/**/*.test.jsx',
            'src/mocks/**',
            /** Internal surfaces: same-file “private” exports and re-exports for the partition feature. */
            'src/features/drilldown/utils.js',
            'src/features/drilldown/selectors.js',
            'src/components/common/partition/partitionChartOptions.js',
            'src/features/partition/dmaPartitionModel.js',
            'src/app/store.js',
            'src/index.jsx',
            'vite.config.js',
            'vitest.config.mjs',
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.vitest,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'testing-library': testingLibrary,
      vitest: vitestPlugin,
    },
    rules: {
      ...testingLibrary.configs.react.rules,
      ...vitestPlugin.configs.recommended.rules,
      'import/no-unused-modules': 'off',
    },
  },
];
