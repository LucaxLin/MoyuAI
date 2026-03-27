import { test, expect } from '@playwright/test';

test.describe('用户注册流程 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('用户可以成功访问注册页面', async ({ page }) => {
    await expect(page).toHaveTitle(/墨语/);
    await expect(page.getByPlaceholder('邮箱地址')).toBeVisible();
    await expect(page.getByPlaceholder('密码 (至少8位，包含数字和字母)')).toBeVisible();
  });

  test('可以填写注册表单并提交验证码', async ({ page }) => {
    await page.getByPlaceholder('邮箱地址').fill('test@example.com');
    await page.getByPlaceholder('密码 (至少8位，包含数字和字母)').fill('SecurePass123');
    await page.getByPlaceholder('确认密码').fill('SecurePass123');
    await page.getByRole('button', { name: '获取验证码' }).click();

    await expect(page.getByPlaceholder('请输入验证码')).toBeVisible();
  });

  test('邮箱格式不正确时显示错误', async ({ page }) => {
    await page.getByPlaceholder('邮箱地址').fill('invalid-email');
    await page.getByPlaceholder('邮箱地址').blur();

    await expect(page.getByText('请输入有效的邮箱地址')).toBeVisible();
  });

  test('密码强度不足时显示提示', async ({ page }) => {
    await page.getByPlaceholder('邮箱地址').fill('test@example.com');
    await page.getByPlaceholder('密码 (至少8位，包含数字和字母)').fill('weak');
    await page.getByPlaceholder('密码 (至少8位，包含数字和字母)').blur();

    await expect(page.getByText('密码至少8位，需包含数字和字母')).toBeVisible();
  });

  test('两次密码不一致时显示错误', async ({ page }) => {
    await page.getByPlaceholder('邮箱地址').fill('test@example.com');
    await page.getByPlaceholder('密码 (至少8位，包含数字和字母)').fill('SecurePass123');
    await page.getByPlaceholder('确认密码').fill('DifferentPass123');
    await page.getByPlaceholder('确认密码').blur();

    await expect(page.getByText('两次密码输入不一致')).toBeVisible();
  });

  test('点击去登录链接跳转到登录页', async ({ page }) => {
    await page.getByText('已有账号？').getByRole('link', { name: '去登录' }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('用户登录流程 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('用户可以成功访问登录页面', async ({ page }) => {
    await expect(page).toHaveTitle(/墨语/);
    await expect(page.getByPlaceholder('邮箱地址')).toBeVisible();
    await expect(page.getByPlaceholder('密码')).toBeVisible();
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
  });

  test('可以成功登录并跳转到聊天页', async ({ page }) => {
    await page.getByPlaceholder('邮箱地址').fill('test@example.com');
    await page.getByPlaceholder('密码').fill('CorrectPass123');
    await page.getByRole('button', { name: '登录' }).click();

    await page.waitForURL(/\/chat/, { timeout: 5000 });
  });

  test('登录失败显示错误提示', async ({ page }) => {
    await page.getByPlaceholder('邮箱地址').fill('wrong@example.com');
    await page.getByPlaceholder('密码').fill('wrongpass');
    await page.getByRole('button', { name: '登录' }).click();

    await expect(page.getByText('邮箱或密码错误')).toBeVisible();
  });

  test('未填写邮箱时禁用登录按钮', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: '登录' });
    await expect(loginButton).toBeDisabled();
  });

  test('点击去注册链接跳转到注册页', async ({ page }) => {
    await page.getByText('还没有账号？').getByRole('link', { name: '去注册' }).click();

    await expect(page).toHaveURL(/\/register/);
  });
});
