import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.on("dialog", (d) => d.accept());
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:5173/exam/q2?kind=Introduction");
  await page
    .getByLabel("练习部分", { exact: true })
    .selectOption("Body Paragraph");
  await page.getByRole("heading", { name: "主体段", exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("练习时长（分钟）", { exact: true }).inputValue(),
    "15",
  );
  await page.getByLabel("练习时长（分钟）", { exact: true }).fill("1");
  await page.clock.install();
  await page.getByRole("button", { name: "开始考试", exact: true }).click();
  await page.getByLabel("作文内容").fill("An example of a focused paragraph.");
  await page.clock.fastForward(61000);
  await page.getByRole("heading", { name: "作文复盘", exact: true }).waitFor();
  const attempts = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ielts-writing:v1:attempts")),
  );
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].duration, 60);
  assert.equal(attempts[0].kind, "Body Paragraph");
  await context.close();
  const next = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const p = await next.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("dialog", (d) => d.accept());
  await p.goto("http://127.0.0.1:5173/");
  const backup = JSON.parse(
    await fs.readFile("test-results/backup.json", "utf8"),
  );
  const demo = backup.attempts.find((a) => a.demo),
    assessment = backup.assessments[demo.id];
  // Synthetic fixtures are confined to this isolated test browser, never user storage.
  const first = {
    ...demo,
    id: "fixture-one",
    demo: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  };
  const second = {
    ...demo,
    id: "fixture-two",
    demo: false,
    createdAt: new Date().toISOString(),
  };
  await p.evaluate(
    ({ first, second, assessment }) => {
      localStorage.setItem(
        "ielts-writing:v1:attempts",
        JSON.stringify([first, second]),
      );
      localStorage.setItem(
        "ielts-writing:v1:assessments",
        JSON.stringify({ [first.id]: assessment, [second.id]: assessment }),
      );
    },
    { first, second, assessment },
  );
  await p.goto("http://127.0.0.1:5173/progress");
  await p
    .locator(".recharts-line-curve")
    .first()
    .waitFor({ state: "attached" });
  assert.equal(await p.locator(".recharts-line-curve").count(), 13);
  await p.getByText("拼写", { exact: true }).waitFor();
  await p.screenshot({ path: "test-results/progress.png", fullPage: true });
  await p.goto("http://127.0.0.1:5173/review/fixture-two");
  assert.equal(
    await p.getByText("对比同一道题的不同版本", { exact: true }).count(),
    0,
  );
  assert.equal(await p.locator(".comparison").count(), 0);
  await p.goto("http://127.0.0.1:5173/settings");
  await p.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"attempts":[{"id":"broken"}]}'),
  });
  await p.getByText("导入失败", { exact: false }).waitFor();
  assert.equal(
    await p.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ielts-writing:v1:attempts")).length,
    ),
    2,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: quick-section defaults, automatic deadline submission, populated 13 score trends, recurring errors, removed attempt comparison, invalid backup preserves data.",
  );
} finally {
  await browser.close();
}
