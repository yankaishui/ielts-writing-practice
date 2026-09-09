import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept().catch(() => {}));
const base = "http://127.0.0.1:5173";
try {
  await page.goto(base);
  await page.screenshot({
    path: "test-results/custom-home.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "自定义题目", exact: true }).click();
  assert.equal(await page.locator(".custom-question").getAttribute("open"), "");
  const question =
    "Should towns plant more trees? Explain your opinion and give reasons.";
  await page.getByLabel("自定义作文题目", { exact: true }).fill(question);
  await page
    .getByLabel("自定义话题", { exact: true })
    .selectOption("Environment");
  await page.getByRole("button", { name: "使用这道题" }).click();
  await page.getByRole("heading", { name: question, exact: true }).waitFor();
  const examUrl = page.url();
  await page.reload();
  await page.getByRole("heading", { name: question, exact: true }).waitFor();
  await page.goto(base + "/questions");
  await page.getByLabel("题目来源", { exact: true }).selectOption("custom");
  assert.equal(await page.locator(".question").count(), 1);
  assert.equal(await page.locator(".practiced-link").count(), 0);
  await page.getByRole("link", { name: "开始练习" }).click();
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.getByLabel("作文内容").fill("A short unfinished essay.");
  await page.getByRole("button", { name: "完成作文" }).click();
  await page.getByRole("heading", { name: "草稿已保存" }).waitFor();
  await page.goto(base + "/questions");
  assert.equal(await page.locator(".practiced-link").count(), 0);
  await page.goto(examUrl);
  await page.getByRole("button", { name: "开始考试" }).click();
  const fixture = JSON.parse(
    await fs.readFile("test-results/backup.json", "utf8"),
  );
  await page
    .getByLabel("作文内容")
    .fill(fixture.attempts.find((a) => a.demo).text);
  await page.getByRole("button", { name: "完成作文" }).click();
  await page.getByRole("heading", { name: "获取 AI 反馈" }).waitFor();
  const reviewId = page.url().split("/").at(-1);
  await page.goto(base + "/questions");
  await page.getByLabel("题目来源", { exact: true }).selectOption("custom");
  await page.getByRole("link", { name: /已练习 1 次/ }).click();
  assert.equal(page.url(), base + "/review/" + reviewId);
  await page.goto(base + "/settings");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: /导出/ }).click();
  const download = await downloaded;
  const exported = JSON.parse(await fs.readFile(await download.path(), "utf8"));
  assert.equal(exported.customQuestions.length, 1);
  await page.getByRole("button", { name: /清空/ }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(exported)),
    });
  await page.getByText("备份恢复成功。", { exact: true }).waitFor();
  await page.goto(base + "/questions");
  await page.getByLabel("题目来源", { exact: true }).selectOption("custom");
  assert.equal(await page.locator(".question").count(), 1);
  await page.getByRole("link", { name: /已练习 1 次/ }).waitFor();
  await page.screenshot({
    path: "test-results/custom-practiced.png",
    fullPage: true,
  });
  await page.reload();
  await page.getByLabel("题目来源", { exact: true }).selectOption("custom");
  assert.equal(await page.locator(".question").count(), 1);
  // Legacy backup: question recovered from its saved essay even without new storage key.
  delete exported.customQuestions;
  await page.goto(base + "/settings");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "old.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(exported)),
    });
  await page.getByText("备份恢复成功。", { exact: true }).waitFor();
  await page.goto(base + "/questions");
  await page.getByLabel("题目来源", { exact: true }).selectOption("custom");
  assert.equal(await page.locator(".question").count(), 1);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: home entry, auto-save, refresh, custom source, unfinished exclusion, review badge, export/import and legacy recovery.",
  );
} finally {
  await browser.close();
}
