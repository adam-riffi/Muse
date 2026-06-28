import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['shared/**/*.test.ts', 'backend/**/*.test.ts', 'tests/**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'frontend',
          environment: 'jsdom',
          include: ['frontend/**/*.test.{ts,tsx}'],
          setupFiles: ['./frontend/src/test/setup.ts'],
        },
      },
    ],
  },
});
