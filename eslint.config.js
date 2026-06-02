import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // Must come last: disables ESLint rules that conflict with Prettier.
      prettier,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Import order: packages → components → store/logic → types/constants.
      // Each group alphabetised; one blank line between groups (auto-fixable).
      'simple-import-sort/imports': [
        'error',
        {
          // Note: simple-import-sort appends a NUL ("\0") to `import type`
          // specifiers, so every end-of-segment anchor allows an optional \0.
          groups: [
            // Side-effect imports (e.g. "./index.css").
            ['^\\u0000'],
            // 1. Packages — node builtins and external modules.
            ['^node:', '^@?\\w'],
            // 2. Components — @/ paths under a components/ dir (excluding type/constant files).
            ['^@/(?!.*(?:/types|/constants|\\.types)).*/components(?:/|\\0|$)'],
            // 3. Store / configs / hooks / utils / helpers (the logic layer).
            ['^@/.*/(?:store|configs|hooks|utils)(?:/|\\0|$)', '^@/.*helper'],
            // 4. Types & constants (incl. type files colocated under components/).
            ['^@/.*/(?:types|constants)(?:/|\\0|$)', '^@/.*\\.types\\0?$'],
            // 5. Anything else from @/ or relative imports.
            ['^@/', '^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      // Type-only imports must use `import type` (auto-fixable).
      '@typescript-eslint/consistent-type-imports': 'error',
      // Enforce the `@/` alias — no relative parent imports.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message: 'Use the @/ alias instead of relative parent imports.',
            },
          ],
        },
      ],
    },
  },
])
