# 墨语 (MoyuAI) 开发 Checklist

本文档用于指导 AI Agent 逐步完成墨语项目的开发，确保不遗漏任何功能。所有变量、API、字段名必须严格遵守设计文档的描述。

---

## 阶段一：项目初始化与基础设施

### 1.1 Monorepo 脚手架搭建

- [x] 初始化 pnpm workspace (`pnpm init`)
- [x] 创建 `pnpm-workspace.yaml` 配置文件
- [x] 创建 `turbo.json` Turborepo 配置文件
- [x] 创建根目录 `package.json`，包含以下依赖：
  - `turbo` (构建工具)
  - `typescript` (类型系统)
  - `eslint` / `prettier` (代码规范)
- [x] 创建 `tsconfig.json` TypeScript 基础配置

### 1.2 创建 Monorepo 包结构

- [x] 创建 `apps/web/` 目录（Next.js 全栈应用）
  - [x] 创建 `apps/web/package.json`
  - [x] 配置 `apps/web/src/` 目录结构：
    - `app/` - Next.js App Router
    - `components/` - 页面组件
    - `hooks/` - React Hooks
    - `store/` - Zustand 状态管理
    - `lib/` - 工具函数
- [x] 创建 `packages/shared/` 目录（共享工具库）
  - [x] 创建 `packages/shared/package.json`
  - [x] 创建 `packages/shared/src/types/` - TypeScript 类型定义
  - [x] 创建 `packages/shared/src/utils/` - 工具函数
  - [x] 创建 `packages/shared/src/constants/` - 常量定义
  - [x] 创建 `packages/shared/src/validators/` - 数据验证（Zod）
- [x] 创建 `packages/db/` 目录（数据库 Schema）
  - [x] 创建 `packages/db/package.json`
  - [x] 创建 `packages/db/prisma/schema.prisma`

### 1.3 配置包依赖关系

- [x] 在根 `package.json` 配置 `private: true`
- [x] 在各包 `package.json` 配置正确的 `name`（如 `@moyu/web`、`@moyu/shared`、`@moyu/db`）
- [x] 配置 `apps/web` 依赖 `@moyu/shared` 和 `@moyu/db`
- [x] 配置 `packages/shared` 依赖 `@moyu/db`

### 1.4 Vercel 服务配置

- [ ] 创建 Vercel 项目，连接 Git 仓库
- [ ] 创建 Vercel Postgres 数据库
- [ ] 创建 Vercel Blob 存储桶
- [ ] 配置环境变量（见下方）

**环境变量清单：**

```env
# Database
DATABASE_URL="postgresql://..."
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# MiniMax AI
MINIMAX_API_KEY="your-api-key"
MINIMAX_GROUP_ID="your-group-id"

# SMTP
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@moyu.ai"
SMTP_PASS="your-smtp-password"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-blob-token"
```

### 1.5 前端基础搭建

- [x] 初始化 Next.js 15 项目（使用 App Router）
- [x] 配置 Tailwind CSS
- [x] 安装并配置 shadcn/ui 组件库
- [x] 安装 Zustand 状态管理库
- [x] 安装 @tanstack/react-query
- [x] 安装 next-themes 主题管理
- [x] 安装 lucide-react 图标库
- [x] 安装 react-hot-toast 通知库
- [x] 安装 date-fns 日期处理库

### 1.6 数据库设计与实现

#### 创建 Prisma Schema（`packages/db/prisma/schema.prisma`）

- [x] 配置 `datasource db`：
  - `provider = "postgresql"`
  - `url = env("DATABASE_URL")`
- [x] 配置 `generator client`
- [x] 创建 **User** 模型（表）：
  - `id` - UUID，PK，默认 `uuid_generate_v4()`
  - `email` - VARCHAR(255)，UNIQUE，NOT NULL
  - `passwordHash` - VARCHAR(255)，NOT NULL
  - `name` - VARCHAR(100)，可为空
  - `avatar` - VARCHAR(500)，可为空
  - `theme` - ENUM('light','dark','system')，默认 'system'
  - `createdAt` - TIMESTAMP，默认 NOW()
  - `updatedAt` - TIMESTAMP，默认 NOW()
- [x] 创建 **Session** 模型（表）：
  - `id` - UUID，PK，默认 `uuid_generate_v4()`
  - `userId` - UUID，FK -> User.id，NOT NULL
  - `title` - VARCHAR(200)
  - `createdAt` - TIMESTAMP，默认 NOW()
  - `updatedAt` - TIMESTAMP，默认 NOW()
