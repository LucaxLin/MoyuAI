import { test, expect } from '@playwright/test';

test.describe('个人设置页面 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('页面加载显示设置标题', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible();
  });

  test('显示个人信息区域', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '个人信息' })).toBeVisible();
  });

  test('显示账号安全区域', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '账号安全' })).toBeVisible();
  });

  test('显示偏好设置区域', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '偏好设置' })).toBeVisible();
  });

  test('显示当前用户邮箱', async ({ page }) => {
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('邮箱不可修改', async ({ page }) => {
    const emailInput = page.getByLabel('邮箱');
    await expect(emailInput).toBeDisabled();
  });

  test('可以修改昵称', async ({ page }) => {
    const nameInput = page.getByLabel('昵称');
    await nameInput.clear();
    await nameInput.fill('新昵称');
    await page.getByRole('button', { name: '保存修改' }).click();

    await expect(page.getByText('保存成功')).toBeVisible();
  });

  test('可以切换主题选项', async ({ page }) => {
    await expect(page.getByLabel('浅色')).toBeVisible();
    await expect(page.getByLabel('深色')).toBeVisible();
    await expect(page.getByLabel('跟随系统')).toBeVisible();
  });

  test('可以切换到浅色主题', async ({ page }) => {
    await page.getByLabel('浅色').click();

    await expect(page.getByLabel('浅色')).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('可以切换到深色主题', async ({ page }) => {
    await page.getByLabel('深色').click();

    await expect(page.getByLabel('深色')).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('显示退出登录按钮', async ({ page }) => {
    await expect(page.getByRole('button', { name: '退出登录' })).toBeVisible();
  });

  test('点击退出登录弹出确认', async ({ page }) => {
    await page.getByRole('button', { name: '退出登录' }).click();

    await expect(page.getByText('确定要退出登录吗？')).toBeVisible();
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible();
    await expect(page.getByRole('button', { name: '确定' })).toBeVisible();
  });
});

test.describe('密码修改功能 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('heading', { name: '账号安全' }).scrollIntoViewIfNeeded();
  });

  test('显示当前密码输入框', async ({ page }) => {
    await expect(page.getByLabel('当前密码')).toBeVisible();
  });

  test('显示新密码输入框', async ({ page }) => {
    await expect(page.getByLabel('新密码')).toBeVisible();
  });

  test('显示确认新密码输入框', async ({ page }) => {
    await expect(page.getByLabel('确认新密码')).toBeVisible();
  });

  test('显示修改密码按钮', async ({ page }) => {
    await expect(page.getByRole('button', { name: '修改密码' })).toBeVisible();
  });

  test('正确填写密码可以修改成功', async ({ page }) => {
    await page.getByLabel('当前密码').fill('CorrectPass123');
    await page.getByLabel('新密码').fill('NewSecurePass456');
    await page.getByLabel('确认新密码').fill('NewSecurePass456');
    await page.getByRole('button', { name: '修改密码' }).click();

    await expect(page.getByText('密码修改成功')).toBeVisible();
  });

  test('当前密码错误时显示错误', async ({ page }) => {
    await page.getByLabel('当前密码').fill('wrongpassword');
    await page.getByLabel('新密码').fill('NewSecurePass456');
    await page.getByLabel('确认新密码').fill('NewSecurePass456');
    await page.getByRole('button', { name: '修改密码' }).click();

    await expect(page.getByText('当前密码错误')).toBeVisible();
  });

  test('新密码和确认密码不一致时显示错误', async ({ page }) => {
    await page.getByLabel('当前密码').fill('CorrectPass123');
    await page.getByLabel('新密码').fill('NewSecurePass456');
    await page.getByLabel('确认新密码').fill('DifferentPass789');
    await page.getByRole('button', { name: '修改密码' }).click();

    await expect(page.getByText('两次密码输入不一致')).toBeVisible();
  });
});
