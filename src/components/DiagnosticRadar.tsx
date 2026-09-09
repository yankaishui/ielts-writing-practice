import { zh } from "../utils/labels";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { dimensions, type DiagnosticScores } from "../types";
export function DiagnosticRadar({ scores }: { scores: DiagnosticScores }) {
  return (
    <div className="card">
      <h2> 写作能力画像 </h2>
      <div className="radar">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            outerRadius="65%"
            data={Object.entries(dimensions).map(([key, label]) => ({
              label: zh(label),
              value: scores[key as keyof DiagnosticScores],
            }))}
          >
            <PolarGrid stroke="#dfe4ef" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#66718a" }}
            />
            <PolarRadiusAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fontSize: 10 }}
            />
            <Radar
              isAnimationActive={false}
              dataKey="value"
              name="能力分数"
              stroke="#516ad8"
              fill="#516ad8"
              fillOpacity={0.16}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <small>训练能力画像，并非雅思官方评分维度。 </small>
    </div>
  );
}