- [x] 创建 **Message** 模型（表）：
  - `id` - UUID，PK，默认 `uuid_generate_v4()`
  - `sessionId` - UUID，FK -> Session.id，NOT NULL
  - `userId` - UUID，FK -> User.id，NOT NULL
  - `role` - ENUM('user','assistant','system')，NOT NULL
  - `content` - TEXT
  - `imageUrl` - VARCHAR(500)
  - `metadata` - JSONB
  - `createdAt` - TIMESTAMP，默认 NOW()
- [x] 创建 **Image** 模型（表）：
  - `id` - UUID，PK，默认 `uuid_generate_v4()`
  - `userId` - UUID，FK -> User.id，NOT NULL
  - `sessionId` - UUID，FK -> Session.id，可为空
  - `messageId` - UUID，FK -> Message.id
  - `url` - VARCHAR(500)，NOT NULL
  - `localPath` - VARCHAR(500)，NOT NULL
  - `prompt` - TEXT
  - `width` - INTEGER
  - `height` - INTEGER
  - `isFavorite` - BOOLEAN，默认 false
  - `createdAt` - TIMESTAMP，默认 NOW()
- [x] 创建 **Verification** 模型（表）：
  - `id` - UUID，PK，默认 `uuid_generate_v4()`
  - `email` - VARCHAR(255)，NOT NULL
  - `code` - VARCHAR(6)，NOT NULL
  - `type` - ENUM('register','login','reset')，NOT NULL
  - `expiresAt` - TIMESTAMP，NOT NULL
  - `isUsed` - BOOLEAN，默认 false
  - `createdAt` - TIMESTAMP，默认 NOW()

- [x] 生成 Prisma Client
- [x] 运行数据库迁移脚本

### 1.7 认证系统基础

#### 安装认证相关依赖

- [x] 安装 NextAuth.js v5 (`next-auth@beta`)
- [x] 安装 bcryptjs（密码加密）
- [x] 安装 nodemailer（邮件发送）
- [x] 安装 zod（数据验证）

#### 实现认证相关 API

- [x] 配置 NextAuth.js（创建 `apps/web/src/lib/auth.ts` 或 `auth.config.ts`）
- [x] 实现 `POST /api/auth/register/send-code`：
  - 接收参数：`email`, `password`
  - 校验邮箱格式和密码强度（至少8位，包含数字和字母）
  - 生成6位随机验证码
  - 存入 Verification 表，设置10分钟过期时间
  - 使用 Nodemailer 发送验证码邮件
  - 限制：同一邮箱5分钟内只能发送一次
- [x] 实现 `POST /api/auth/register/verify`：
  - 接收参数：`email`, `code`
  - 验证验证码正确性和过期时间
  - 验证码错误3次后自动失效
  - 验证通过后创建 User 记录（密码 bcrypt 加密）
  - 返回用户信息和 token
- [x] 实现 `POST /api/auth/login`：
  - 接收参数：`email`, `password`
  - 验证邮箱是否存在
  - 使用 bcrypt 验证密码
  - 登录失败锁定：连续5次失败后锁定15分钟
  - 返回用户信息
- [x] 实现 `POST /api/auth/logout`
- [x] 实现 `GET /api/auth/session`

---

## 阶段二：核心功能开发 - 聊天与图片生成

### 2.1 前端页面路由结构

创建以下页面路由（`apps/web/src/app/`）：

- [x] `/` - 首页，重定向到 `/chat` 或 `/login`
- [x] `/(auth)/login/page.tsx` - 登录页
- [x] `/(auth)/register/page.tsx` - 注册页
- [x] `/(auth)/register/verify/page.tsx` - 验证码确认页
- [x] `/(main)/chat/page.tsx` - 聊天生图页
- [x] `/(main)/chat/[sessionId]/page.tsx` - 特定会话页
- [x] `/(main)/gallery/page.tsx` - 图库页
- [x] `/(main)/gallery/[imageId]/page.tsx` - 图片详情页
- [x] `/(main)/settings/page.tsx` - 个人设置页

### 2.2 页面布局组件

- [x] 创建根布局 `app/layout.tsx`
- [x] 创建顶部导航组件：
  - Logo 和标题 "墨语"
  - 主题切换按钮（明/暗/系统）
  - 设置链接
  - 用户头像下拉菜单
