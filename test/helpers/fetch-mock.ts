import { vi } from 'vitest';
import type { User, Session, Message, Image } from './api-client';

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null,
  theme: 'system',
  createdAt: '2024-01-15T14:30:00Z',
  updatedAt: '2024-01-15T14:30:00Z',
};

const mockSession: Session = {
  id: 'session-123',
  userId: 'user-123',
  title: '日落海景创作',
  createdAt: '2024-01-15T14:30:00Z',
  updatedAt: '2024-01-15T14:30:00Z',
};

const mockMessage: Message = {
  id: 'msg-123',
  sessionId: 'session-123',
  userId: 'user-123',
  role: 'assistant',
  content: '已为您生成日落海景图片',
  imageUrl: '/uploads/images/generated-123.webp',
  metadata: {
    prompt: '帮我画一幅日落海景',
    width: 1024,
    height: 1024,
    model: 'image-01',
  },
  createdAt: '2024-01-15T14:30:05Z',
};

const mockImage: Image = {
  id: 'img-123',
  userId: 'user-123',
  sessionId: 'session-123',
  messageId: 'msg-123',
  url: '/uploads/images/generated-123.webp',
  localPath: '/var/www/moyu/uploads/images/generated-123.webp',
  prompt: '帮我画一幅日落海景',
  width: 1024,
  height: 1024,
  isFavorite: true,
  createdAt: '2024-01-15T14:30:00Z',
};

function createResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPath(url: string): string {
  const base = 'http://localhost:3000/api';
  if (url.startsWith(base)) {
    const path = url.slice(base.length);
    const queryIndex = path.indexOf('?');
    return queryIndex >= 0 ? path.slice(0, queryIndex) : path;
  }
  return url;
}

function matchPath(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) {
    return false;
  }

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      continue;
    }
    if (patternParts[i] !== pathParts[i]) {
      return false;
    }
  }

  return true;
}

