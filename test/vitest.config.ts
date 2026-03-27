import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./setup.ts'],
    include: ['./*.test.ts', './**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'setup.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../apps/web/src'),
      '@moyu/shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },
});