- [x] 创建左侧会话列表侧边栏（PC端常驻，移动端抽屉）
- [x] 创建底部输入区域组件：
  - 左侧：上传图片按钮
  - 中间：文本输入框
  - 右侧：发送按钮（PC端显示）

### 2.3 聊天页面组件

- [x] 创建 `MessageBubble` 组件（用户消息、AI消息）
- [x] 创建 `ImagePreview` 组件（点击放大、缩放、拖拽）
- [x] 创建 `ImageUploader` 组件（支持拖拽上传）
- [x] 创建 `ChatInput` 组件（支持图片上传、Enter发送、Shift+Enter换行）
- [x] 创建 `LoadingIndicator` 组件（AI生成中加载动画）
- [x] 创建空会话欢迎语组件

### 2.4 用户相关 API

- [x] 实现 `GET /api/user/profile` - 获取用户信息
- [x] 实现 `PUT /api/user/profile` - 更新用户信息（昵称、头像）
- [x] 实现 `PUT /api/user/password` - 修改密码（需验证原密码）
- [x] 实现 `PUT /api/user/theme` - 更新主题偏好

### 2.5 会话管理功能

#### 实现会话相关 API

- [x] 实现 `GET /api/sessions` - 获取用户所有会话列表
- [x] 实现 `POST /api/sessions` - 创建新会话
- [x] 实现 `GET /api/sessions/:id` - 获取会话详情（含消息）
- [x] 实现 `PUT /api/sessions/:id` - 更新会话（如标题）
- [x] 实现 `DELETE /api/sessions/:id` - 删除会话

#### 实现前端会话管理

- [x] 创建 `useSession` Hook
- [x] 创建 `useSessions` Hook（会话列表）
- [x] 创建 Zustand Store：`store/sessionStore.ts`
- [x] 实现会话列表展示（左侧边栏）
- [x] 实现新建会话功能
- [x] 实现切换会话、加载历史消息
- [x] 实现删除会话功能
- [x] 实现会话标题自动生成（提取第一条用户消息）

### 2.6 图片生成功能

#### 安装 MiniMax API 相关依赖

- [x] 确保可以调用 MiniMax image-01 API

#### 创建 MiniMax API 封装

- [x] 创建 `apps/web/src/lib/minimax.ts`
- [x] 配置 API URL：`https://api.minimax.chat/v1/image_generation`
- [x] 配置请求头：`Authorization: Bearer ${MINIMAX_API_KEY}`

#### 实现消息相关 API

- [x] 实现 `GET /api/sessions/:id/messages` - 获取会话消息列表
  - 支持分页：`page`, `limit`
  - 返回消息列表和分页信息
- [x] 实现 `POST /api/sessions/:id/messages` - 发送消息并生成图片
  - 接收参数：`content`, `imageUrl`, `editRegion`
  - 调用 MiniMax API 生成图片
  - 保存图片到 Vercel Blob
  - 更新 Image 表
  - 返回生成的图片信息
- [x] 实现 `DELETE /api/messages/:id` - 删除消息

#### 实现前端消息功能

- [x] 创建 `useMessages` Hook
- [x] 创建 `useChat` Hook
- [x] 创建 Zustand Store：`store/chatStore.ts`
- [x] 实现文本转图片生成
- [x] 实现图片+文本修改功能
- [x] 实现生成结果的保存和展示

### 2.7 图片编辑功能

#### 实现编辑意图识别

- [x] 创建关键词检测逻辑（后端）
- [x] 编辑意图识别规则表：

| 用户输入关键词 | 编辑意图 |
| ----------- | -------- |
| "不对"、"重新生成"、"再来一张" | 重新生成 |
| "稍微调整"、"再改改" | 微调 |
| "保留这个"、"继续" | 继续创作 |
| 其他输入 | 继续创作 |

#### 实现前端图片编辑

- [x] 创建图片操作按钮组（收藏、下载、局部编辑）
- [x] 实现基于原图的重新生成
- [x] 实现基于生成结果的微调

### 2.8 框选区域局部修改

- [x] 创建 `RegionSelector` 组件（框选矩形）
- [x] 实现框选坐标归一化处理（0-1范围）
- [x] 限制框选区域最小边长（不小于图片尺寸的10%）
- [x] 支持撤销框选
- [x] 实现局部编辑 API 调用（携带框选坐标）

### 2.9 上传功能

#### 实现图片上传 API

- [x] 实现 `POST /api/upload`
  - 接收图片文件
  - 保存到 Vercel Blob
  - 返回图片 URL
  - 限制：单张不超过10MB
  - 支持格式：JPEG/PNG/WebP/GIF

