import { test, expect } from '@playwright/test';

test.describe('图库页面 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gallery');
  });

  test('页面加载显示图库标题', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '我的图库' })).toBeVisible();
  });

  test('显示筛选和排序选项', async ({ page }) => {
    await expect(page.getByText('筛选')).toBeVisible();
    await expect(page.getByText('排序')).toBeVisible();
  });

  test('筛选选项包含时间筛选', async ({ page }) => {
    await page.getByRole('button', { name: '筛选' }).click();

    await expect(page.getByRole('option', { name: '全部' })).toBeVisible();
    await expect(page.getByRole('option', { name: '今天' })).toBeVisible();
    await expect(page.getByRole('option', { name: '本周' })).toBeVisible();
    await expect(page.getByRole('option', { name: '本月' })).toBeVisible();
  });

  test('排序选项包含新旧排序', async ({ page }) => {
    await page.getByRole('button', { name: '排序' }).click();

    await expect(page.getByRole('option', { name: '最新' })).toBeVisible();
    await expect(page.getByRole('option', { name: '最旧' })).toBeVisible();
  });

  test('空图库显示引导提示', async ({ page }) => {
    await expect(page.getByText('还没有收藏的图片')).toBeVisible();
    await expect(page.getByText('去创作一幅作品吧')).toBeVisible();
  });

  test('点击去创作跳转到聊天页', async ({ page }) => {
    const goToChatLink = page.getByRole('link', { name: '去创作' });
    await expect(goToChatLink).toBeVisible();
    await goToChatLink.click();

    await expect(page).toHaveURL(/\/chat/);
  });
});

test.describe('图片详情页 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gallery/img-123');
  });

  test('页面加载显示大图预览区域', async ({ page }) => {
    const imagePreview = page.locator('img[alt="图片预览"]');
    await expect(imagePreview).toBeVisible();
  });

  test('显示图片提示词信息', async ({ page }) => {
    await expect(page.getByText('提示词')).toBeVisible();
  });

  test('显示图片创建时间', async ({ page }) => {
    await expect(page.getByText('创建时间')).toBeVisible();
  });

  test('显示下载按钮', async ({ page }) => {
    await expect(page.getByRole('button', { name: '下载' })).toBeVisible();
  });

  test('显示引用创作按钮', async ({ page }) => {
    await expect(page.getByRole('button', { name: '引用创作' })).toBeVisible();
  });

  test('点击引用创作跳转到聊天页', async ({ page }) => {
    await page.getByRole('button', { name: '引用创作' }).click();

    await expect(page).toHaveHaveURL(/\/chat/);
  });

  test('点击下载按钮触发下载', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '下载' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(jpg|png|webp)$/);
  });

  test('显示取消收藏和删除按钮', async ({ page }) => {
    await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible();
    await expect(page.getByRole('button', { name: '删除' })).toBeVisible();
  });
});
