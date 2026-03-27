import { test, expect } from '@playwright/test';

test.describe('聊天生图页面 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
  });

  test('页面加载显示欢迎语和输入框', async ({ page }) => {
    await expect(page.getByPlaceholder('请描述你想要生成的图片...')).toBeVisible();
    await expect(page.getByRole('button', { name: '发送' })).toBeVisible();
  });

  test('左侧边栏显示会话列表', async ({ page }) => {
    await expect(page.getByText('会话')).toBeVisible();
    await expect(page.getByRole('button', { name: '新建会话' })).toBeVisible();
  });

  test('可以输入文本并发送消息', async ({ page }) => {
    const input = page.getByPlaceholder('请描述你想要生成的图片...');
    await input.fill('画一只可爱的猫');

    const sendButton = page.getByRole('button', { name: '发送' });
    await sendButton.click();

    await expect(page.getByText('画一只可爱的猫')).toBeVisible();
  });

  test('按Enter键可以发送消息', async ({ page }) => {
    const input = page.getByPlaceholder('请描述你想要生成的图片...');
    await input.fill('画一只可爱的猫');
    await input.press('Enter');

    await expect(page.getByText('画一只可爱的猫')).toBeVisible();
  });

  test('Shift+Enter可以换行', async ({ page }) => {
    const input = page.getByPlaceholder('请描述你想要生成的图片...');
    await input.fill('第一行');
    await input.press('Shift+Enter');
    await input.type('第二行');

    const sendButton = page.getByRole('button', { name: '发送' });
    await sendButton.click();

    await expect(page.getByText('第一行')).toBeVisible();
    await expect(page.getByText('第二行')).toBeVisible();
  });

  test('AI生成图片时显示加载状态', async ({ page }) => {
    const input = page.getByPlaceholder('请描述你想要生成的图片...');
    await input.fill('画一只可爱的猫');
    await page.getByRole('button', { name: '发送' }).click();

    await expect(page.getByText('AI正在创作中...')).toBeVisible();
  });

  test('生成完成后显示图片和操作按钮', async ({ page }) => {
    const input = page.getByPlaceholder('请描述你想要生成的图片...');
    await input.fill('画一只可爱的猫');
    await page.getByRole('button', { name: '发送' }).click();

    await page.waitForSelector('img[alt*="生成的图片"]', { timeout: 10000 });
    await expect(page.getByRole('button', { name: '收藏' })).toBeVisible();
    await expect(page.getByRole('button', { name: '下载' })).toBeVisible();
    await expect(page.getByRole('button', { name: '局部编辑' })).toBeVisible();
  });

  test('可以点击新建会话按钮', async ({ page }) => {
    await page.getByRole('button', { name: '新建会话' }).click();

    const input = page.getByPlaceholder('请描述你想要生成的图片...');
    await expect(input).toBeVisible();
  });

  test('移动端布局正确', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.getByPlaceholder('请描述你想要生成的图片...')).toBeVisible();
    await expect(page.locator('button').first()).toBeVisible();
  });
});

test.describe('图片编辑功能 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
    const input = page.getByPlaceholder('请描述你想要生成的图片...');
    await input.fill('画一幅日落海景');
    await page.getByRole('button', { name: '发送' }).click();
    await page.waitForTimeout(3000);
  });

  test('可以收藏图片', async ({ page }) => {
    const favoriteButton = page.getByRole('button', { name: '收藏' });
    await favoriteButton.click();

    await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible();
  });

  test('可以取消收藏', async ({ page }) => {
    const favoriteButton = page.getByRole('button', { name: '收藏' });
    await favoriteButton.click();
    await page.waitForTimeout(500);

    const unfavoriteButton = page.getByRole('button', { name: '取消收藏' });
    await unfavoriteButton.click();

    await expect(page.getByRole('button', { name: '收藏' })).toBeVisible();
  });

  test('可以输入编辑指令重新生成', async ({ page }) => {
    const input = page.getByPlaceholder('请描述你想要生成的图片...');
    await input.fill('不对');
    await page.getByRole('button', { name: '发送' }).click();

    await page.waitForTimeout(3000);
    await expect(page.getByText('不对')).toBeVisible();
  });

  test('可以输入编辑指令微调', async ({ page }) => {
    const input = page.getByPlaceholder('请描述你想要生成的图片...');
    await input.fill('稍微调整一下颜色');
    await page.getByRole('button', { name: '发送' }).click();

    await page.waitForTimeout(3000);
    await expect(page.getByText('稍微调整一下颜色')).toBeVisible();
  });
});
