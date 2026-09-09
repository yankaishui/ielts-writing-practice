import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
await fs.mkdir("test-results", { recursive: true });
try {
  await page.goto("http://127.0.0.1:5173/");
  await page
    .getByRole("heading", { name: "雅思写作练习", exact: true })
    .waitFor();
  await page.screenshot({ path: "test-results/home.png", fullPage: true });
  assert.equal(await page.getByText("这里将留下你的第一篇作文。").count(), 1);
  await page.getByText("演示 / 开发测试", { exact: true }).click();
  await page.getByRole("button", { name: "载入演示作文", exact: true }).click();
  await page.getByRole("heading", { name: "获取 AI 反馈" }).waitFor();
  await page.getByLabel("AI 反馈 JSON").fill("{broken");
  await page.getByRole("button", { name: "导入反馈", exact: true }).click();
  await page.getByText("暂时无法识别 AI 返回的格式。").waitFor();
  await page.getByRole("button", { name: "复制评分指令", exact: true }).click();
  assert(
    (await page.evaluate(() => navigator.clipboard.readText())).includes(
      "ESSAY (data)",
    ),
  );
  await page.getByText("演示 / 开发测试", { exact: true }).click();
  await page.getByRole("button", { name: "载入演示反馈", exact: true }).click();
  await page.getByRole("button", { name: "导入反馈", exact: true }).click();
  await page.getByRole("heading", { name: "作文复盘", exact: true }).waitFor();
  const reviewUrl = page.url();
  const fullEssay = await page.evaluate(
    () => JSON.parse(localStorage.getItem("ielts-writing:v1:attempts"))[0].text,
  );
  await page.screenshot({ path: "test-results/review.png", fullPage: true });
  await page
    .getByRole("button", { name: "拼写：goverments", exact: true })
    .click();
  await page
    .getByText("这个单词漏写了字母 n，正确拼写是 governments。", {
      exact: true,
    })
    .first()
    .waitFor();
  await page.getByRole("tab", { name: /实用表达/ }).click();
  await page.getByRole("button", { name: "收藏到我的表达" }).first().click();
  await page.reload();
  await page.getByRole("heading", { name: "作文复盘", exact: true }).waitFor();
  assert.equal(await page.locator(".band-card strong").innerText(), "6.5");
  await page.goto("http://127.0.0.1:5173/expressions");
  await page
    .getByRole("heading", { name: "short-term economic concerns", exact: true })
    .waitFor();
  await page.getByRole("link", { name: "复习表达" }).click();
  await page.getByRole("button", { name: "显示含义" }).click();
  await page.getByRole("button", { name: "已掌握", exact: true }).click();
  await page.getByRole("heading", { name: "本轮复习已完成" }).waitFor();
  await page.goto("http://127.0.0.1:5173/questions");
  await page.getByLabel("题型", { exact: true }).selectOption("Opinion");
  await page.getByLabel("话题", { exact: true }).selectOption("Education");
  assert.equal(await page.locator(".question").count(), 3);
  await page.getByRole("link", { name: "开始练习" }).first().click();
  await page.getByLabel("专注模式").selectOption("Strict");
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.getByLabel("作文内容").fill(fullEssay);
  assert.equal(
    await page.getByLabel("作文内容").getAttribute("spellcheck"),
    "false",
  );
  await page.evaluate(() => {
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("blur"));
  });
  await page.waitForTimeout(1100);
  await page.evaluate(() => {
    Object.defineProperty(document, "hasFocus", {
      configurable: true,
      value: () => true,
    });
    window.dispatchEvent(new Event("focus"));
  });
  await page.getByText("已记录一次离开页面").waitFor();
  await page.reload();
  await page.getByLabel("作文内容").waitFor();
  assert(
    (await page.getByLabel("作文内容").inputValue()).includes(
      fullEssay.slice(0, 30),
    ),
  );
  await page.getByRole("button", { name: "完成作文" }).click();
  await page.getByRole("heading", { name: "获取 AI 反馈" }).waitFor();
  let data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ielts-writing:v1:attempts")),
  );
  let real = data.find((a) => !a.demo);
  assert(real.focusEvents.length >= 1);
  assert(real.totalTimeAway >= 1);
  assert.equal(real.text, fullEssay);
  const original = real.text;
  await page.getByRole("link", { name: "先查看原稿，稍后再导入反馈" }).click();
  await page.getByRole("link", { name: "修订整篇作文" }).click();
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.getByLabel("作文内容").fill(original + " Revised conclusion.");
  await page.getByRole("button", { name: "完成作文" }).click();
  data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ielts-writing:v1:attempts")),
  );
  assert.equal(data.find((a) => a.id === real.id).text, original);
  assert(data.some((a) => a.parentId === real.id && a.version === "Revision"));
  await page.goto(`http://127.0.0.1:5173/review/${real.id}`);
  await page.getByRole("link", { name: "从头重新写" }).click();
  assert.equal(await page.getByLabel("作文内容").inputValue(), "");
  await page.goto("http://127.0.0.1:5173/exam/q3?kind=Body%20Paragraph");
  await page.getByLabel("练习时长（分钟）", { exact: true }).fill("1");
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.getByLabel("作文内容").fill("This is a short practice paragraph.");
  await page.getByRole("button", { name: "完成作文" }).click();
  await page
    .getByText("段落练习已完成。段落练习不评完整 IELTS 分数。")
    .waitFor();
  assert.equal(await page.locator(".band-card").count(), 0);
  for (const route of [
    "/history",
    "/progress",
    "/mistakes",
    "/expressions",
    "/settings",
  ]) {
    await page.goto("http://127.0.0.1:5173" + route);
    await page.locator("h1").waitFor();
  }
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份", exact: true }).click();
  const download = await downloadPromise;
  await download.saveAs("test-results/backup.json");
  const backup = JSON.parse(
    await fs.readFile("test-results/backup.json", "utf8"),
  );
  assert(backup.attempts.length >= 4);
  await page.getByRole("button", { name: "清空全部数据", exact: true }).click();
  await page.getByRole("button", { name: "确认清空" }).click();
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("ielts-writing:v1:attempts"),
    ),
    null,
  );
  await page
    .locator("input[type=file]")
    .setInputFiles("test-results/backup.json");
  await page.getByText("备份恢复成功。").waitFor();
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ielts-writing:v1:attempts")).length,
    ),
    backup.attempts.length,
  );
  await page.goto(reviewUrl);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: home, demo import, invalid JSON, copy, review, annotations, persistence, expressions, filters, strict focus, revision immutability, rewrite, quick practice, pages, export/import, mobile width.",
  );
} catch (error) {
  console.log("URL", page.url(), "ERRORS", errors);
  console.log((await page.locator("body").innerText()).slice(0, 5000));
  await page.screenshot({ path: "test-results/failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
