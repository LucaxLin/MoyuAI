import { beforeEach, vi } from 'vitest';
import { createFetchMock } from './helpers/fetch-mock';

beforeEach(() => {
  global.fetch = createFetchMock();
});
