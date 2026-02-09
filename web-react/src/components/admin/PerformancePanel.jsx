export default function PerformancePanel({ stats }) {
  if (!stats) {
    return <div>No performance data yet</div>;
  }

  return (
    <div className="grid">

      <div className="card">
        <h4>Detection Throughput</h4>
        <p>{stats.total_scans ?? "—"} scans processed</p>
      </div>

      <div className="card">
        <h4>Avg Confidence</h4>
        <p>{(stats.avg_confidence * 100).toFixed(1)}%</p>
      </div>

      <div className="card">
        <h4>Deepfake Rate</h4>
        <p>{(stats.deepfake_rate * 100).toFixed(1)}%</p>
      </div>

      <div className="card">
        <h4>Last Updated</h4>
        <p>
          {stats.updated_at?.toDate
            ? stats.updated_at.toDate().toLocaleString()
            : "—"}
        </p>
      </div>

    </div>
  );
}
