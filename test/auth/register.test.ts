import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { server, mockUser } from '../helpers/mock-server';
import { apiRequest, ApiError } from '../helpers/api-client';

describe('认证 API - 注册流程', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterAll(() => server.close());
  beforeEach(() => server.resetHandlers());

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

    it('缺少邮箱参数时应返回验证错误', async () => {
      try {
        await apiRequest('/auth/register/send-code', {
          method: 'POST',
          body: JSON.stringify({
            password: 'SecurePass123',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('密码强度不足时应返回验证错误', async () => {
      try {
        await apiRequest('/auth/register/send-code', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'weak', // 少于8位
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('POST /api/auth/register/verify - 验证注册验证码', () => {
    it('应该成功验证并创建用户', async () => {
      const response = await apiRequest<{ user: typeof mockUser; token: string }>(
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
            code: '000000', // 模拟的错误验证码
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

    it('缺少验证码时应返回验证错误', async () => {
      try {
        await apiRequest('/auth/register/verify', {
          method: 'POST',
          body: JSON.stringify({
            email: 'newuser@example.com',
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('验证码格式不正确时应返回验证错误', async () => {
      try {
        await apiRequest('/auth/register/verify', {
          method: 'POST',
          body: JSON.stringify({
            email: 'newuser@example.com',
            code: 'abc', // 不是6位数字
          }),
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });
  });
});
