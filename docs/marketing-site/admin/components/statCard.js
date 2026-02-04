export function StatCard({ id, label, value = "—", desc = "" }) {
  return `
    <div class="stat-card">
      <div class="stat-label">${label}</div>
      <div class="stat-value" id="${id}">${value}</div>
      <div class="stat-desc">${desc}</div>
    </div>
  `;
}
