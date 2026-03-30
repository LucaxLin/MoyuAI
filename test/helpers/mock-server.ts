import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
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

export const handlers = [
  http.post('/api/auth/register/send-code', async ({ request }) => {
    await delay(100);
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'existing@example.com') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: '该邮箱已注册',
        },
      }, { status: 400 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        message: '验证码已发送到您的邮箱',
        expiresIn: 600,
      },
    });
  }),

  http.post('/api/auth/register/verify', async ({ request }) => {
    await delay(150);
    const body = await request.json() as { email: string; code: string };

    if (body.code === '000000') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: '验证码错误或已过期',
        },
      }, { status: 400 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-session-token-xxx',
      },
    });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay(100);
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'wrong@example.com' || body.password === 'wrongpass') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-session-token-xxx',
      },
    });
  }),

  http.post('/api/auth/logout', async () => {
    await delay(50);
    return HttpResponse.json({
      success: true,
      data: {
        message: '登出成功',
      },
    });
  }),

  http.get('/api/auth/session', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证或认证过期',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser,
      },
    });
  }),

  http.get('/api/user/profile', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser,
      },
    });
  }),

  http.put('/api/user/profile', async ({ request }) => {
    await delay(100);
    const authHeader = request.headers.get('Authorization');
    const body = await request.json() as { name?: string; avatar?: string };

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          ...mockUser,
          name: body.name || mockUser.name,
          avatar: body.avatar || mockUser.avatar,
        },
      },
    });
  }),

  http.put('/api/user/password', async ({ request }) => {
    await delay(100);
    const authHeader = request.headers.get('Authorization');
    const body = await request.json() as { currentPassword: string; newPassword: string };

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    if (body.currentPassword === 'wrongpassword') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '当前密码错误',
        },
      }, { status: 400 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        message: '密码修改成功',
      },
    });
  }),

  http.put('/api/user/theme', async ({ request }) => {
    await delay(50);
    const authHeader = request.headers.get('Authorization');
    const body = await request.json() as { theme: 'light' | 'dark' | 'system' };

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          ...mockUser,
          theme: body.theme,
        },
      },
    });
  }),

  http.get('/api/sessions', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        sessions: [mockSession],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          hasMore: false,
        },
      },
    });
  }),

  http.post('/api/sessions', async ({ request }) => {
    await delay(100);
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        session: {
          ...mockSession,
          id: `session-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
      },
    });
  }),

  http.get('/api/sessions/:id', async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    const { id } = params;

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    if (id === 'not-found') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '会话不存在',
        },
      }, { status: 404 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        session: {
          ...mockSession,
          id: id as string,
        },
        messages: [mockMessage],
      },
    });
  }),

  http.put('/api/sessions/:id', async ({ params, request }) => {
    await delay(50);
    const authHeader = request.headers.get('Authorization');
    const body = await request.json() as { title?: string };
    const { id } = params;

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        session: {
          ...mockSession,
          id: id as string,
          title: body.title || mockSession.title,
        },
      },
    });
  }),

  http.delete('/api/sessions/:id', async ({ params, request }) => {
    await delay(50);
    const authHeader = request.headers.get('Authorization');
    const { id } = params;

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        message: '会话已删除',
      },
    });
  }),

  http.get('/api/sessions/:id/messages', async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const { id } = params;

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        messages: [mockMessage],
        pagination: {
          page,
          limit,
          total: 1,
          hasMore: false,
        },
      },
    });
  }),

  http.post('/api/sessions/:id/messages', async ({ params, request }) => {
    await delay(2000);
    const authHeader = request.headers.get('Authorization');
    const body = await request.json() as { content: string; imageUrl?: string; editRegion?: object };
    const { id } = params;

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    if (!body.content || body.content.trim() === '') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '内容不能为空',
        },
      }, { status: 400 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        message: {
          ...mockMessage,
          id: `msg-${Date.now()}`,
          content: body.content,
          createdAt: new Date().toISOString(),
        },
        image: {
          ...mockImage,
          id: `img-${Date.now()}`,
          prompt: body.content,
        },
      },
    });
  }),

  http.delete('/api/messages/:id', async ({ params, request }) => {
    await delay(50);
    const authHeader = request.headers.get('Authorization');
    const { id } = params;

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        message: '消息已删除',
      },
    });
  }),

  http.post('/api/upload', async ({ request }) => {
    await delay(200);
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        url: '/uploads/images/uploaded-123.webp',
        filename: 'uploaded-123.webp',
      },
    });
  }),

  http.get('/api/images', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        images: [mockImage],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          hasMore: false,
        },
      },
    });
  }),

  http.put('/api/images/:id/favorite', async ({ params, request }) => {
    await delay(50);
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        image: {
          ...mockImage,
          id: params.id as string,
          isFavorite: !mockImage.isFavorite,
        },
      },
    });
  }),

  http.put('/api/images/:id', async ({ params, request }) => {
    await delay(50);
    const authHeader = request.headers.get('Authorization');
    const body = await request.json() as { prompt?: string };

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        image: {
          ...mockImage,
          id: params.id as string,
          prompt: body.prompt || mockImage.prompt,
        },
      },
    });
  }),

  http.delete('/api/images/:id', async ({ params, request }) => {
    await delay(50);
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        message: '图片已删除',
      },
    });
  }),
];

export const server = setupServer(...handlers);

export { mockUser, mockSession, mockMessage, mockImage };
