# 墨语 (MoyuAI) 测试套件

本目录包含墨语项目的所有测试用例，包括单元测试、集成测试和端到端(E2E)测试。

## 测试框架

- **Vitest** - 单元测试和集成测试框架
- **Playwright** - 端到端(E2E)测试框架
- **MSW (Mock Service Worker)** - API Mock 服务

## 目录结构

```
test/
├── auth/                    # 认证模块测试
│   ├── register.test.ts    # 注册流程测试
│   └── login.test.ts       # 登录登出测试
├── sessions/               # 会话模块测试
│   └── sessions.test.ts   # 会话CRUD测试
├── messages/              # 消息模块测试
│   └── messages.test.ts   # 消息发送和图片生成测试
├── images/                # 图片模块测试
│   └── images.test.ts     # 图片上传和收藏测试
├── user/                  # 用户设置模块测试
│   └── profile.test.ts    # 用户信息修改测试
├── e2e/                   # 端到端测试
│   ├── registration.spec.ts  # 注册流程E2E
│   ├── chat.spec.ts         # 聊天生图E2E
│   ├── gallery.spec.ts      # 图库页面E2E
│   └── settings.spec.ts     # 设置页面E2E
├── helpers/               # 测试辅助工具
│   ├── api-client.ts      # API客户端封装
│   └── mock-server.ts     # MSW Mock服务器
├── setup.ts              # 测试环境配置
├── vitest.config.ts      # Vitest配置
├── playwright.config.ts  # Playwright配置
└── package.json          # 测试依赖配置
```

## 安装依赖

```bash
cd test
pnpm install
```

## 运行测试

### 单元测试和集成测试 (Vitest)

```bash
# 运行所有单元测试
pnpm test

# 运行测试并监听文件变化
pnpm test:watch

# 生成测试覆盖率报告
pnpm test:coverage
```

### 端到端测试 (Playwright)

```bash
# 安装 Playwright 浏览器
pnpm playwright install

# 运行所有 E2E 测试
pnpm test:e2e

# 运行 E2E 测试并打开 UI
pnpm test:e2e:ui

# 在有头模式下运行
pnpm test:e2e:headed
```

### 运行所有测试

```bash
pnpm test:all
```

## 测试用例说明

### 认证模块 (auth/)

- **注册流程测试** (`register.test.ts`)
  - 发送验证码成功/失败
  - 验证注册成功/失败
  - 邮箱格式验证
  - 密码强度验证

- **登录登出测试** (`login.test.ts`)
  - 登录成功/失败
  - 登出成功
  - 会话获取
  - Token验证

### 会话模块 (sessions/)

- 获取会话列表
- 创建新会话
- 获取会话详情
- 更新会话标题
- 删除会话
- 权限验证

### 消息模块 (messages/)

- 获取消息列表
- 发送文本消息生成图片
- 图片+文本修改
- 框选区域局部修改
- 智能编辑意图识别
- 删除消息

### 图片模块 (images/)

- 上传图片
- 获取收藏列表
- 切换收藏状态
- 更新图片信息
- 删除图片
- 隐私隔离验证

### 用户设置模块 (user/)

- 获取用户信息
- 更新昵称/头像
- 修改密码
- 主题切换

### E2E 测试

- **注册流程** - 页面加载、表单验证、流程跳转
- **聊天生图** - 消息发送、图片生成、编辑功能
- **图库页面** - 图片展示、筛选排序、详情查看
- **个人设置** - 信息修改、密码修改、主题切换

## Mock 服务

`helpers/mock-server.ts` 使用 MSW 模拟所有 API 接口，包括：

- 正常响应
- 错误响应（各种错误码）
- 延迟响应（模拟网络延迟）
- 边界条件

## 测试覆盖率目标

- 认证模块: > 90%
- 会话模块: > 85%
- 消息模块: > 85%
- 图片模块: > 80%
- 用户设置: > 80%

## 注意事项

1. 运行 E2E 测试前需要确保开发服务器正在运行
2. Vitest 使用 Node.js 环境，不依赖浏览器
3. MSW Mock 服务器会拦截所有 fetch 请求
4. 测试数据库应与生产数据库分离
