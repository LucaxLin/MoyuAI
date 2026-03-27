# 墨语 (MoyuAI)

一款基于人工智能的创意图片生成应用，通过自然语言描述或上传参考图片，快速生成高质量的 AI 艺术作品。

## 功能特性

### 核心功能

- **文本转图片**：输入自然语言描述，AI 即可生成对应图片
- **图片+文本编辑**：上传参考图片，结合文字指令进行风格迁移或内容修改
- **智能图片编辑**：系统自动识别编辑意图，支持基于原图重新生成、微调、继续创作
- **框选区域局部修改**：在图片上框选区域，精确修改局部内容
- **私有图库**：收藏、下载、引用二次创作

### 用户体验

- 对话式交互设计，操作直观便捷
- 完美适配 PC 端和移动端
- 支持明暗主题切换
- 响应式布局设计

## 技术栈

### 架构

- **Monorepo**: Turborepo + pnpm workspaces
- **部署**: Vercel (前后端统一部署)

### 前端

- **框架**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **图标**: lucide-react
- **主题**: next-themes

### 后端

- **API**: Next.js API Routes (Serverless Functions)
- **ORM**: Prisma
- **认证**: NextAuth.js v5
- **数据库**: Vercel Postgres (PostgreSQL)
- **存储**: Vercel Blob

### AI 服务

- **图片生成**: MiniMax image-01

## 项目结构

```
moyu-ai/
├── apps/
│   └── web/                    # Next.js 全栈应用
│       ├── src/
│       │   ├── app/           # 页面路由
│       │   │   ├── api/       # API Routes
│       │   │   ├── chat/      # 聊天页面
│       │   │   ├── gallery/   # 图库页面
│       │   │   ├── login/      # 登录页
│       │   │   ├── register/   # 注册页
│       │   │   └── settings/   # 设置页
│       │   ├── components/    # React 组件
│       │   ├── hooks/         # 自定义 Hooks
│       │   ├── store/         # Zustand 状态管理
│       │   └── lib/           # 工具函数
│       └── package.json
├── packages/
│   ├── shared/                # 共享工具库
│   │   ├── src/
│   │   │   ├── types/        # TypeScript 类型定义
│   │   │   ├── utils/        # 工具函数
│   │   │   ├── constants/     # 常量定义
│   │   │   └── validators/    # 数据验证 (Zod)
│   │   └── package.json
│   └── db/                    # 数据库 Schema
│       ├── prisma/
│       │   └── schema.prisma  # Prisma 数据模型
│       └── package.json
├── turbo.json                 # Turborepo 配置
├── pnpm-workspace.yaml        # pnpm workspace 配置
└── package.json              # 根 package.json
```

## 快速开始

### 环境要求

- Node.js 20 LTS
- pnpm 8+

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local` 并配置：

```env
# Database (Vercel Postgres)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# MiniMax AI
MINIMAX_API_KEY="your-api-key"
MINIMAX_GROUP_ID="your-group-id"

# SMTP (邮件发送)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASS="your-password"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-blob-token"
```

### 启动开发服务器

```bash
pnpm dev
```

### 数据库迁移

```bash
# 生成 Prisma Client
pnpm --filter @moyu/db db:generate

# 运行迁移
pnpm --filter @moyu/db db:migrate
```

## 部署到 Vercel

### 1. 创建 Vercel 项目

1. 登录 [Vercel Dashboard](https://vercel.com)
2. 点击 "Add New Project"
3. 导入 Git 仓库
4. 设置 Root Directory 为 `apps/web`

### 2. 配置环境变量

在 Vercel Dashboard 的 Environment Variables 中添加：

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"
MINIMAX_API_KEY="your-api-key"
MINIMAX_GROUP_ID="your-group-id"
SMTP_HOST="smtp.example.com"
SMTP_USER="your-email"
SMTP_PASS="your-password"
BLOB_READ_WRITE_TOKEN="your-blob-token"
```

### 3. 创建 Vercel Postgres

1. 在 Vercel Dashboard 中点击 "Storage"
2. 创建 Postgres 数据库
3. 复制连接字符串到 `DATABASE_URL`

### 4. 创建 Vercel Blob

