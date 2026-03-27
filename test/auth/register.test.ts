import { describe, it, expect } from 'vitest';
import { apiRequest, ApiError } from '../helpers/api-client';

describe('认证 API - 注册流程', () => {

  describe('POST /api/auth/register/send-code - 发送注册验证码', () => {
    it('应该成功发送验证码到有效邮箱', async () => {
      const response = await apiRequest<{ message: string; expiresIn: number }>(
        '/auth/register/send-code',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'SecurePass123',
          }),
        }
      );

      expect(response.message).toBe('验证码已发送到您的邮箱');
      expect(response.expiresIn).toBe(600);
    });

    it('当邮箱已被注册时应返回错误', async () => {
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
        expect((error as ApiError).message).toBe('该邮箱已注册');
        expect((error as ApiError).statusCode).toBe(400);
      }
    });
  });

  describe('POST /api/auth/register/verify - 验证注册验证码', () => {
    it('应该成功验证并创建用户', async () => {
      const response = await apiRequest<{ user: { email: string }; token: string }>(
        '/auth/register/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'newuser@example.com',
            code: '123456',
          }),
        }
      );

      expect(response.user).toBeDefined();
      expect(response.user.email).toBe('test@example.com');
      expect(response.token).toBeDefined();
      expect(typeof response.token).toBe('string');
    });

    it('验证码错误时应返回 INVALID_CODE 错误', async () => {
      try {
        await apiRequest('/auth/register/verify', {
          method: 'POST',
          body: JSON.stringify({
            email: 'newuser@example.com',
            code: '000000',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('INVALID_CODE');
        expect((error as ApiError).message).toBe('验证码错误或已过期');
        expect((error as ApiError).statusCode).toBe(400);
      }
    });
  });
});
