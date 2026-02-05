import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import { getUserIcon } from "./usericon.js";
import { StatCard } from "./admin/components/statCard.js";
import { UserRow } from "./admin/components/userRow.js";
import { ReviewCard } from "./admin/components/reviewCard.js";

/* =========================
   FIREBASE INIT
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyAC5WR-WL372sG418miEF9uN6Ic_jPv9OA",
  authDomain: "fyp-deepfakeguard.firebaseapp.com",
  projectId: "fyp-deepfakeguard"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ✅ IMPORTANT — match your deployed region */
const functions = getFunctions(app, "us-central1");

const db = getFirestore(app);

/* =========================
   DOM
========================= */
const userIconContainer = document.getElementById("user-icon-container");

const usersTbody = document.getElementById("users-tbody");
const reviewsWrap = document.getElementById("reviews-list");

const statsOverview = document.getElementById("stats-overview");
const statsUsers = document.getElementById("stats-users");
const statsReviews = document.getElementById("stats-reviews");

const userSearchInput = document.getElementById("userSearch");
const reviewSearchInput = document.getElementById("reviewSearch");
const reviewRatingFilter = document.getElementById("reviewRatingFilter");

const auditTbody = document.getElementById("audit-tbody");
const auditSearchInput = document.getElementById("auditSearch");

/* =========================
   STATE
========================= */
let cachedUsers = [];
let cachedReviews = [];
let cachedAudit = [];

/* =========================
   HEADER
========================= */
function renderUserDropdown(user) {
  if (!userIconContainer) return;

  userIconContainer.innerHTML = `
    <div class="user-dropdown" id="userDropdown">
      <span style="font-size:13px;color:var(--muted);">${user.email || "User"}</span>
      <span id="userIconClickable" style="cursor:pointer;">${getUserIcon(36)}</span>
      <div class="user-dropdown-content">
        <button id="logoutBtn">Logout</button>
      </div>
    </div>
  `;

  const dropdown = document.getElementById("userDropdown");
  const icon = document.getElementById("userIconClickable");

  icon?.addEventListener("click", e => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove("show");
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "LoginPage.html";
  });
}

/* =========================
   HELPERS
========================= */
function normalizeCreatedAt(v) {
  if (!v) return 0;
  if (typeof v === "object" && typeof v.seconds === "number") return v.seconds * 1000;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function safeJson(o) {
  try { return JSON.stringify(o ?? {}); }
  catch { return "{}"; }
}

/* =========================
   RENDER — USERS
========================= */
function renderUsers(users) {
  if (!usersTbody) return;
  usersTbody.innerHTML = users.map(UserRow).join("");
  bindUserButtons();
}

function bindUserButtons() {
  usersTbody?.querySelectorAll("[data-action]").forEach(btn => {
    btn.onclick = async () => {
      const uid = btn.dataset.uid;
      const disabled = btn.dataset.disabled === "true";

      try {
        const fn = httpsCallable(functions, "setUserDisabled");
        await fn({ uid, disabled });

        await loadUsers();
        await loadAuditLogs();

      } catch (e) {
        alert("User update failed");
        console.error(e);
      }
    };
  });
}

/* =========================
   RENDER — REVIEWS
========================= */
function renderReviews(reviews) {
  if (!reviewsWrap) return;

  reviewsWrap.innerHTML = reviews.length
    ? reviews.map(ReviewCard).join("")
    : `<div style="color:var(--muted);">No matching reviews.</div>`;

  bindReviewButtons();
}

function bindReviewButtons() {
  reviewsWrap?.querySelectorAll("[data-action='delete-review']").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Delete this review?")) return;

      try {
        const fn = httpsCallable(functions, "deleteReview");
        await fn({ reviewId: btn.dataset.id });

        await loadReviews();
        await loadAuditLogs();

      } catch (e) {
        alert("Delete failed");
        console.error(e);
      }
    };
  });
}

/* =========================
   RENDER — AUDIT
========================= */
function renderAudit(logs) {
  if (!auditTbody) return;

  auditTbody.innerHTML = logs.map(l => {
    const ms = normalizeCreatedAt(l.createdAt);
    return `
      <tr>
        <td>${ms ? new Date(ms).toLocaleString() : ""}</td>
        <td>${l.actorEmail || l.actorUid || ""}</td>
        <td>${l.action || ""}</td>
        <td>${l.targetType || ""}:${l.targetId || ""}</td>
        <td>${safeJson(l.metadata)}</td>
      </tr>
    `;
  }).join("");
}

