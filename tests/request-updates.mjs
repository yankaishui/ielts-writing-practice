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
page.on("dialog", (d) => d.accept());
const base = "http://127.0.0.1:5173";
try {
  const backup = JSON.parse(
    await fs.readFile("test-results/backup.json", "utf8"),
  );
  const full = backup.attempts.find((a) => a.demo).text;
  await page.goto(base);
  assert.equal(
    await page.getByText("你的个人写作空间", { exact: true }).count(),
    0,
  );
  await page
    .getByText("专注写作，心无旁骛。你将清楚地感觉到自己的提高。", {
      exact: true,
    })
    .waitFor();
  await page.goto(base + "/questions");
  assert.equal(await page.locator(".question").count(), 111);
  assert.equal(await page.locator(".question-source").count(), 0);
  assert.deepEqual(
    await page.getByLabel("题目来源").locator("option").allTextContents(),
    ["本网站", "用户新增"],
  );
  await page.getByLabel("题目来源").selectOption("custom");
  assert.equal(await page.locator(".question").count(), 0);
  await page.getByLabel("题目来源").selectOption("site");
  await page.getByText("自己编写 / 粘贴作文题目", { exact: true }).click();
  const question =
    "Should cities create more public gardens? Give your reasons and discuss possible disadvantages.";
  await page.getByLabel("自定义作文题目", { exact: true }).fill(question);
  await page.getByLabel("自定义题型", { exact: true }).selectOption("Opinion");
  await page
    .getByLabel("自定义话题", { exact: true })
    .selectOption("Environment");
  await page.screenshot({
    path: "test-results/custom-question.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "使用这道题" }).click();
  await page.getByRole("heading", { name: question, exact: true }).waitFor();
  await page.getByRole("button", { name: "开始考试" }).click();
  await page
    .getByLabel("作文内容", { exact: true })
    .fill("I think public gardens are helpful for families.");
  await page.reload();
  assert.equal(
    await page.getByLabel("作文内容", { exact: true }).inputValue(),
    "I think public gardens are helpful for families.",
  );
  await page.getByRole("button", { name: "完成作文" }).click();
  await page.getByRole("heading", { name: "草稿已保存" }).waitFor();
  await page.screenshot({
    path: "test-results/unfinished.png",
    fullPage: true,
  });
  await page.goto(base + "/history");
  assert.equal(await page.locator("table tbody tr").count(), 0);
  await page.getByText("未完成草稿（不计入统计）", { exact: true }).click();
  await page.getByRole("link", { name: /查看草稿/ }).click();
  await page.getByRole("link", { name: "继续写这篇草稿" }).click();
  assert.equal(
    await page.getByLabel("作文内容", { exact: true }).inputValue(),
    "I think public gardens are helpful for families.",
  );
  await page.getByRole("heading", { name: question, exact: true }).waitFor();
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.getByLabel("作文内容", { exact: true }).fill(full);
  await page.getByRole("button", { name: "完成作文" }).click();
  await page.getByRole("heading", { name: "获取 AI 反馈" }).waitFor();
  await page.getByText("查看完整指令 / 手动复制", { exact: true }).click();
  const prompt = await page
    .getByLabel("评分指令", { exact: true })
    .inputValue();
  assert(prompt.includes(question));
  assert(prompt.includes(JSON.stringify(full).slice(1, -1)));
  const providers = page.locator(".provider-list a");
  assert.equal(await providers.count(), 5);
  for (const a of await providers.all()) {
    assert((await a.getAttribute("href")).startsWith("https://"));
    assert.equal(await a.getAttribute("target"), "_blank");
  }
  assert.equal(await page.locator(".language-note").count(), 0);
  await page.getByText("查看完整指令 / 手动复制", { exact: true }).click();
  await page.screenshot({
    path: "test-results/feedback-guide.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "先查看原稿，稍后再导入反馈" }).click();
  assert.equal(await page.locator(".comparison").count(), 0);
  await page.getByRole("link", { name: "从头重新写" }).click();
  await page.reload();
  await page.getByRole("heading", { name: question, exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("作文内容", { exact: true }).inputValue(),
    "",
  );
  await page.goto(base + "/history");
  assert.equal(await page.locator("table tbody tr").count(), 1);
  await page.goto(base + "/progress");
  assert.equal(
    await page
      .locator(".stat")
      .filter({ hasText: "已完成作文" })
      .locator("strong")
      .innerText(),
    "1",
  );
  await page.goto(base + "/exam/q2");
  await page.getByRole("button", { name: "开始考试" }).click();
  await page.getByLabel("作文内容").fill("asdfgh qwerty zxcv ".repeat(70));
  await page.getByRole("button", { name: "完成作文" }).click();
  await page.getByRole("heading", { name: "草稿已保存" }).waitFor();
  await page.goto(base + "/history");
  assert.equal(await page.locator("table tbody tr").count(), 1);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 111 questions, sourced classification, custom question reload/prompt/rewrite, short draft recovery, gibberish exclusion, valid completion, provider links, removed comparison.",
  );
} finally {
  await browser.close();
}
