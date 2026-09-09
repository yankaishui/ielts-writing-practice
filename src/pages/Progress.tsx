import { isEligibleAttempt } from "../utils/eligibility";
import { zh } from "../utils/labels";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useStore } from "../context";
import { Heading, Stat } from "../components/Shared";
import { DiagnosticRadar } from "../components/DiagnosticRadar";
import { LearningEvidence } from "../components/LearningEvidence";
import { band, durationLabel, stats } from "../utils/scoring";
import {
  dimensions,
  scoreLabels,
  type Assessment,
  type EssayAttempt,
} from "../types";
export function recurring(
  attempts: EssayAttempt[],
  assessments: Record<string, Assessment>,
) {
  const recent = attempts
      .filter((a) => !a.demo && isEligibleAttempt(a) && assessments[a.id])
      .slice(-5),
    counts: Record<string, { occurrences: number; essays: number }> = {};
  for (const a of recent) {
    for (const p of assessments[a.id].problems.filter(
      (p) => p.type === "language_error",
    )) {
      const c = counts[p.category] ?? { occurrences: 0, essays: 0 };
      counts[p.category] = {
        occurrences: c.occurrences + 1 + p.otherOccurrences.length,
        essays: c.essays + 1,
      };
    }
  }
  return Object.entries(counts)
    .filter(([, v]) => v.essays >= 2)
    .sort((a, b) => b[1].occurrences - a[1].occurrences);
}
export function Trend({
  title,
  data,
  keys,
  domain,
}: {
  title: string;
  data: Record<string, string | number>[];
  keys: string[];
  domain?: [number, number];
}) {
  return (
    <section className="card trend">
      <h2>{title}</h2>
      {data.length < 2 ? (
        <div className="chart-empty">
          数据还不够。 <small> 至少积累两次相关练习后，即可查看趋势。 </small>
        </div>
      ) : (
        <div className="line-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 15, right: 15, left: -25, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e7eaf2"
              />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                domain={domain ?? ["auto", "auto"]}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              {keys.length > 1 && <Legend />}
              {keys.map((k, i) => (
                <Line
                  key={k}
                  type="linear"
                  dataKey={k}
                  name={zh(k)}
                  isAnimationActive={false}
                  stroke={["#516ad8", "#39a080", "#ae7f40", "#9c6cba"][i % 4]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
export function Progress() {
  const { attempts, assessments, practices } = useStore(),
    valid = attempts.filter((a) => !a.demo && isEligibleAttempt(a)),
    full = valid.filter(
      (a) => a.kind === "Full Essay" && a.version !== "Revision",
    ),
    rated = full.filter((a) => assessments[a.id]),
    s = stats(attempts, assessments),
    last = rated.at(-1),
    habits = recurring(full, assessments);
  const recentChange = [...practices]
    .reverse()
    .find((p) => p.finishedAt && valid.some((a) => a.id === p.essayId));
  const evidenceAttempt =
    valid.find((a) => a.id === recentChange?.essayId) ?? last;
  const data = rated.map((a, i) => ({
    date: `${i + 1} · ${new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
    Band: band(assessments[a.id]),
    ...Object.fromEntries(
      Object.entries(assessments[a.id].scores).map(([k, v]) => [k, v.score]),
    ),
    ...assessments[a.id].diagnostics,
  }));
  return (
    <>
      <Heading
        title="学习进度"
        description="看见多次练习中的变化，不只关注一次分数。"
      />
      {evidenceAttempt && <LearningEvidence attempt={evidenceAttempt} />}
      <div className="stats-grid">
        <Stat label="已完成作文" value={s.essaysCompleted} />
        <Stat
          label="平均词数"
          value={
            full.length
              ? Math.round(
                  full.reduce((n, a) => n + a.wordCount, 0) / full.length,
                )
              : "—"
          }
        />
        <Stat
          label="平均用时"
          value={
            full.length
              ? durationLabel(
                  full.reduce((n, a) => n + a.duration, 0) / full.length,
                )
              : "—"
          }
        />
        <Stat label="连续练习" value={`${s.currentStreak} 天`} />
      </div>
      <p className="muted">
        趋势统计考试原稿与从头重写，演示和修订版不计入。修订变化可在同题对比中查看。{" "}
      </p>
      <Trend title="预估分数趋势" data={data} keys={["Band"]} domain={[4, 9]} />
      <div className="two-col">
        {Object.entries(scoreLabels).map(([key, label]) => (
          <Trend
            key={key}
            title={zh(label)}
            data={data}
            keys={[key]}
            domain={[4, 9]}
          />
        ))}
      </div>
      <div className="section-heading">
        <h2> 八项写作能力 </h2>
      </div>
      {last ? (
        <DiagnosticRadar scores={assessments[last.id].diagnostics} />
      ) : (
        <div className="card chart-empty">
          暂时没有评分记录，导入反馈后即可查看能力画像。{" "}
        </div>
      )}
      <div className="two-col">
        {Object.entries(dimensions).map(([key, label]) => (
          <Trend
            key={key}
            title={zh(label)}
            data={data}
            keys={[key]}
            domain={[0, 10]}
          />
        ))}
      </div>
      <Trend
        title="离开页面次数 · 严格考试模式"
        data={valid
          .filter((a) => a.mode === "Strict" && a.version !== "Revision")
          .map((a, i) => ({
            date: `${i + 1} · ${new Date(a.createdAt).toLocaleDateString()}`,
            Violations: a.focusEvents.length,
          }))}
        keys={["Violations"]}
      />
      <section className="card">
        <h2> 反复出现的语言问题 </h2>
        <p> 最近 5 篇已评作文中，至少有 2 篇出现的问题。 </p>
        {habits.length ? (
          habits.map(([category, c]) => (
            <p key={zh(category)}>
              <b>{zh(category)}</b> · {c.occurrences} 次，分布在 {c.essays}{" "}
              篇作文{" "}
            </p>
          ))
        ) : (
          <p> 暂无足够数据，或尚未发现反复出现的问题。 </p>
        )}
      </section>
    </>
  );
}
