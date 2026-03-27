import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { server, mockUser } from '../helpers/mock-server';
import { apiRequest, ApiError, withAuth } from '../helpers/api-client';

describe('认证 API - 登录登出', () => {
  const validToken = 'valid-test-token';

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterAll(() => server.close());
  beforeEach(() => server.resetHandlers());

  describe('POST /api/auth/login - 用户登录', () => {
    it('应该使用正确的凭据成功登录', async () => {
      const response = await apiRequest<{ user: typeof mockUser; token: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'CorrectPass123',
          }),
        }
      );

      expect(response.user).toBeDefined();
      expect(response.user.id).toBe('user-123');
      expect(response.user.email).toBe('test@example.com');
      expect(response.token).toBeDefined();
      expect(typeof response.token).toBe('string');
    });

    it('使用错误邮箱时应返回 INVALID_CREDENTIALS 错误', async () => {
      try {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'wrong@example.com',
            password: 'CorrectPass123',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('INVALID_CREDENTIALS');
        expect((error as ApiError).message).toBe('邮箱或密码错误');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });

    it('使用错误密码时应返回 INVALID_CREDENTIALS 错误', async () => {
      try {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpass',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('INVALID_CREDENTIALS');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });

    it('缺少邮箱参数时应返回验证错误', async () => {
      try {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            password: 'CorrectPass123',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('缺少密码参数时应返回验证错误', async () => {
      try {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('邮箱格式不正确时应返回验证错误', async () => {
      try {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'invalid-email',
            password: 'CorrectPass123',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('POST /api/auth/logout - 用户登出', () => {
    it('已认证用户应该成功登出', async () => {
      const response = await apiRequest<{ message: string }>(
        '/auth/logout',
        {
          method: 'POST',
          headers: withAuth(validToken),
        }
      );

      expect(response.message).toBe('登出成功');
    });

    it('未认证用户登出应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe('GET /api/auth/session - 获取当前会话信息', () => {
    it('已认证用户应该成功获取会话信息', async () => {
      const response = await apiRequest<{ user: typeof mockUser }>(
        '/auth/session',
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.user).toBeDefined();
      expect(response.user.id).toBe('user-123');
      expect(response.user.email).toBe('test@example.com');
    });

    it('使用无效 Token 应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest('/auth/session', {
          headers: withAuth('invalid-token'),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });

    it('缺少认证头应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest('/auth/session');
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });
});
