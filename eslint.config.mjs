import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import astroPlugin from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**', 'public/media/images/_derived/**', 'playwright-report/**', 'test-results/**', '.migration-staging/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astroPlugin.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['**/*.astro'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      'jsx-a11y/alt-text': 'off', // Astro <img>/<Image> not JSX; alt-text enforced by our own Zod schemas instead.
    },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.ts', '*.config.{mjs,ts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['tests/e2e/**/*.ts'],
    rules: {
      // Playwright's `test.beforeEach(async ({}, testInfo) => ...)` needs
      // the empty fixtures pattern to reach the second (testInfo) param.
      'no-empty-pattern': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
);
