import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

export default function DetectionTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <div>No trend data yet</div>;
  }

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="avgConfidence"
            name="Avg Confidence %"
            stroke="#1bd4f2"
            strokeWidth={2}
          />

          <Line
            type="monotone"
            dataKey="deepfakeRate"
            name="Deepfake Rate %"
            stroke="#ff5c7a"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
