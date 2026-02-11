import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#FF8042"];

export default function DeepfakePieChart({ counts }) {
  const data = [
    { name: "Real", value: counts.real },
    { name: "Deepfake", value: counts.deepfake },
  ];
  return (
    <div style={{ width: "100%", height: 300 }}>
      <h4>Real vs. Deepfake Calls</h4>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
