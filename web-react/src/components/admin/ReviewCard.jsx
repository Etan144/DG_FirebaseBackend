export default function ReviewCard({ review, onDelete }) {
  const rating = review.rating ?? 0;

  return (
    <div className="review-card">

      <div className="review-stars">
        {"★".repeat(rating)}
        <span style={{ opacity: 0.3 }}>
          {"★".repeat(5 - rating)}
        </span>
      </div>

      <div className="review-text">
        {review.description || ""}
      </div>

      <button
        className="btn danger sm"
        onClick={() => onDelete(review.id)}
      >
        Delete
      </button>

    </div>
  );
}
