export function AdminSection({ title, icon = "⚙️", actionsHtml = "", bodyHtml = "" }) {
  return `
    <section class="admin-section">
      <div class="section-header">
        <div class="section-title">
          <div class="section-icon">${icon}</div>
          <h2>${title}</h2>
        </div>
        <div class="section-actions">
          ${actionsHtml}
        </div>
      </div>
      <div class="section-body">
        ${bodyHtml}
      </div>
    </section>
  `;
}
