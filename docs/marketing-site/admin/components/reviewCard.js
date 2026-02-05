export function ReviewCard({
  id,
  rating = 0,
  description = ""
}) {

  const starsOn = "★".repeat(rating);
  const starsOff = "★".repeat(5-rating);

  return `
    <div class="review-card">
      <div class="review-stars">${starsOn}<span style="opacity:.3">${starsOff}</span></div>
      <div class="review-text">${escapeHtml(description)}</div>

      <button class="btn danger sm"
              data-action="delete-review"
              data-id="${id}">
        Delete
      </button>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}
