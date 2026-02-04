export function ReviewCard({ id, rating = 0, displayName, anonymous, description, createdAt }) {
  const starsOn = "★".repeat(Math.max(0, Math.min(5, rating)));
  const starsOff = "★".repeat(Math.max(0, 5 - Math.max(0, Math.min(5, rating))));
  const user = displayName || (anonymous ? "Customer Review" : "Customer");
  const dateString = createdAt ? new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

  return `
    <div class="review-card">
      <div class="review-header">
        <div class="review-stars">${starsOn}<span style="color:#222">${starsOff}</span></div>
        <div class="review-user">${user}</div>
        <div class="review-date">${dateString}</div>
      </div>
      <div class="review-text">${description ? escapeHtml(description) : ""}</div>
      <div class="review-actions">
        <button class="btn danger sm" data-action="delete-review" data-id="${id}">Delete</button>
      </div>
    </div>
  `;
}

/** Minimal HTML escaping to avoid accidental markup injection in reviews. */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
