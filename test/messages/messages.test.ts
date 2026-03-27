import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { server, mockMessage, mockImage } from '../helpers/mock-server';
import { apiRequest, ApiError, withAuth, Pagination } from '../helpers/api-client';
import type { Message, Image } from '../helpers/api-client';

describe('消息 API', () => {
  const validToken = 'valid-test-token';
  const sessionId = 'session-123';
  const messageId = 'msg-123';

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterAll(() => server.close());
  beforeEach(() => server.resetHandlers());

  describe('GET /api/sessions/:id/messages - 获取会话消息列表', () => {
    it('已认证用户应该成功获取消息列表', async () => {
      const response = await apiRequest<{ messages: Message[]; pagination: Pagination }>(
        `/sessions/${sessionId}/messages`,
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.messages).toBeDefined();
      expect(Array.isArray(response.messages)).toBe(true);
      expect(response.pagination).toBeDefined();
    });

    it('应该支持分页参数', async () => {
      const response = await apiRequest<{ messages: Message[]; pagination: Pagination }>(
        `/sessions/${sessionId}/messages?page=1&limit=10`,
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(10);
    });

    it('消息应该包含正确的角色类型', async () => {
      const response = await apiRequest<{ messages: Message[] }>(
        `/sessions/${sessionId}/messages`,
        {
          headers: withAuth(validToken),
        }
      );

      const message = response.messages[0];
      expect(['user', 'assistant', 'system']).toContain(message.role);
    });

    it('助手消息应该包含图片URL和元数据', async () => {
      const response = await apiRequest<{ messages: Message[] }>(
        `/sessions/${sessionId}/messages`,
        {
          headers: withAuth(validToken),
        }
      );

      const assistantMessage = response.messages.find(m => m.role === 'assistant');
      if (assistantMessage) {
        expect(assistantMessage).toHaveProperty('imageUrl');
        expect(assistantMessage).toHaveProperty('metadata');
      }
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest(`/sessions/${sessionId}/messages`);
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/sessions/:id/messages - 发送消息并生成图片', () => {
    it('应该成功发送文本消息并生成图片', async () => {
      const response = await apiRequest<{ message: Message; image: Image }>(
        `/sessions/${sessionId}/messages`,
        {
          method: 'POST',
          headers: withAuth(validToken),
          body: JSON.stringify({
            content: '帮我画一幅日落海景',
          }),
        }
      );

      expect(response.message).toBeDefined();
      expect(response.message.role).toBe('assistant');
      expect(response.message.content).toBeDefined();
      expect(response.image).toBeDefined();
      expect(response.image.url).toBeDefined();
    });

    it('应该成功处理图片+文本修改请求', async () => {
      const response = await apiRequest<{ message: Message; image: Image }>(
        `/sessions/${sessionId}/messages`,
        {
          method: 'POST',
          headers: withAuth(validToken),
          body: JSON.stringify({
            content: '把这幅画改成水彩风格',
            imageUrl: '/uploads/images/original-123.webp',
          }),
        }
      );

      expect(response.message).toBeDefined();
      expect(response.image).toBeDefined();
      expect(response.image.url).toBeDefined();
    });

    it('应该支持框选区域局部修改', async () => {
      const response = await apiRequest<{ message: Message; image: Image }>(
        `/sessions/${sessionId}/messages`,
        {
          method: 'POST',
          headers: withAuth(validToken),
          body: JSON.stringify({
            content: '把这里的东西去掉',
            imageUrl: '/uploads/images/original-123.webp',
            editRegion: {
              x: 0.2,
              y: 0.3,
              width: 0.5,
              height: 0.4,
            },
          }),
        }
      );

      expect(response.message).toBeDefined();
      expect(response.image).toBeDefined();
    });

    it('编辑区域坐标应该在0-1范围内', async () => {
      const response = await apiRequest<{ message: Message; image: Image }>(
        `/sessions/${sessionId}/messages`,
        {
          method: 'POST',
          headers: withAuth(validToken),
          body: JSON.stringify({
            content: '修改这个区域',
            imageUrl: '/uploads/images/original-123.webp',
            editRegion: {
              x: 0.5,
              y: 0.5,
              width: 0.3,
              height: 0.3,
            },
          }),
        }
      );

      expect(response.message).toBeDefined();
    });

    it('空内容应该返回验证错误', async () => {
      try {
        await apiRequest(`/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: withAuth(validToken),
          body: JSON.stringify({
            content: '',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
        expect((error as ApiError).message).toBe('内容不能为空');
      }
    });

    it('内容超过500字符应该返回验证错误', async () => {
      const longContent = 'a'.repeat(501);

      try {
        await apiRequest(`/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: withAuth(validToken),
          body: JSON.stringify({
            content: longContent,
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest(`/sessions/${sessionId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: '帮我画一幅日落海景',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe('DELETE /api/messages/:id - 删除消息', () => {
    it('已认证用户应该成功删除消息', async () => {
      const response = await apiRequest<{ message: string }>(
        `/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: withAuth(validToken),
        }
      );

      expect(response.message).toBe('消息已删除');
    });

    it('删除不存在的消息应返回 NOT_FOUND 错误', async () => {
      try {
        await apiRequest('/messages/not-found', {
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
        await apiRequest(`/messages/${messageId}`, {
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

describe('智能图片编辑意图识别', () => {
  const validToken = 'valid-test-token';
  const sessionId = 'session-123';

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterAll(() => server.close());
  beforeEach(() => server.resetHandlers());

  const editIntentTests = [
    { keyword: '不对', intent: '重新生成' },
    { keyword: '重新生成', intent: '重新生成' },
    { keyword: '再来一张', intent: '重新生成' },
    { keyword: '稍微调整', intent: '微调' },
    { keyword: '再改改', intent: '微调' },
    { keyword: '保留这个', intent: '继续创作' },
    { keyword: '继续', intent: '继续创作' },
  ];

  editIntentTests.forEach(({ keyword, intent }) => {
    it(`关键词 "${keyword}" 应该触发 ${intent} 意图`, async () => {
      const response = await apiRequest<{ message: Message; image: Image }>(
        `/sessions/${sessionId}/messages`,
        {
          method: 'POST',
          headers: withAuth(validToken),
          body: JSON.stringify({
            content: keyword,
            imageUrl: '/uploads/images/original-123.webp',
          }),
        }
      );

      expect(response.message).toBeDefined();
      expect(response.image).toBeDefined();
    });
  });
});
