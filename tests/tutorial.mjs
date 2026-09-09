import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
try {
 await page.goto('http://127.0.0.1:5173/');
 await page.getByText('演示 / 开发测试', { exact: true }).click();
 await page.getByRole('button', { name: '载入演示作文', exact: true }).click();
 await page.getByRole('heading', { name: '获取 AI 反馈' }).waitFor();
 assert.equal(await page.locator('video').count(), 0);
 await page.getByRole('button', { name: '演示', exact: true }).click();
 await page.waitForFunction(() => { const v = document.querySelector('video'); return v && v.readyState >= 2; });
 const duration = await page.locator('video').evaluate(v => v.duration);
 assert(duration > 0 && Number.isFinite(duration));
 await page.locator('video').evaluate(async v => { v.muted = true; await v.play(); });
 await page.waitForFunction(() => document.querySelector('video').currentTime > 0.2);
 await page.getByRole('button', { name: '收起演示', exact: true }).click();
 assert.equal(await page.locator('video').count(), 0);
 console.log('PASS: tutorial opens, loads, decodes and plays; closing removes player. Duration: ' + duration);
} finally { await browser.close(); }
