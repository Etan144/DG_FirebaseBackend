import { useEffect, useMemo, useState } from "react";
import { collection, getDoc, getDocs, doc } from "firebase/firestore";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/admin-dashboard.css";
import { auth, functions, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import StatCard from "../components/admin/StatCard";
import UserRow from "../components/admin/UserRow";
import ReviewCard from "../components/admin/ReviewCard";
import DetectionTrendChart from "../components/admin/DetectionTrendChart";
import PerformancePanel from "../components/admin/PerformancePanel";
import DetectionScoreHistogram from "../components/admin/DetectionScoreHistogram";
import DeepfakePieChart from "../components/admin/DeepfakePieChart";

// Helper to map target string to displayName/username/email from public_users or Auth, with debug logging
function renderTarget(target, users, publicUsers, reviewsMap, publicUsersMap, usersCollectionMap) {
  if (!target) return "";
  const [type, idRaw] = target.split(":");
  const id = idRaw ? idRaw.trim() : idRaw;
  if (type === "USER" && id) {
    const pub = publicUsersMap[id];
    if (pub) {
      if (pub.displayName) return `${type}: ${pub.displayName} (${id})`;
      if (pub.username) return `${type}: ${pub.username} (${id})`;
    }
    const userDoc = usersCollectionMap[id];
    if (userDoc) {
      if (userDoc.displayName) return `${type}: ${userDoc.displayName} (${id})`;
      if (userDoc.username) return `${type}: ${userDoc.username} (${id})`;
    }
    const user = users.find(u => (u.uid && typeof u.uid === 'string' ? u.uid.trim() : u.uid) === id);
    if (user) {
      if (user.displayName) return `${type}: ${user.displayName} (${id})`;
      if (user.email) return `${type}: ${user.email} (${id})`;
    }
    // Only log if this is actually being rendered in the UI
    if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.warn(`DEBUG: USER target not mapped for UID: ${id}`);
    }
    return `${type}: ${id}`;
  }
  if (type === "REVIEW" && id) {
    const review = reviewsMap[id];
    if (review) {
      const userId = review.userId ? (typeof review.userId === 'string' ? review.userId.trim() : review.userId) : review.userId;
      const pub = publicUsersMap[userId];
      if (pub) {
        if (pub.displayName) return `${type}: ${pub.displayName} (${id})`;
        if (pub.username) return `${type}: ${pub.username} (${id})`;
      }
      const userDoc = usersCollectionMap[userId];
      if (userDoc) {
        if (userDoc.displayName) return `${type}: ${userDoc.displayName} (${id})`;
        if (userDoc.username) return `${type}: ${userDoc.username} (${id})`;
      }
      if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.warn(`DEBUG: REVIEW target mapped to userId ${userId}, but no public user found.`);
      }
      return `${type}: ${userId}`;
    }
    if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.warn(`DEBUG: REVIEW target not mapped for reviewId: ${id}`);
    }
    return `${type}: ${id}`;
  }
  return target;
}

const REVIEW_PAGE_SIZE = 9;

export default function AdminDashboard() {


  /* =========================
     STATE
  ========================= */

  const [users, setUsers] = useState([]);
  const [publicUsers, setPublicUsers] = useState([]);
  const [usersCollection, setUsersCollection] = useState([]);
    // Load public_users from Firestore
    async function loadPublicUsers() {
      const snap = await getDocs(collection(db, "public_users"));
      setPublicUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    async function loadUsersCollection() {
      const snap = await getDocs(collection(db, "users"));
      setUsersCollection(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
  const [reviews, setReviews] = useState([]);
  // For fast lookup
  const reviewsMap = useMemo(() => Object.fromEntries(reviews.map(r => [r.id, r])), [reviews]);
const publicUsersMap = useMemo(() => Object.fromEntries(publicUsers.map(u => [u.id && typeof u.id === 'string' ? u.id.trim() : u.id, u])), [publicUsers]);
const usersCollectionMap = useMemo(() => Object.fromEntries(usersCollection.map(u => [u.id && typeof u.id === 'string' ? u.id.trim() : u.id, u])), [usersCollection]);
  const [audit, setAudit] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PAGE_SIZE = 10;
  const [aggStats, setAggStats] = useState(null);
  const [dailyTrend, setDailyTrend] = useState([]);

  // New state for calls analytics
  const [callScores, setCallScores] = useState([]);
  const [deepfakeCounts, setDeepfakeCounts] = useState({ real: 0, deepfake: 0 });

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
      loadPublicUsers(),
      loadUsersCollection(),
      loadReviews(),
      loadAudit(),
      loadAggStats(),
      loadDailyTrend(),
      loadCallsAnalytics()
    ]);
  }
  // Load detection scores and deepfake counts from calls collection
  async function loadCallsAnalytics() {
    const snap = await getDocs(collection(db, "calls"));
    const scores = [];
    let real = 0, deepfake = 0;
    snap.forEach(docSnap => {
      const d = docSnap.data();
      // Find detection_score and is_deepfake fields
      // Support both flat and nested field names
      let score = d.detection_score;
      let isDeepfake = d.is_deepfake;
      // If not present, try to find by searching keys
      if (score === undefined || isDeepfake === undefined) {
        for (const k of Object.keys(d)) {
          if (k.endsWith("_detection_score")) score = d[k];
          if (k.endsWith("_is_deepfake")) isDeepfake = d[k];
        }
      }
      if (typeof score === "number") scores.push(score);
      if (typeof isDeepfake === "boolean") {
        if (isDeepfake) deepfake++;
        else real++;
      }
    });
    setCallScores(scores);
    setDeepfakeCounts({ real, deepfake });
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

  const totalAuditPages = Math.max(1, Math.ceil(filteredAudit.length / AUDIT_PAGE_SIZE));
  const pagedAudit = filteredAudit.slice(
    (auditPage - 1) * AUDIT_PAGE_SIZE,
    auditPage * AUDIT_PAGE_SIZE
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

        {/* Detection Analytics Charts */}
        <section className="section" style={{ marginTop: 32 }}>
          <div className="grid" style={{ gap: 32 }}>
            <DetectionScoreHistogram scores={callScores} />
            <DeepfakePieChart counts={deepfakeCounts} />
          </div>
          <div style={{ paddingTop: 40, textAlign: 'center' }}>
            <button className="btn" onClick={recomputeStats}>
              Recompute Detection Stats
            </button>
          </div>
        </section>
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
            {pagedAudit.map(a => (
              <tr key={a.id}>
                <td>{typeof a.timestamp === 'number' ? new Date(a.timestamp).toLocaleString() : (a.timestamp || "-")}</td>
                <td>{a.actor}</td>
                <td>{a.action}</td>
                <td>{renderTarget(a.target, users, publicUsers, reviewsMap, publicUsersMap, usersCollectionMap)}</td>
                <td>{a.details && Object.keys(a.details).length > 0 ? JSON.stringify(a.details) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="reviews-actions" style={{ marginTop: 12 }}>
          <button className="btn" disabled={auditPage === 1}
            onClick={() => setAuditPage(p => p - 1)}>
            Prev
          </button>
          <span>{auditPage} / {totalAuditPages}</span>
          <button className="btn"
            disabled={auditPage === totalAuditPages}
            onClick={() => setAuditPage(p => p + 1)}>
            Next
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