---

## 阶段三：图库与高级功能

### 3.1 图库首页

#### 实现图片相关 API

- [x] 实现 `GET /api/images` - 获取收藏图片列表
  - 支持筛选：按时间范围
  - 支持排序：按收藏时间（最新/最旧）
  - 支持分页：每页20张
- [x] 实现 `PUT /api/images/:id/favorite` - 切换收藏状态
- [x] 实现 `PUT /api/images/:id` - 更新图片信息
- [x] 实现 `DELETE /api/images/:id` - 删除图片

#### 实现图库前端

- [x] 创建瀑布流布局组件
- [x] 实现图片筛选功能（全部/今天/本周/本月）
- [x] 实现排序功能（最新/最旧）
- [x] 实现无限滚动加载
- [x] 创建空图库引导提示

### 3.2 图片详情页

- [x] 创建大图预览组件（支持滚轮缩放、拖拽移动）
- [x] 显示原始 prompt、创建时间、图片尺寸
- [x] 实现下载功能（下载原图）
- [x] 实现引用创作功能（以此图片为原图，跳转聊天页）
- [x] 实现取消收藏功能
- [x] 实现删除功能

### 3.3 个人设置页

#### 实现设置页面

- [x] 创建个人信息编辑区块：
  - 头像上传（点击更换头像）
  - 昵称修改
  - 邮箱显示（不可修改）
- [x] 创建账号安全区块：
  - 当前密码验证
  - 新密码修改
  - 确认新密码
- [x] 创建偏好设置区块：
  - 主题切换（浅色/深色/跟随系统）
- [x] 创建退出登录按钮

### 3.4 主题模块

- [x] 安装并配置 next-themes
- [x] 创建主题切换组件
- [x] 实现主题偏好持久化（保存到 User 表 theme 字段）
- [x] 实现主题无闪烁切换

---

## 阶段四：测试、部署与上线

### 4.1 功能测试

- [ ] 编写用户注册流程测试用例
- [ ] 编写用户登录流程测试用例
- [ ] 编写会话管理测试用例
- [ ] 编写消息发送和图片生成测试用例
- [ ] 编写图片编辑测试用例
- [ ] 编写图库功能测试用例
- [ ] 编写个人设置测试用例

### 4.2 性能优化

- [ ] 实现图片懒加载
- [ ] 实现 API 响应压缩
- [ ] 实现前端代码分割
- [ ] 优化图片格式（WebP）

### 4.3 部署准备

- [ ] 配置 Vercel 构建命令
- [ ] 配置环境变量（生产环境）
- [ ] 配置域名和 SSL
- [ ] 运行数据库迁移（生产环境）

### 4.4 上线发布

- [ ] 部署到生产环境
- [ ] 验证数据迁移
- [ ] 配置监控和日志
- [ ] 验证核心功能流程

---

## 附录：API 端点完整清单

### 认证相关 API

| 方法 | 端点 | 描述 | 认证 |
| --- | --- | --- | --- |
| POST | `/api/auth/register/send-code` | 发送注册验证码 | 否 |
| POST | `/api/auth/register/verify` | 验证注册验证码 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |
| GET | `/api/auth/session` | 获取当前会话信息 | 是 |

### 用户相关 API

| 方法 | 端点 | 描述 | 认证 |
| --- | --- | --- | --- |
| GET | `/api/user/profile` | 获取用户信息 | 是 |
| PUT | `/api/user/profile` | 更新用户信息 | 是 |
| PUT | `/api/user/password` | 修改密码 | 是 |
| PUT | `/api/user/theme` | 更新主题偏好 | 是 |

### 会话相关 API

| 方法 | 端点 | 描述 | 认证 |
| --- | --- | --- | --- |
| GET | `/api/sessions` | 获取用户所有会话列表 | 是 |
| POST | `/api/sessions` | 创建新会话 | 是 |
| GET | `/api/sessions/:id` | 获取会话详情（含消息） | 是 |
| PUT | `/api/sessions/:id` | 更新会话（如标题） | 是 |
| DELETE | `/api/sessions/:id` | 删除会话 | 是 |

### 消息相关 API

| 方法 | 端点 | 描述 | 认证 |
| --- | --- | --- | --- |
| GET | `/api/sessions/:id/messages` | 获取会话消息列表 | 是 |
| POST | `/api/sessions/:id/messages` | 发送消息并生成图片 | 是 |
| DELETE | `/api/messages/:id` | 删除消息 | 是 |

