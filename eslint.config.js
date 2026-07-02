import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/build/**', '**/coverage/**', '**/node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  // Boundary guardrail: the frontend must never import backend code. Cross the boundary only via
  // the shared contracts (@muse/shared) and the API client.
  {
    files: ['frontend/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@muse/backend', '@muse/backend/*', '**/backend/**'],
              message:
                'The frontend must not import backend code — cross the boundary via @muse/shared and the API client.',
            },
          ],
        },
      ],
    },
  },
  // Boundary guardrail: UI components stay presentational — they must not call the network client
  // directly. Do network in a store (state/*); pure URL builders live in api/urls.
  {
    files: ['frontend/src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@muse/backend', '@muse/backend/*', '**/backend/**'],
              message: 'The frontend must not import backend code.',
            },
            {
              group: ['**/api/client'],
              message:
                'Components must not call the API directly — use a store (state/*). URL builders live in api/urls.',
            },
          ],
        },
      ],
    },
  },
);
