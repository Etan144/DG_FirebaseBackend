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
const functions = getFunctions(app);
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

/* =========================
   STATE
========================= */
let cachedUsers = [];
let cachedReviews = [];

/* =========================
   HEADER
========================= */
function renderUserDropdown(user) {
  userIconContainer.innerHTML = `
    <div class="user-dropdown" id="userDropdown">
      <span style="font-size:13px;color:var(--muted);">${user.email}</span>
      <span id="userIconClickable">${getUserIcon(36)}</span>
      <div class="user-dropdown-content">
        <button id="logoutBtn">Logout</button>
      </div>
    </div>
  `;

  document.getElementById("userIconClickable").onclick = e => {
    e.stopPropagation();
    document.getElementById("userDropdown").classList.toggle("show");
  };

  document.addEventListener("click", () =>
    document.getElementById("userDropdown").classList.remove("show")
  );

  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    window.location.href = "LoginPage.html";
  };
}

/* =========================
   HELPERS
========================= */
function normalizeCreatedAt(createdAt) {
  if (!createdAt) return null;
  if (typeof createdAt === "object" && typeof createdAt.seconds === "number") {
    return createdAt.seconds * 1000;
  }
  if (typeof createdAt === "number") {
    return createdAt < 1e12 ? createdAt * 1000 : createdAt;
  }
  const d = new Date(createdAt);
  return isNaN(d.getTime()) ? null : d.getTime();
}

function renderUsers(users) {
  usersTbody.innerHTML = users.map(UserRow).join("");
}

function renderReviews(reviews) {
  reviewsWrap.innerHTML = reviews.length
    ? reviews.map(ReviewCard).join("")
    : `<div style="color:var(--muted);">No matching reviews.</div>`;
}

/* =========================
   STATS
========================= */
function renderUserStats() {
  const total = cachedUsers.length;
  const active = cachedUsers.filter(u => !u.disabled).length;
  const disabled = total - active;

  const now = Date.now();
  const last7Days = cachedUsers.filter(u =>
    u.creationTime && new Date(u.creationTime).getTime() > now - 7 * 86400000
  ).length;

  statsUsers.innerHTML = `
    ${StatCard({ label: "Total Users", value: total })}
    ${StatCard({ label: "Active Users", value: active })}
    ${StatCard({ label: "Disabled Users", value: disabled })}
    ${StatCard({ label: "New (7 days)", value: last7Days })}
  `;
}

function renderReviewStats() {
  const total = cachedReviews.length;
  const avg =
    total > 0
      ? (cachedReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(2)
      : "—";

  const low = cachedReviews.filter(r => r.rating <= 2).length;
  const positive = cachedReviews.filter(r => r.rating >= 4).length;

  statsReviews.innerHTML = `
    ${StatCard({ label: "Total Reviews", value: total })}
    ${StatCard({ label: "Average Rating", value: avg })}
    ${StatCard({ label: "Low Ratings (≤2⭐)", value: low })}
    ${StatCard({ label: "Positive Reviews", value: positive })}
  `;
}

function renderOverviewStats() {
  statsOverview.innerHTML = `
    ${StatCard({ label: "Users", value: cachedUsers.length })}
    ${StatCard({ label: "Reviews", value: cachedReviews.length })}
  `;
}

/* =========================
   USERS
========================= */
async function loadUsers() {
  const listUsers = httpsCallable(functions, "listUsers");
  const res = await listUsers();
  cachedUsers = Array.isArray(res.data) ? res.data : [];
  renderUsers(cachedUsers);
  renderUserStats();
  renderOverviewStats();
}

userSearchInput.addEventListener("input", () => {
  const q = userSearchInput.value.toLowerCase();
  renderUsers(cachedUsers.filter(u => (u.email || "").toLowerCase().includes(q)));
});

/* =========================
   REVIEWS
========================= */
async function loadReviews() {
  const snapshot = await getDocs(collection(db, "reviews"));
  cachedReviews = [];

  snapshot.forEach(doc => {
    const r = doc.data();
    cachedReviews.push({
      id: doc.id,
      rating: r.rating || 0,
      description: r.description || "",
      displayName: r.displayName,
      anonymous: r.anonymous,
      createdAt: normalizeCreatedAt(r.createdAt)
    });
  });

  renderReviewStats();
  renderOverviewStats();
  applyReviewFilters();
}

function applyReviewFilters() {
  const minRating = Number(reviewRatingFilter.value || 0);
  const keyword = reviewSearchInput.value.toLowerCase();

  renderReviews(
    cachedReviews.filter(r =>
      r.rating >= minRating &&
      (!keyword || r.description.toLowerCase().includes(keyword))
    )
  );
}

reviewRatingFilter.addEventListener("change", applyReviewFilters);
reviewSearchInput.addEventListener("input", applyReviewFilters);

/* =========================
   AUTH
========================= */
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "LoginPage.html";
    return;
  }

  renderUserDropdown(user);
  await loadUsers();
  await loadReviews();
});
