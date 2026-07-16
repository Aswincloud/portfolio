import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default [
  {
    ignores: ['dist', 'build', 'node_modules', 'script.js', 'style.css', '.wrangler'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
        ...globals.jest,
        vi: 'readonly',
        global: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'react/no-unescaped-entities': 'off',
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
    settings: {
      react: {
        version: '18.2',
      },
    },
  },
  {
    files: ['server/**/*.js', 'worker.js'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    // Blog post modules intentionally co-locate a `meta` object with their
    // `Body` component (that's the post-registry contract), so the fast-refresh
    // "only export components" rule doesn't apply — these are content modules,
    // not HMR-refreshed component files.
    files: ['src/data/blog/**/*.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
];