1. 在 Vercel Dashboard 中点击 "Storage"
2. 创建 Blob 存储桶
3. 复制 token 到 `BLOB_READ_WRITE_TOKEN`

## API 端点

### 认证相关

| 方法 | 端点 | 描述 | 认证 |
|------|-------|------|------|
| POST | `/api/auth/register/send-code` | 发送注册验证码 | 否 |
| POST | `/api/auth/register/verify` | 验证注册验证码 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |
| GET | `/api/auth/session` | 获取当前会话信息 | 是 |

### 会话相关

| 方法 | 端点 | 描述 | 认证 |
|------|-------|------|------|
| GET | `/api/sessions` | 获取用户所有会话列表 | 是 |
| POST | `/api/sessions` | 创建新会话 | 是 |
| GET | `/api/sessions/:id` | 获取会话详情 | 是 |
| PUT | `/api/sessions/:id` | 更新会话 | 是 |
| DELETE | `/api/sessions/:id` | 删除会话 | 是 |

### 消息相关

| 方法 | 端点 | 描述 | 认证 |
|------|-------|------|------|
| GET | `/api/sessions/:id/messages` | 获取会话消息列表 | 是 |
| POST | `/api/sessions/:id/messages` | 发送消息并生成图片 | 是 |
| DELETE | `/api/messages/:id` | 删除消息 | 是 |

### 图片相关

| 方法 | 端点 | 描述 | 认证 |
|------|-------|------|------|
| POST | `/api/upload` | 上传图片文件 | 是 |
| GET | `/api/images` | 获取收藏图片列表 | 是 |
| PUT | `/api/images/:id/favorite` | 切换收藏状态 | 是 |
| DELETE | `/api/images/:id` | 删除图片 | 是 |

## 数据库模型

### User (用户表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 用户唯一标识 |
| email | VARCHAR(255) | 邮箱地址 (唯一) |
| passwordHash | VARCHAR(255) | 密码哈希 |
| name | VARCHAR(100) | 昵称 |
| avatar | VARCHAR(500) | 头像 URL |
| theme | ENUM | 主题偏好 (light/dark/system) |

### Session (会话表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 会话唯一标识 |
| userId | UUID | 所属用户 |
| title | VARCHAR(200) | 会话标题 |

### Message (消息表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 消息唯一标识 |
| sessionId | UUID | 所属会话 |
| userId | UUID | 发送者 |
| role | ENUM | 消息角色 (user/assistant/system) |
| content | TEXT | 文本内容 |
| imageUrl | VARCHAR(500) | 生成的图片 URL |
| metadata | JSONB | 额外元数据 |

### Image (图片表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 图片唯一标识 |
| userId | UUID | 所属用户 |
| url | VARCHAR(500) | 访问 URL |
| prompt | TEXT | 生成时的 prompt |
| width | INTEGER | 图片宽度 |
| height | INTEGER | 图片高度 |
| isFavorite | BOOLEAN | 是否收藏 |

### Verification (验证码表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 验证码唯一标识 |
| email | VARCHAR(255) | 邮箱地址 |
| code | VARCHAR(6) | 6位验证码 |
| type | ENUM | 验证码类型 (register/login/reset) |
| expiresAt | TIMESTAMP | 过期时间 |
| isUsed | BOOLEAN | 是否已使用 |

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| UNAUTHORIZED | 401 | 未认证或认证过期 |
| FORBIDDEN | 403 | 无权访问该资源 |
| NOT_FOUND | 404 | 资源不存在 |
| EMAIL_EXISTS | 400 | 邮箱已被注册 |
| INVALID_CODE | 400 | 验证码错误或已过期 |
| INVALID_CREDENTIALS | 401 | 邮箱或密码错误 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| AI_SERVICE_ERROR | 500 | AI 服务调用失败 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 开发相关

### 可用脚本

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行测试
pnpm test

# 代码格式检查
pnpm lint
```

### 相关文档

- [设计文档](./墨语%20(MoyuAI)%20项目设计文档.md)
- [开发 Checklist](./DEVELOPMENT_CHECKLIST.md)

## 技术支持

如有问题或建议，请提交 Issue。

## License

MIT
