import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function getHistogramData(scores, bins = 10) {
  if (!scores.length) return [];
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const binSize = (max - min) / bins;
  const data = Array.from({ length: bins }, (_, i) => ({
    bin: `${(min + i * binSize).toFixed(2)}-${(min + (i + 1) * binSize).toFixed(2)}`,
    count: 0,
  }));
  scores.forEach(score => {
    let idx = Math.floor((score - min) / binSize);
    if (idx === bins) idx = bins - 1;
    data[idx].count++;
  });
  return data;
}

export default function DetectionScoreHistogram({ scores }) {
  const data = getHistogramData(scores);
  return (
    <div style={{ width: "100%", height: 300 }}>
      <h4>Detection Score Distribution</h4>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="bin" angle={-30} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