export function createFetchMock() {
  return vi.fn(async (url: string, options?: RequestInit) => {
    await delay(20);

    const path = getPath(url);
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const headers = options?.headers || {};

    if (path === '/auth/register/send-code' && method === 'POST') {
      if (body.email === 'existing@example.com') {
        return createResponse({ success: false, error: { code: 'EMAIL_EXISTS', message: '该邮箱已注册' } }, 400);
      }
      return createResponse({ success: true, data: { message: '验证码已发送到您的邮箱', expiresIn: 600 } });
    }

    if (path === '/auth/register/verify' && method === 'POST') {
      if (body.code === '000000') {
        return createResponse({ success: false, error: { code: 'INVALID_CODE', message: '验证码错误或已过期' } }, 400);
      }
      return createResponse({ success: true, data: { user: mockUser, token: 'mock-session-token-xxx' } });
    }

    if (path === '/auth/login' && method === 'POST') {
      if (!body.email || !body.password) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '缺少必要参数' } }, 400);
      }
      if (body.email === 'wrong@example.com' || body.password === 'wrongpass') {
        return createResponse({ success: false, error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' } }, 401);
      }
      if (!body.email.includes('@')) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '邮箱格式不正确' } }, 400);
      }
      return createResponse({ success: true, data: { user: mockUser, token: 'mock-session-token-xxx' } });
    }

    if (path === '/auth/logout' && method === 'POST') {
      return createResponse({ success: true, data: { message: '登出成功' } });
    }

    if (path === '/auth/session' && method === 'GET') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证或认证过期' } }, 401);
      }
      return createResponse({ success: true, data: { user: mockUser } });
    }

    if (path === '/user/profile' && method === 'GET') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      return createResponse({ success: true, data: { user: mockUser } });
    }

    if (path === '/user/profile' && method === 'PUT') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      if (body.name && body.name.length > 100) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '昵称长度不能超过100字符' } }, 400);
      }
      if (body.avatar && !body.avatar.startsWith('http')) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '头像URL格式不正确' } }, 400);
      }
      return createResponse({ success: true, data: { user: { ...mockUser, name: body.name || mockUser.name, avatar: body.avatar || mockUser.avatar } } });
    }

    if (path === '/user/password' && method === 'PUT') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      if (!body.currentPassword) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '缺少当前密码' } }, 400);
      }
      if (!body.newPassword) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '缺少新密码' } }, 400);
      }
      if (body.currentPassword === 'wrongpassword') {
        return createResponse({ success: false, error: { code: 'INVALID_CREDENTIALS', message: '当前密码错误' } }, 400);
      }
      if (body.newPassword.length < 8) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '密码至少8位' } }, 400);
      }
      if (!/\d/.test(body.newPassword) || !/[a-zA-Z]/.test(body.newPassword)) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '密码需包含数字和字母' } }, 400);
      }
      return createResponse({ success: true, data: { message: '密码修改成功' } });
    }

    if (path === '/user/theme' && method === 'PUT') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      const validThemes = ['light', 'dark', 'system'];
      if (body.theme && !validThemes.includes(body.theme)) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '无效的主题值' } }, 400);
      }
      return createResponse({ success: true, data: { user: { ...mockUser, theme: body.theme } } });
    }

    if (path === '/sessions' && method === 'GET') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      return createResponse({ success: true, data: { sessions: [mockSession], pagination: { page: 1, limit: 20, total: 1, hasMore: false } } });
    }

    if (path === '/sessions' && method === 'POST') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      return createResponse({ success: true, data: { session: { ...mockSession, id: `session-${Date.now()}`, createdAt: new Date().toISOString() } } });
    }

    if (matchPath('/sessions/:id', path) && method === 'GET') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      const id = path.split('/')[2];
      if (id === 'not-found') {
        return createResponse({ success: false, error: { code: 'NOT_FOUND', message: '会话不存在' } }, 404);
      }
      return createResponse({ success: true, data: { session: { ...mockSession, id }, messages: [mockMessage] } });
    }

    if (matchPath('/sessions/:id', path) && method === 'PUT') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      const id = path.split('/')[2];
      if (id === 'not-found') {
        return createResponse({ success: false, error: { code: 'NOT_FOUND', message: '会话不存在' } }, 404);
      }
      if (body.title && body.title.length > 200) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '标题长度不能超过200字符' } }, 400);
      }
      return createResponse({ success: true, data: { session: { ...mockSession, id, title: body.title || mockSession.title } } });
    }

    if (matchPath('/sessions/:id', path) && method === 'DELETE') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      const id = path.split('/')[2];
      if (id === 'not-found') {
        return createResponse({ success: false, error: { code: 'NOT_FOUND', message: '会话不存在' } }, 404);
      }
      return createResponse({ success: true, data: { message: '会话已删除' } });
    }

    if (matchPath('/sessions/:id/messages', path) && method === 'GET') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      return createResponse({ success: true, data: { messages: [mockMessage], pagination: { page: 1, limit: 50, total: 1, hasMore: false } } });
    }

    if (matchPath('/sessions/:id/messages', path) && method === 'POST') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      if (!body.content || body.content.trim() === '') {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '内容不能为空' } }, 400);
      }
      if (body.content.length > 500) {
        return createResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: '内容不能超过500字符' } }, 400);
      }
      await delay(100);
      return createResponse({
        success: true,
        data: {
          message: { ...mockMessage, id: `msg-${Date.now()}`, content: body.content },
          image: { ...mockImage, id: `img-${Date.now()}`, prompt: body.content },
        },
      });
    }

    if (matchPath('/messages/:id', path) && method === 'DELETE') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      const id = path.split('/')[2];
      if (id === 'not-found') {
        return createResponse({ success: false, error: { code: 'NOT_FOUND', message: '消息不存在' } }, 404);
      }
      return createResponse({ success: true, data: { message: '消息已删除' } });
    }

    if (path === '/upload' && method === 'POST') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      return createResponse({ success: true, data: { url: '/uploads/images/uploaded-123.webp', filename: 'uploaded-123.webp' } });
    }

    if (path === '/images' && method === 'GET') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      return createResponse({ success: true, data: { images: [mockImage], pagination: { page: 1, limit: 20, total: 1, hasMore: false } } });
    }

    if (matchPath('/images/:id/favorite', path) && method === 'PUT') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      const id = path.split('/')[2];
      if (id === 'not-found') {
        return createResponse({ success: false, error: { code: 'NOT_FOUND', message: '图片不存在' } }, 404);
      }
      return createResponse({ success: true, data: { image: { ...mockImage, id, isFavorite: !mockImage.isFavorite } } });
    }

    if (matchPath('/images/:id', path) && method === 'PUT') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      const id = path.split('/')[2];
      if (id === 'not-found') {
        return createResponse({ success: false, error: { code: 'NOT_FOUND', message: '图片不存在' } }, 404);
      }
      return createResponse({ success: true, data: { image: { ...mockImage, id, prompt: body.prompt || mockImage.prompt } } });
    }

    if (matchPath('/images/:id', path) && method === 'DELETE') {
      const authHeader = (headers as Record<string, string>)?.Authorization;
      if (!authHeader) {
        return createResponse({ success: false, error: { code: 'UNAUTHORIZED', message: '未认证' } }, 401);
      }
      const id = path.split('/')[2];
      if (id === 'not-found') {
        return createResponse({ success: false, error: { code: 'NOT_FOUND', message: '图片不存在' } }, 404);
      }
      return createResponse({ success: true, data: { message: '图片已删除' } });
    }

    return createResponse({ success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } }, 404);
  });
}

export { mockUser, mockSession, mockMessage, mockImage };