### 图片相关 API

| 方法 | 端点 | 描述 | 认证 |
| --- | --- | --- | --- |
| POST | `/api/upload` | 上传图片文件 | 是 |
| GET | `/api/images` | 获取收藏图片列表 | 是 |
| PUT | `/api/images/:id/favorite` | 切换收藏状态 | 是 |
| PUT | `/api/images/:id` | 更新图片信息 | 是 |
| DELETE | `/api/images/:id` | 删除图片 | 是 |

---

## 附录：错误码定义

| 错误码 | HTTP状态码 | 说明 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `UNAUTHORIZED` | 401 | 未认证或认证过期 |
| `FORBIDDEN` | 403 | 无权访问该资源 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `EMAIL_EXISTS` | 400 | 邮箱已被注册 |
| `INVALID_CODE` | 400 | 验证码错误或已过期 |
| `INVALID_CREDENTIALS` | 401 | 邮箱或密码错误 |
| `RATE_LIMITED` | 429 | 请求过于频繁 |
| `AI_SERVICE_ERROR` | 500 | AI服务调用失败 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

---

## 附录：数据库表字段

### User 表

| 字段名 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | UUID | PK | 用户唯一标识 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱地址 |
| passwordHash | VARCHAR(255) | NOT NULL | 密码哈希(bcrypt) |
| name | VARCHAR(100) | - | 用户昵称 |
| avatar | VARCHAR(500) | - | 头像URL |
| theme | ENUM('light','dark','system') | DEFAULT 'system' | 主题偏好 |
| createdAt | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updatedAt | TIMESTAMP | DEFAULT NOW() | 更新时间 |

### Session 表

| 字段名 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | UUID | PK | 会话唯一标识 |
| userId | UUID | FK -> User.id, NOT NULL | 所属用户 |
| title | VARCHAR(200) | - | 会话标题 |
| createdAt | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updatedAt | TIMESTAMP | DEFAULT NOW() | 更新时间 |

### Message 表

| 字段名 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | UUID | PK | 消息唯一标识 |
| sessionId | UUID | FK -> Session.id, NOT NULL | 所属会话 |
| userId | UUID | FK -> User.id, NOT NULL | 发送者 |
| role | ENUM('user','assistant','system') | NOT NULL | 消息角色 |
| content | TEXT | - | 文本内容(prompt) |
| imageUrl | VARCHAR(500) | - | 生成的图片URL |
| metadata | JSONB | - | 额外元数据(width,height,model等) |
| createdAt | TIMESTAMP | DEFAULT NOW() | 创建时间 |

### Image 表

| 字段名 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | UUID | PK | 图片唯一标识 |
| userId | UUID | FK -> User.id, NOT NULL | 所属用户 |
| sessionId | UUID | FK -> Session.id | 关联会话（可为null） |
| messageId | UUID | FK -> Message.id | 关联消息 |
| url | VARCHAR(500) | NOT NULL | 访问URL |
| localPath | VARCHAR(500) | NOT NULL | 服务器存储路径 |
| prompt | TEXT | - | 生成时的prompt |
| width | INTEGER | - | 图片宽度 |
| height | INTEGER | - | 图片高度 |
| isFavorite | BOOLEAN | DEFAULT false | 是否收藏 |
| createdAt | TIMESTAMP | DEFAULT NOW() | 创建时间 |

### Verification 表

| 字段名 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | UUID | PK | 验证码唯一标识 |
| email | VARCHAR(255) | NOT NULL | 邮箱地址 |
| code | VARCHAR(6) | NOT NULL | 6位验证码 |
| type | ENUM('register','login','reset') | NOT NULL | 验证码类型 |
| expiresAt | TIMESTAMP | NOT NULL | 过期时间（10分钟后） |
| isUsed | BOOLEAN | DEFAULT false | 是否已使用 |
| createdAt | TIMESTAMP | DEFAULT NOW() | 创建时间 |

---

## 附录：关键常量

### 验证码配置
- 验证码长度：6位数字
- 验证码有效期：10分钟
- 同一邮箱发送间隔：5分钟
- 验证码错误上限：3次

### 登录安全配置
- 登录失败锁定次数：5次
- 登录失败锁定时间：15分钟

### 图片生成配置
- 默认图片尺寸：1024x1024
- 图片格式：WebP
- API 超时时间：60秒

### 图片上传配置
- 单文件大小限制：10MB
- 支持格式：JPEG/PNG/WebP/GIF
