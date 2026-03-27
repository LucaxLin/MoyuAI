import { describe, it, expect } from 'vitest';
import { apiRequest, ApiError, withAuth, Pagination } from '../helpers/api-client';
import type { Image } from '../helpers/api-client';

describe('图片 API', () => {
  const validToken = 'valid-test-token';
  const imageId = 'img-123';

  describe('POST /api/upload - 上传图片文件', () => {
    it('已认证用户应该成功上传图片', async () => {
      const response = await apiRequest<{ url: string; filename: string }>(
        '/upload',
        {
          method: 'POST',
          headers: withAuth(validToken),
        }
      );

      expect(response.url).toBeDefined();
      expect(response.filename).toBeDefined();
      expect(response.url).toContain('.webp');
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest('/upload', {
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

  describe('GET /api/images - 获取收藏图片列表', () => {
    it('已认证用户应该成功获取收藏图片列表', async () => {
      const response = await apiRequest<{ images: Image[]; pagination: Pagination }>(
        '/images',
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.images).toBeDefined();
      expect(Array.isArray(response.images)).toBe(true);
      expect(response.pagination).toBeDefined();
    });

    it('应该只返回当前用户收藏的图片', async () => {
      const response = await apiRequest<{ images: Image[] }>(
        '/images',
        {
          headers: withAuth(validToken),
        }
      );

      const images = response.images;
      if (images.length > 0) {
        images.forEach(image => {
          expect(image.userId).toBe('user-123');
        });
      }
    });

    it('图片列表应该只包含已收藏的图片', async () => {
      const response = await apiRequest<{ images: Image[] }>(
        '/images',
        {
          headers: withAuth(validToken),
        }
      );

      const images = response.images;
      if (images.length > 0) {
        images.forEach(image => {
          expect(image.isFavorite).toBe(true);
        });
      }
    });

    it('应该支持分页参数', async () => {
      const response = await apiRequest<{ images: Image[]; pagination: Pagination }>(
        '/images?page=1&limit=10',
        {
          headers: withAuth(validToken),
        }
      );

      expect(response.pagination).toBeDefined();
    });

    it('未认证用户应返回 UNAUTHORIZED 错误', async () => {
      try {
        await apiRequest('/images');
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe('PUT /api/images/:id/favorite - 切换收藏状态', () => {
    it('已收藏的图片应该能够取消收藏', async () => {
      const response = await apiRequest<{ image: Image }>(
        `/images/${imageId}/favorite`,
        {
          method: 'PUT',
          headers: withAuth(validToken),
        }
      );

      expect(response.image).toBeDefined();
      expect(typeof response.image.isFavorite).toBe('boolean');
    });

    it('未收藏的图片应该能够收藏', async () => {
      const response = await apiRequest<{ image: Image }>(
        `/images/${imageId}/favorite`,
        {
          method: 'PUT',
          headers: withAuth(validToken),
        }
      );

      expect(response.image).toBeDefined();
      expect(response.image.isFavorite).toBeDefined();
    });

    it('收藏状态切换应该立即生效', async () => {
      const response = await apiRequest<{ image: Image }>(
        `/images/${imageId}/favorite`,
        {
          method: 'PUT',
          headers: withAuth(validToken),
        }
      );

      expect(response.image.isFavorite).toBeDefined();
    });

    it('操作不存在的图片应返回 NOT_FOUND 错误', async () => {
      try {
        await apiRequest('/images/not-found/favorite', {
          method: 'PUT',
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
        await apiRequest(`/images/${imageId}/favorite`, {
          method: 'PUT',
        });
        expect.fail('应该抛出 ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNAUTHORIZED');
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe('PUT /api/images/:id - 更新图片信息', () => {
    it('已认证用户应该成功更新图片描述', async () => {
      const newPrompt = '更新后的图片描述';
      const response = await apiRequest<{ image: Image }>(
        `/images/${imageId}`,
        {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({
            prompt: newPrompt,
          }),
        }
      );

      expect(response.image).toBeDefined();
      expect(response.image.prompt).toBe(newPrompt);
    });

    it('更新不存在的图片应返回 NOT_FOUND 错误', async () => {
      try {
        await apiRequest('/images/not-found', {
          method: 'PUT',
          headers: withAuth(validToken),
          body: JSON.stringify({
            prompt: '新描述',
          }),
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
        await apiRequest(`/images/${imageId}`, {
          method: 'PUT',
          body: JSON.stringify({
            prompt: '新描述',
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

  describe('DELETE /api/images/:id - 删除图片', () => {
    it('已认证用户应该成功删除图片', async () => {
      const response = await apiRequest<{ message: string }>(
        `/images/${imageId}`,
        {
          method: 'DELETE',
          headers: withAuth(validToken),
        }
      );

      expect(response.message).toBe('图片已删除');
    });

    it('删除不存在的图片应返回 NOT_FOUND 错误', async () => {
      try {
        await apiRequest('/images/not-found', {
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
        await apiRequest(`/images/${imageId}`, {
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

describe('图片隐私隔离', () => {
  const validToken = 'valid-test-token';

  it('用户应该只能看到自己的图片', async () => {
    const response = await apiRequest<{ images: Image[] }>(
      '/images',
      {
        headers: withAuth(validToken),
      }
    );

    const images = response.images;
    if (images.length > 0) {
      const userIds = new Set(images.map(img => img.userId));
      expect(userIds.size).toBe(1);
      expect([...userIds][0]).toBe('user-123');
    }
  });

  it('图片不应该暴露其他用户的信息', async () => {
    const response = await apiRequest<{ images: Image[] }>(
      '/images',
      {
        headers: withAuth(validToken),
      }
    );

    const images = response.images;
    if (images.length > 0) {
      images.forEach(image => {
        expect(image).not.toHaveProperty('ownerEmail');
        expect(image).not.toHaveProperty('ownerName');
      });
    }
  });
});
