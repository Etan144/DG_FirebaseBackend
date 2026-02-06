import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Reviews() {
  const LIMIT = 9;

  const [reviews, setReviews] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const getReviews = httpsCallable(functions, "getReviews");

  /* =========================
     INITIAL LOAD (React-safe)
     ========================= */
  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setLoading(true);
      setError(null);

      try {
        const result = await getReviews({
          limit: LIMIT,
          offset: 0
        });

        const data = result.data;

        if (!cancelled && data?.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);

          const nextOffset =
            typeof data.nextOffset === "number"
              ? data.nextOffset
              : data.reviews.length;

          setOffset(nextOffset);
          setHasMore(data.hasMore !== false);
        }

      } catch (err) {
        console.error("Initial review load failed:", err);
        if (!cancelled) setError("Unable to load reviews.");
      }

      if (!cancelled) setLoading(false);
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* =========================
     LOAD MORE BUTTON HANDLER
     ========================= */
  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getReviews({
        limit: LIMIT,
        offset
      });

      const data = result.data;

      if (data?.success && Array.isArray(data.reviews)) {
        setReviews(prev => [...prev, ...data.reviews]);

        const nextOffset =
          typeof data.nextOffset === "number"
            ? data.nextOffset
            : offset + data.reviews.length;

        setOffset(nextOffset);
        setHasMore(data.hasMore !== false);
      }

    } catch (err) {
      console.error("Load more failed:", err);
      setError("Unable to load more reviews.");
    }

    setLoading(false);
  }

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="page">

      <Header />

      <section className="section">
        <h2>Customer Reviews</h2>
        <p className="lead">
          See what customers are saying about Deepfake Guard.
        </p>

        <div className="reviews-grid">

          {/* Loading first page */}
          {reviews.length === 0 && loading && (
            <div className="review-card loading">
              Loading reviews...
            </div>
          )}

          {/* Error */}
          {error && reviews.length === 0 && (
            <div className="review-card">
              {error}
            </div>
          )}

          {/* Reviews */}
          {reviews.map(r => {
            const description =
              r.description?.trim()?.length
                ? r.description
                : "No comment provided.";

            const displayName =
              r.displayName ||
              (r.anonymous ? "Customer Review" : "Customer");

            const dateString = r.createdAt
              ? new Date(r.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })
              : "Recently";

            return (
              <div className="review-card" key={r.id}>
                <div className="stars">
                  {"★".repeat(r.rating)}
                </div>

                <p>"{description}"</p>

                <strong>
                  — {displayName} • {dateString}
                </strong>
              </div>
            );
          })}

        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="reviews-actions">
            <button
              className="btn secondary"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}

      </section>

      <Footer />

    </div>
  );
}