/* =========================
   STATS
========================= */
function renderUserStats() {
  if (!statsUsers) return;

  const total = cachedUsers.length;
  const active = cachedUsers.filter(u => !u.disabled).length;

  statsUsers.innerHTML = `
    ${StatCard({ label: "Total Users", value: total })}
    ${StatCard({ label: "Active Users", value: active })}
    ${StatCard({ label: "Disabled Users", value: total - active })}
  `;
}

function renderReviewStats() {
  if (!statsReviews) return;

  const total = cachedReviews.length;
  const avg = total
    ? (cachedReviews.reduce((s,r)=>s+r.rating,0)/total).toFixed(2)
    : "—";

  statsReviews.innerHTML = `
    ${StatCard({ label: "Total Reviews", value: total })}
    ${StatCard({ label: "Average Rating", value: avg })}
  `;
}

function renderOverviewStats() {
  if (!statsOverview) return;

  statsOverview.innerHTML = `
    ${StatCard({ label: "Users", value: cachedUsers.length })}
    ${StatCard({ label: "Reviews", value: cachedReviews.length })}
    ${StatCard({ label: "Audit Logs", value: cachedAudit.length })}
  `;
}

/* =========================
   LOAD — USERS
========================= */
async function loadUsers() {
  const res = await httpsCallable(functions, "listUsers")();
  cachedUsers = Array.isArray(res.data) ? res.data : [];
  renderUsers(cachedUsers);
  renderUserStats();
  renderOverviewStats();
}

/* =========================
   LOAD — REVIEWS
========================= */
async function loadReviews() {
  const snap = await getDocs(collection(db, "reviews"));
  cachedReviews = snap.docs.map(d => ({
    id: d.id,
    rating: d.data().rating || 0,
    description: d.data().description || "",
    createdAt: normalizeCreatedAt(d.data().createdAt)
  })).sort((a,b)=>b.createdAt-a.createdAt);

  applyReviewFilters();
  renderReviewStats();
  renderOverviewStats();
}

/* =========================
   LOAD — AUDIT
========================= */
async function loadAuditLogs() {
  if (!auditTbody) return;

  const snap = await getDocs(collection(db, "audit_logs"));
  cachedAudit = snap.docs.map(d => ({ id:d.id, ...d.data() }))
    .sort((a,b)=>normalizeCreatedAt(b.createdAt)-normalizeCreatedAt(a.createdAt));

  renderAudit(cachedAudit.slice(0,100));
  renderOverviewStats();
}

/* =========================
   FILTERS
========================= */
userSearchInput?.addEventListener("input", () => {
  const q = userSearchInput.value.toLowerCase();
  renderUsers(cachedUsers.filter(u => (u.email||"").toLowerCase().includes(q)));
});

function applyReviewFilters() {
  const min = Number(reviewRatingFilter?.value || 0);
  const q = (reviewSearchInput?.value || "").toLowerCase();

  renderReviews(
    cachedReviews.filter(r =>
      r.rating >= min &&
      (!q || r.description.toLowerCase().includes(q))
    )
  );
}

reviewRatingFilter?.addEventListener("change", applyReviewFilters);
reviewSearchInput?.addEventListener("input", applyReviewFilters);

auditSearchInput?.addEventListener("input", () => {
  const q = auditSearchInput.value.toLowerCase();
  renderAudit(
    cachedAudit.filter(l =>
      (l.action||"").toLowerCase().includes(q) ||
      (l.actorEmail||"").toLowerCase().includes(q) ||
      (l.targetId||"").toLowerCase().includes(q)
    )
  );
});

/* =========================
   AUTH BOOTSTRAP
========================= */
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "LoginPage.html";
    return;
  }

  renderUserDropdown(user);

  try {
    /* ✅ parallel load = faster dashboard */
    await Promise.all([
      loadUsers(),
      loadReviews(),
      loadAuditLogs()
    ]);
  } catch (e) {
    console.error("Dashboard load failed:", e);
    alert("Failed to load admin dashboard");
  }
});
