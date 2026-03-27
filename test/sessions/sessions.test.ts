import { describe, it, expect } from 'vitest';
import { apiRequest, ApiError, withAuth, Pagination } from '../helpers/api-client';
import type { Session } from '../helpers/api-client';

describe('会话 API', () => {
  const validToken = 'valid-test-token';
  const sessionId = 'session-123';

  describe('GET /api/sessions - 获取用户所有会话列表', () => {
    it('已认证用户应该成功获取会话列表', async () => {
      const response = await apiRequest<{ sessions: Session[]; pagination: Pagination }>(
        '/sessions',
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.sessions).toBeDefined();
      expect(Array.isArray(response.sessions)).toBe(true);
      expect(response.sessions.length).toBeGreaterThan(0);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(20);
    });

    it('应该返回正确的会话数据结构', async () => {
      const response = await apiRequest<{ sessions: Session[] }>(
        '/sessions',
        {
          headers: withAuth(validToken),
        }
      );

      const session = response.sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('userId');
      expect(session).toHaveProperty('title');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest('/sessions');
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/sessions - 创建新会话', () => {
    it('已认证用户应该成功创建新会话', async () => {
      const response = await apiRequest<{ session: Session }>(
        '/sessions',
        {
          method: 'POST',
          headers: withAuth(validToken),
        }
      );

      expect(response.session).toBeDefined();
      expect(response.session.id).toBeDefined();
      expect(response.session.userId).toBe('user-123');
      expect(response.session.createdAt).toBeDefined();
    });

    it('新会话应该默认包含标题字段', async () => {
      const response = await apiRequest<{ session: Session }>(
        '/sessions',
        {
          method: 'POST',
          headers: withAuth(validToken),
        }
      );

      expect(response.session).toHaveProperty('title');
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest('/sessions', {
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

  describe('GET /api/sessions/:id - 获取会话详情', () => {
    it('已认证用户应该成功获取会话详情', async () => {
      const response = await apiRequest<{ session: Session; messages: any[] }>(
        `/sessions/${sessionId}`,
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.session).toBeDefined();
      expect(response.session.id).toBe(sessionId);
      expect(response.messages).toBeDefined();
    });

    it('获取不存在的会话应返回 NOT_FOUND 错误', async () => {
      try {
        await apiRequest('/sessions/not-found', {
          headers: withAuth(validToken),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('NOT_FOUND');
        expect((error as ApiError).message).toBe('会话不存在');
        expect((error as ApiError).statusCode).toBe(404);
      }
    });

    it('会话详情应该包含关联消息', async () => {
      const response = await apiRequest<{ session: Session; messages: any[] }>(
        `/sessions/${sessionId}`,
        {
          headers: withAuth(validToken),
        }
      );

      expect(Array.isArray(response.messages)).toBe(true);
      expect(response.messages.length).toBeGreaterThan(0);
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest(`/sessions/${sessionId}`);
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe('PUT /api/sessions/:id - 更新会话', () => {
    it('已认证用户应该成功更新会话标题', async () => {
      const newTitle = '新的会话标题';
      const response = await apiRequest<{ session: Session }>(
        `/sessions/${sessionId}`,
        {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ title: newTitle }),
        }
      );

      expect(response.session).toBeDefined();
      expect(response.session.title).toBe(newTitle);
    });

    it('更新不存在的会话应返回 NOT_FOUND 错误', async () => {
      try {
        await apiRequest('/sessions/not-found', {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ title: '新标题' }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('NOT_FOUND');
        expect((error as ApiError).statusCode).toBe(404);
      }
    });

    it('会话标题长度应有限制（不超过200字符）', async () => {
      const longTitle = 'a'.repeat(201);

      try {
        await apiRequest(`/sessions/${sessionId}`, {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ title: longTitle }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest(`/sessions/${sessionId}`, {
          method: 'PUT',
          body: JSON.stringify({ title: '新标题' }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe('DELETE /api/sessions/:id - 删除会话', () => {
    it('已认证用户应该成功删除会话', async () => {
      const response = await apiRequest<{ message: string }>(
        `/sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: withAuth(validToken),
        }
      );

      expect(response.message).toBe('会话已删除');
    });

    it('删除不存在的会话应返回 NOT_FOUND 错误', async () => {
      try {
        await apiRequest('/sessions/not-found', {
          method: 'DELETE',
          headers: withAuth(validToken),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('NOT_FOUND');
        expect((error as ApiError).statusCode).toBe(404);
      }
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest(`/sessions/${sessionId}`, {
          method: 'DELETE',
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });
});
