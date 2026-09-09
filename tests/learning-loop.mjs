import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const p = await context.newPage(),
  errors = [],
  external = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("dialog", (d) => d.accept());
p.on("request", (r) => {
  if (
    !r.url().startsWith("http://127.0.0.1:5173/") &&
    !r.url().startsWith("data:")
  )
    external.push(r.url());
});
try {
  await p.goto("http://127.0.0.1:5173/");
  const backup = JSON.parse(
      await fs.readFile("test-results/backup.json", "utf8"),
    ),
    demo = backup.attempts.find((a) => a.demo),
    assessment = backup.assessments[demo.id];
  const first = {
      ...demo,
      id: "learn-first",
      demo: false,
      createdAt: "2026-08-01T12:00:00.000Z",
    },
    second = {
      ...demo,
      id: "learn-second",
      demo: false,
      createdAt: "2026-08-02T12:00:00.000Z",
    },
    current = {
      ...demo,
      id: "learn-current",
      demo: false,
      createdAt: "2026-08-03T12:00:00.000Z",
    };
  const currentAssessment = structuredClone(assessment);
  currentAssessment.problems = currentAssessment.problems.filter(
    (p) => p.type !== "language_error",
  );
  const expression = {
    id: "saved-earlier",
    expression: "short-term economic concerns",
    meaning: "短期经济压力",
    example: "Short-term economic concerns can affect decisions.",
    sourceEssayId: first.id,
    type: "Useful Expression",
    dateSaved: "2026-08-01T13:00:00.000Z",
    status: "Learning",
  };
  await p.evaluate(
    ({ first, second, current, assessment, currentAssessment, expression }) => {
      localStorage.setItem(
        "ielts-writing:v1:attempts",
        JSON.stringify([first, second, current]),
      );
      localStorage.setItem(
        "ielts-writing:v1:assessments",
        JSON.stringify({
          [first.id]: assessment,
          [second.id]: assessment,
          [current.id]: currentAssessment,
        }),
      );
      localStorage.setItem(
        "ielts-writing:v1:expressions",
        JSON.stringify([expression]),
      );
    },
    { first, second, current, assessment, currentAssessment, expression },
  );
  await p.reload();
  await p.locator(".continue-practice").waitFor();
  await p.screenshot({
    path: "test-results/zh-home-returning.png",
    fullPage: true,
  });
  await p
    .locator(".continue-practice")
    .getByRole("link", { name: "继续上次的改进" })
    .click();
  await p
    .getByRole("heading", { name: "5 分钟专项修改", exact: true })
    .waitFor();
  assert.equal(
    await p.getByLabel("选择要练习的段落", { exact: true }).inputValue(),
    "2",
  );
  await p.getByRole("button", { name: "开始 5 分钟修改", exact: true }).click();
  const original = await p.getByLabel("专项修改内容").inputValue();
  assert(original.includes("public transport"));
  assert(
    await p
      .getByRole("button", { name: "保存修改，查看前后对比" })
      .isDisabled(),
  );
  const revised = original.replace(
    "They should also improve public transport. This would be good for the environment.",
    "They should also improve public transport by making buses more frequent. Shorter waiting times could encourage commuters to leave their cars at home, reducing emissions from daily journeys.",
  );
  await p.getByLabel("专项修改内容").fill(revised);
  await p.getByRole("link", { name: "先保存草稿，下次继续" }).click();
  await p
    .locator(".continue-practice")
    .getByRole("link", { name: "继续专项修改" })
    .click();
  await p.reload();
  assert.equal(await p.getByLabel("专项修改内容").inputValue(), revised);
  await p.clock.install();
  await p.clock.fastForward(301000);
  await p
    .getByText("建议的 5 分钟已到，可以继续完善", { exact: false })
    .waitFor();
  assert(await p.getByLabel("专项修改内容").isEnabled());
  await p
    .getByLabel("我补充或理清了为什么、如何、原因或结果", { exact: true })
    .check();
  await p
    .getByLabel("我具体改了什么？（可选，中文即可）")
    .fill("我补充了班次增加如何让通勤者减少开车。");
  await p.screenshot({
    path: "test-results/zh-focus-editor.png",
    fullPage: true,
  });
  await p.getByRole("button", { name: "保存修改，查看前后对比" }).click();
  await p.getByText("这次修改已保存。你可以直接看到自己改了什么。").waitFor();
  assert((await p.locator("ins").count()) > 0);
  assert((await p.locator("del").count()) > 0);
  let data = await p.evaluate(() => ({
    attempts: JSON.parse(localStorage.getItem("ielts-writing:v1:attempts")),
    practices: JSON.parse(localStorage.getItem("ielts-writing:v1:practices")),
  }));
  assert.equal(data.attempts.find((a) => a.id === current.id).text, demo.text);
  assert.equal(data.practices.length, 1);
  assert(data.practices[0].finishedAt);
  assert(data.practices[0].duration >= 300);
  assert.equal(data.practices[0].original, original);
  assert.equal(data.practices[0].checks.length, 1);
  await p.getByRole("link", { name: "回到复盘，看看变化" }).click();
  await p.getByRole("heading", { name: "看得见的变化", exact: true }).waitFor();
  await p
    .getByRole("heading", { name: "拼写：本次未检出", exact: true })
    .waitFor();
  await p.getByText("本篇出现了之前收藏的表达").waitFor();
  await p.screenshot({ path: "test-results/zh-review.png", fullPage: true });
  await p.goto("http://127.0.0.1:5173/progress");
  await p.getByRole("heading", { name: "看得见的变化", exact: true }).waitFor();
  assert.equal(await p.locator(".recharts-line-curve").count(), 13);
  await p.goto("http://127.0.0.1:5173/focus/learn-current");
  await p.getByRole("button", { name: "开始 5 分钟修改", exact: true }).click();
  await p
    .getByLabel("专项修改内容")
    .fill(original + " This needs continued action.");
  await p.getByRole("button", { name: "保存修改，查看前后对比" }).click();
  data = await p.evaluate(() =>
    JSON.parse(localStorage.getItem("ielts-writing:v1:practices")),
  );
  assert.equal(data.length, 2);
  assert.equal(data[0].revised, revised);
  await p.goto("http://127.0.0.1:5173/settings");
  const downloadPromise = p.waitForEvent("download");
  await p.getByRole("button", { name: "导出备份", exact: true }).click();
  await (await downloadPromise).saveAs("test-results/learning-backup.json");
  const exported = JSON.parse(
    await fs.readFile("test-results/learning-backup.json", "utf8"),
  );
  assert.equal(exported.practices.length, 2);
  await p.getByRole("button", { name: "清空全部数据", exact: true }).click();
  await p.getByRole("button", { name: "确认清空" }).click();
  assert.equal(
    await p.evaluate(() => localStorage.getItem("ielts-writing:v1:practices")),
    null,
  );
  await p
    .locator("input[type=file]")
    .setInputFiles("test-results/learning-backup.json");
  await p.getByText("备份恢复成功。").waitFor();
  assert.equal(
    await p.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ielts-writing:v1:practices")).length,
    ),
    2,
  );
  await p.evaluate(() => {
    const a = JSON.parse(localStorage.getItem("ielts-writing:v1:assessments"));
    a["learn-current"].nextPriority.reason =
      "Your supporting detail needs work.";
    localStorage.setItem("ielts-writing:v1:assessments", JSON.stringify(a));
  });
  await p.goto("http://127.0.0.1:5173/review/learn-current");
  await p.getByRole("link", { name: "获取中文转换指令" }).click();
  await p.getByText("已有英文反馈？只转换评语语言，保留原评分").click();
  await p
    .getByRole("button", { name: "复制中文转换指令", exact: true })
    .click();
  const conversion = await p.evaluate(() => navigator.clipboard.readText());
  assert(conversion.includes("只翻译，不要重新评分"));
  assert(conversion.includes("Your supporting detail needs work."));
  assert(conversion.includes("Supporting Detail"));
  await p.getByRole("button", { name: "复制评分指令", exact: true }).click();
  const prompt = await p.evaluate(() => navigator.clipboard.readText());
  assert(prompt.includes("所有解释性文字必须用简体中文"));
  assert(prompt.includes("originalQuote"));
  assert(!prompt.includes("Use English for assessment explanations"));
  await p.goto("http://127.0.0.1:5173/focus/learn-current");
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({
    path: "test-results/zh-focus-mobile.png",
    fullPage: true,
  });
  assert(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    "PASS: Chinese prompt and legacy translation, next action, paragraph selection, resume/reload, five-minute guidance, self-check, immutable original/completed sessions, visible evidence, expression reuse, recurring error observations, backups, mobile, no external API requests.",
  );
} catch (e) {
  console.log(
    p.url(),
    errors,
    (await p.locator("body").innerText()).slice(0, 3500),
  );
  await p.screenshot({
    path: "test-results/learning-failure.png",
    fullPage: true,
  });
  throw e;
} finally {
  await browser.close();
}
