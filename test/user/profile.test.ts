import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { server, mockUser } from '../helpers/mock-server';
import { apiRequest, ApiError, withAuth } from '../helpers/api-client';
import type { User } from '../helpers/api-client';

describe('用户设置 API', () => {
  const validToken = 'valid-test-token';

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterAll(() => server.close());
  beforeEach(() => server.resetHandlers());

  describe('GET /api/user/profile - 获取用户信息', () => {
    it('已认证用户应该成功获取自己的用户信息', async () => {
      const response = await apiRequest<{ user: User }>(
        '/user/profile',
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.user).toBeDefined();
      expect(response.user.id).toBe(mockUser.id);
      expect(response.user.email).toBe(mockUser.email);
    });

    it('用户信息应该包含必要字段', async () => {
      const response = await apiRequest<{ user: User }>(
        '/user/profile',
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.user).toHaveProperty('id');
      expect(response.user).toHaveProperty('email');
      expect(response.user).toHaveProperty('name');
      expect(response.user).toHaveProperty('avatar');
      expect(response.user).toHaveProperty('theme');
      expect(response.user).toHaveProperty('createdAt');
      expect(response.user).toHaveProperty('updatedAt');
    });

    it('用户信息不应该包含敏感字段', async () => {
      const response = await apiRequest<{ user: User }>(
        '/user/profile',
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.user).not.toHaveProperty('passwordHash');
      expect(response.user).not.toHaveProperty('password');
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest('/user/profile');
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe('PUT /api/user/profile - 更新用户信息', () => {
    it('已认证用户应该成功更新昵称', async () => {
      const newName = '新昵称';
      const response = await apiRequest<{ user: User }>(
        '/user/profile',
        {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ name: newName }),
        }
      );

      expect(response.user).toBeDefined();
      expect(response.user.name).toBe(newName);
    });

    it('已认证用户应该成功更新头像', async () => {
      const newAvatar = 'https://example.com/new-avatar.jpg';
      const response = await apiRequest<{ user: User }>(
        '/user/profile',
        {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ avatar: newAvatar }),
        }
      );

      expect(response.user).toBeDefined();
      expect(response.user.avatar).toBe(newAvatar);
    });

    it('同时更新昵称和头像应该成功', async () => {
      const newName = '新昵称';
      const newAvatar = 'https://example.com/new-avatar.jpg';
      const response = await apiRequest<{ user: User }>(
        '/user/profile',
        {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ name: newName, avatar: newAvatar }),
        }
      );

      expect(response.user.name).toBe(newName);
      expect(response.user.avatar).toBe(newAvatar);
    });

    it('昵称长度不应超过100字符', async () => {
      const longName = 'a'.repeat(101);

      try {
        await apiRequest('/user/profile', {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ name: longName }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('头像URL格式应该正确', async () => {
      const invalidAvatar = 'not-a-url';

      try {
        await apiRequest('/user/profile', {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ avatar: invalidAvatar }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('不应该允许修改邮箱', async () => {
      const response = await apiRequest<{ user: User }>(
        '/user/profile',
        {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ email: 'new@example.com' }),
        }
      );

      expect(response.user.email).toBe(mockUser.email);
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest('/user/profile', {
          method: 'PUT',
          body: JSON.stringify({ name: '新昵称' }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe('PUT /api/user/password - 修改密码', () => {
    it('已认证用户应该成功修改密码', async () => {
      const response = await apiRequest<{ message: string }>(
        '/user/password',
        {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({
            currentPassword: 'CorrectPass123',
            newPassword: 'NewSecurePass456',
          }),
        }
      );

      expect(response.message).toBe('密码修改成功');
    });

    it('使用错误当前密码应返回 INVALID_CREDENTIALS 错误', async () => {
      try {
        await apiRequest('/user/password', {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({
            currentPassword: 'wrongpassword',
            newPassword: 'NewSecurePass456',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('INVALID_CREDENTIALS');
        expect((error as ApiError).message).toBe('当前密码错误');
      }
    });

    it('新密码长度不应少于8位', async () => {
      try {
        await apiRequest('/user/password', {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({
            currentPassword: 'CorrectPass123',
            newPassword: 'weak',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('新密码应包含数字和字母', async () => {
      try {
        await apiRequest('/user/password', {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({
            currentPassword: 'CorrectPass123',
            newPassword: 'onlyletters',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('缺少当前密码应返回验证错误', async () => {
      try {
        await apiRequest('/user/password', {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({
            newPassword: 'NewSecurePass456',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('缺少新密码应返回验证错误', async () => {
      try {
        await apiRequest('/user/password', {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({
            currentPassword: 'CorrectPass123',
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
        await apiRequest('/user/password', {
          method: 'PUT',
          body: JSON.stringify({
            currentPassword: 'CorrectPass123',
            newPassword: 'NewSecurePass456',
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

  describe('PUT /api/user/theme - 更新主题偏好', () => {
    it('应该成功切换到浅色主题', async () => {
      const response = await apiRequest<{ user: User }>(
        '/user/theme',
        {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ theme: 'light' }),
        }
      );

      expect(response.user).toBeDefined();
      expect(response.user.theme).toBe('light');
    });

    it('应该成功切换到深色主题', async () => {
      const response = await apiRequest<{ user: User }>(
        '/user/theme',
        {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ theme: 'dark' }),
        }
      );

      expect(response.user).toBeDefined();
      expect(response.user.theme).toBe('dark');
    });

    it('应该成功切换到跟随系统主题', async () => {
      const response = await apiRequest<{ user: User }>(
        '/user/theme',
        {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ theme: 'system' }),
        }
      );

      expect(response.user).toBeDefined();
      expect(response.user.theme).toBe('system');
    });

    it('无效的主题值应返回验证错误', async () => {
      try {
        await apiRequest('/user/theme', {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({ theme: 'invalid-theme' }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('主题值应该是枚举类型之一', async () => {
      const validThemes = ['light', 'dark', 'system'];

      for (const theme of validThemes) {
        const response = await apiRequest<{ user: User }>(
          '/user/theme',
          {
            method: 'PUT',
            headers: withAuth(validToken),
            body: JSON.stringify({ theme }),
          }
        );

        expect(response.user.theme).toBe(theme);
      }
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest('/user/theme', {
          method: 'PUT',
          body: JSON.stringify({ theme: 'dark' }),
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
