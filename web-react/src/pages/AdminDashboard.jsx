import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/admin-dashboard.css";

import { auth, functions, db } from "../firebase";

import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

import StatCard from "../components/admin/StatCard";
import UserRow from "../components/admin/UserRow";
import ReviewCard from "../components/admin/ReviewCard";
import DetectionTrendChart from "../components/admin/DetectionTrendChart";
import PerformancePanel from "../components/admin/PerformancePanel";

const REVIEW_PAGE_SIZE = 9;

export default function AdminDashboard() {


  /* =========================
     STATE
  ========================= */

  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [audit, setAudit] = useState([]);
  const [aggStats, setAggStats] = useState(null);
  const [dailyTrend, setDailyTrend] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewMinRating, setReviewMinRating] = useState(0);
  const [auditSearch, setAuditSearch] = useState("");

  const [reviewPage, setReviewPage] = useState(1);

  /* =========================
     LOADERS
  ========================= */

  async function loadAll() {
    await Promise.all([
      loadUsers(),
      loadReviews(),
      loadAudit(),
      loadAggStats(),
      loadDailyTrend()
    ]);
  }

  async function loadUsers() {
    const fn = httpsCallable(functions, "listUsers");
    const res = await fn();
    setUsers(Array.isArray(res.data) ? res.data : []);
  }

  async function loadReviews() {
    const snap = await getDocs(collection(db, "reviews"));
    setReviews(snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })));
  }

  // ✅ UPDATED — now uses Cloud Function instead of direct Firestore
  async function loadAudit() {
    const fn = httpsCallable(functions, "getAuditLogs");
    const res = await fn({ limit: 200 });
    setAudit(Array.isArray(res.data) ? res.data : []);
  }

  async function loadAggStats() {
    const snap = await getDoc(doc(db, "aggregate_stats", "global"));
    setAggStats(snap.exists() ? snap.data() : null);
  }

  async function loadDailyTrend() {
    const snap = await getDocs(collection(db, "aggregate_stats_daily"));

    const rows = snap.docs.map(d => {
      const x = d.data();
      return {
        date: d.id,
        avgConfidence: Number((x.avg_confidence * 100).toFixed(1)),
        deepfakeRate: Number((x.deepfake_rate * 100).toFixed(1))
      };
    });

    rows.sort((a, b) => a.date.localeCompare(b.date));
    setDailyTrend(rows);
  }

  /* =========================
     AUTH GUARD
  ========================= */

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      if (!u) {
        window.location.href = "/login";
        return;
      }

      const token = await u.getIdTokenResult();
      if (!token.claims.admin) {
        alert("Admin only");
        window.location.href = "/";
        return;
      }

      loadAll();
    });
  }, []);

  /* =========================
     SAFE AUTO REFRESH
  ========================= */

  useEffect(() => {
    const t = setInterval(() => {
      loadAggStats();
      loadDailyTrend();
    }, 60000);

    return () => clearInterval(t);
  }, []);

  /* =========================
     ACTIONS
  ========================= */

  async function setUserDisabled(uid, disabled) {
    const fn = httpsCallable(functions, "setUserDisabled");
    await fn({ uid, disabled });
    await loadUsers();
    await loadAudit();
  }

  async function deleteReview(id) {
    if (!confirm("Delete review?")) return;
    const fn = httpsCallable(functions, "adminDeleteReview");
    await fn({ reviewId: id });
    await loadReviews();
    await loadAudit();
  }

  async function recomputeStats() {
    const fn = httpsCallable(functions, "recomputeStatsNow");
    await fn();
    await loadAggStats();
    await loadDailyTrend();
    alert("Detection stats recomputed");
  }

  /* =========================
     FILTERS
  ========================= */

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
    ),
    [users, userSearch]
  );

  const filteredReviews = useMemo(() =>
    reviews.filter(r =>
      r.rating >= reviewMinRating &&
      (!reviewSearch ||
        (r.description || "").toLowerCase().includes(reviewSearch.toLowerCase()))
    ),
    [reviews, reviewSearch, reviewMinRating]
  );

  const filteredAudit = useMemo(() =>
    audit.filter(a =>
      (a.action || "").toLowerCase().includes(auditSearch.toLowerCase()) ||
      (a.actorEmail || "").toLowerCase().includes(auditSearch.toLowerCase()) ||
      (a.targetId || "").toLowerCase().includes(auditSearch.toLowerCase())
    ),
    [audit, auditSearch]
  );

  /* =========================
     PAGINATION
  ========================= */

  const totalReviewPages = Math.max(
    1,
    Math.ceil(filteredReviews.length / REVIEW_PAGE_SIZE)
  );

  const pagedReviews = filteredReviews.slice(
    (reviewPage - 1) * REVIEW_PAGE_SIZE,
    reviewPage * REVIEW_PAGE_SIZE
  );



  /* =========================
     STATS
  ========================= */

  const activeUsers = users.filter(u => !u.disabled).length;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
    : "—";

  const avgConfidence = aggStats
    ? (aggStats.avg_confidence * 100).toFixed(1) + "%"
    : "—";

  const deepfakeRate = aggStats
    ? (aggStats.deepfake_rate * 100).toFixed(1) + "%"
    : "—";

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="page">
      <Header />

      {/* ===== TOP DASHBOARD ===== */}
      <section className="section">
        <h2>Admin Dashboard</h2>

        <div className="grid">
          <StatCard label="Users" value={users.length} />
          <StatCard label="Reviews" value={reviews.length} />
          <StatCard label="Audit Logs" value={audit.length} />
        </div>

        <h3>User Accounts</h3>
        <div className="grid">
          <StatCard label="Total" value={users.length} />
          <StatCard label="Active" value={activeUsers} />
          <StatCard label="Disabled" value={users.length - activeUsers} />
        </div>

        <h3>User Reviews</h3>
        <div className="grid">
          <StatCard label="Total" value={reviews.length} />
          <StatCard label="Average" value={avgRating} />
        </div>

        <h3>Detection Analytics</h3>
        <div className="grid">
          <StatCard label="Avg Confidence" value={avgConfidence} />
          <StatCard label="Deepfake Rate" value={deepfakeRate} />
          <StatCard label="Total Scans" value={aggStats?.total_scans ?? "—"} />
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={recomputeStats}>
            Recompute Detection Stats
          </button>
        </div>
      </section>

      {/* ===== PERFORMANCE PANEL ===== */}
      <section className="section">
        <h3>Performance Metrics</h3>
        <PerformancePanel stats={aggStats} />
      </section>

      {/* ===== TREND CHART ===== */}
      <section className="section">
        <h3>Detection Trend Graph</h3>
        <DetectionTrendChart data={dailyTrend} />
      </section>

      {/* ===== USERS ===== */}
      <section className="section">
        <h3>User Management</h3>

        <div className="toolbar">
          <div className="search-box">
            <input
              placeholder="🔍 Search email"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <UserRow key={u.uid} user={u} onToggle={setUserDisabled} />
            ))}
          </tbody>
        </table>
      </section>

      {/* ===== REVIEWS ===== */}
      <section className="section">
        <h3>Reviews</h3>

        <div className="toolbar">
          <input
            className="filter-select"
            placeholder="🔍 Search text"
            value={reviewSearch}
            onChange={e => {
              setReviewSearch(e.target.value);
              setReviewPage(1);
            }}
          />

          <select
            className="filter-select"
            value={reviewMinRating}
            onChange={e => {
              setReviewMinRating(Number(e.target.value));
              setReviewPage(1);
            }}
          >
            <option value={0}>All Ratings</option>
            <option value={5}>⭐⭐⭐⭐⭐</option>
            <option value={4}>⭐⭐⭐⭐ & up</option>
            <option value={3}>⭐⭐⭐ & up</option>
          </select>
        </div>

        <div className="reviews-grid">
          {pagedReviews.map(r => (
            <ReviewCard key={r.id} review={r} onDelete={deleteReview} />
          ))}
        </div>

        <div className="reviews-actions">
          <button className="btn" disabled={reviewPage === 1}
            onClick={() => setReviewPage(p => p - 1)}>
            Prev
          </button>

          <span>{reviewPage} / {totalReviewPages}</span>

          <button className="btn"
            disabled={reviewPage === totalReviewPages}
            onClick={() => setReviewPage(p => p + 1)}>
            Next
          </button>
        </div>
      </section>

      {/* ===== AUDIT ===== */}
      <section className="section">
        <h3>Audit Log</h3>

        <div className="toolbar">
          <input
            className="filter-select"
            placeholder="🔍 Search audit"
            value={auditSearch}
            onChange={e => setAuditSearch(e.target.value)}
          />
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>

          <tbody>
            {filteredAudit.map(a => (
              <tr key={a.id}>
                <td>
                  {a.createdAt?.seconds
                    ? new Date(a.createdAt.seconds * 1000).toLocaleString()
                    : ""}
                </td>
                <td>{a.actorEmail || a.actorUid}</td>
                <td>{a.action}</td>
                <td>{a.targetType}:{a.targetId}</td>
                <td>{a.metadata ? JSON.stringify(a.metadata) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Footer />
    </div>
  );
}
