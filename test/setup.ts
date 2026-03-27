import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/moyu_test';
  process.env.NEXTAUTH_SECRET = 'test-secret-for-testing';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.MINIMAX_API_KEY = 'test-api-key';
  process.env.MINIMAX_GROUP_ID = 'test-group-id';
});

afterAll(() => {
  delete process.env.DATABASE_URL;
  delete process.env.NEXTAUTH_SECRET;
  delete process.env.NEXTAUTH_URL;
  delete process.env.MINIMAX_API_KEY;
  delete process.env.MINIMAX_GROUP_ID;
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

global.fetch = vi.fn();
