import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function shuffleArraySeeded(array) {
  const now = new Date();
  const seed =
    now.getFullYear() * 100000000 +
    (now.getMonth() + 1) * 1000000 +
    now.getDate() * 10000 +
    now.getHours() * 100 +
    now.getMinutes();

  let rng = seed;
  const rand = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };

  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function ReviewSlider() {
  const [reviews, setReviews] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "https://us-central1-fyp-deepfakeguard.cloudfunctions.net/getFiveStarReviews?limit=20"
        );

        const data = await res.json();

        if (data.success && data.reviews?.length) {
          const shuffled = shuffleArraySeeded(data.reviews);
          const displayed = shuffled.slice(0, 3);
          setReviews(displayed);
        }

      } catch (e) {
        console.error("Review load failed", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!reviews.length) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(id);
  }, [reviews]);

  if (loading) {
    return <div className="review-card loading">Loading reviews...</div>;
  }

  if (!reviews.length) {
    return (
      <div className="review-card">
        No reviews yet. Be the first to share your experience!
      </div>
    );
  }

  const r = reviews[index];

  const dateString = r.createdAt
    ? new Date(r.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "Recently";

  const displayName =
    r.displayName || (r.anonymous ? "Customer Review" : "Customer");

  const description =
    r.description?.trim()?.length
      ? r.description
      : "No comment provided.";

  return (
    <section className="section review-slider">

      <h2>What Our Customers Say</h2>

      <div className="review-card">
        <div className="stars">
          {"★".repeat(r.rating)}
        </div>

        <p>"{description}"</p>

        <strong>
          — {displayName} • {dateString}
        </strong>
      </div>

      <div className="slider-nav">
        <button onClick={() =>
          setIndex(i => (i - 1 + reviews.length) % reviews.length)
        }>
          ←
        </button>

        <button onClick={() =>
          setIndex(i => (i + 1) % reviews.length)
        }>
          →
        </button>
      </div>

      
      <div className="reviews-cta">
        <Link to="/reviews" className="btn secondary">
          Show more
        </Link>
      </div>

    </section>
  );
}
