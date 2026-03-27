import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { server } from '../helpers/mock-server';
import { apiRequest, ApiError, withAuth } from '../helpers/api-client';

describe('错误处理和边界条件', () => {
  const validToken = 'valid-test-token';

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterAll(() => server.close());
  beforeEach(() => server.resetHandlers());

  describe('API 错误码验证', () => {
    it('VALIDATION_ERROR 应该返回 400 状态码', async () => {
      try {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'invalid-email',
            password: 'pass123',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
        expect((error as ApiError).statusCode).toBe(400);
      }
    });

    it('UNAUTHORIZED 应该返回 401 状态码', async () => {
      try {
        await apiRequest('/sessions', {
          headers: withAuth('invalid-token'),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });

    it('FORBIDDEN 应该返回 403 状态码', async () => {
      try {
        await apiRequest('/sessions/other-user-session', {
          headers: withAuth(validToken),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('FORBIDDEN');
        expect((error as ApiError).statusCode).toBe(403);
      }
    });

    it('NOT_FOUND 应该返回 404 状态码', async () => {
      try {
        await apiRequest('/sessions/not-found', {
          headers: withAuth(validToken),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('NOT_FOUND');
        expect((error as ApiError).statusCode).toBe(404);
      }
    });

    it('EMAIL_EXISTS 应该返回 400 状态码', async () => {
      try {
        await apiRequest('/auth/register/send-code', {
          method: 'POST',
          body: JSON.stringify({
            email: 'existing@example.com',
            password: 'SecurePass123',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('EMAIL_EXISTS');
        expect((error as ApiError).statusCode).toBe(400);
      }
    });

    it('INVALID_CODE 应该返回 400 状态码', async () => {
      try {
        await apiRequest('/auth/register/verify', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            code: '000000',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('INVALID_CODE');
        expect((error as ApiError).statusCode).toBe(400);
      }
    });

    it('INVALID_CREDENTIALS 应该返回 401 状态码', async () => {
      try {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'wrong@example.com',
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

    it('RATE_LIMITED 应该返回 429 状态码', async () => {
      server.use(
        ...[
          (await import('msw')).http.post('/api/auth/register/send-code', () => {
            return new Response(
              JSON.stringify({
                success: false,
                error: {
                  code: 'RATE_LIMITED',
                  message: '请求过于频繁，请稍后再试',
                },
              }),
              { status: 429 }
            );
          }),
        ]
      );

      try {
        await apiRequest('/auth/register/send-code', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'SecurePass123',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('RATE_LIMITED');
        expect((error as ApiError).statusCode).toBe(429);
      }
    });

    it('AI_SERVICE_ERROR 应该返回 500 状态码', async () => {
      server.use(
        ...[
          (await import('msw')).http.post('/api/sessions/:id/messages', () => {
            return new Response(
              JSON.stringify({
                success: false,
                error: {
                  code: 'AI_SERVICE_ERROR',
                  message: 'AI服务暂时不可用',
                },
              }),
              { status: 500 }
            );
          }),
        ]
      );

      try {
        await apiRequest('/sessions/session-123/messages', {
          method: 'POST',
          headers: withAuth(validToken),
          body: JSON.stringify({
            content: '帮我画一幅画',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('AI_SERVICE_ERROR');
        expect((error as ApiError).statusCode).toBe(500);
      }
    });

    it('INTERNAL_ERROR 应该返回 500 状态码', async () => {
      try {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'pass123',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('INTERNAL_ERROR');
        expect((error as ApiError).statusCode).toBe(500);
      }
    });
  });

  describe('边界条件测试', () => {
    it('空请求体应该返回验证错误', async () => {
      try {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('超长输入应该被拒绝', async () => {
      const longEmail = 'a'.repeat(300) + '@example.com';

      try {
        await apiRequest('/auth/register/send-code', {
          method: 'POST',
          body: JSON.stringify({
            email: longEmail,
            password: 'SecurePass123',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('特殊字符应该被正确处理', async () => {
      const specialEmail = 'test+special@example.com';

      const response = await apiRequest('/auth/register/send-code', {
        method: 'POST',
        body: JSON.stringify({
          email: specialEmail,
          password: 'SecurePass123',
        }),
      });

      expect(response).toBeDefined();
    });

    it('Unicode字符应该被正确处理', async () => {
      const unicodeContent = '帮我画一幅日落海景 🏖️';

      const response = await apiRequest<{ messages: any[] }>(
        '/sessions/session-123/messages',
        {
          headers: withAuth(validToken),
        }
      );

      expect(response).toBeDefined();
    });

    it('负数分页参数应该使用默认值', async () => {
      const response = await apiRequest<{ sessions: any[] }>(
        '/sessions?page=-1&limit=-10',
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.sessions).toBeDefined();
    });

    it('超大分页参数应该被限制', async () => {
      try {
        await apiRequest('/sessions?page=1&limit=10000', {
          headers: withAuth(validToken),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('网络错误处理', () => {
    it('网络超时应该返回超时错误', async () => {
      vi.useFakeTimers();

      const requestPromise = apiRequest('/sessions', {
        headers: withAuth(validToken),
      });

      await vi.advanceTimersByTime(60000);

      try {
        await requestPromise;
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('timeout');
      }

      vi.useRealTimers();
    });

    it('服务器无响应应该返回连接错误', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        await apiRequest('/sessions', {
          headers: withAuth(validToken),
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });
});
