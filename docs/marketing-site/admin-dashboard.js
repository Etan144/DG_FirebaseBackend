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
   DOM ELEMENTS
========================= */
const userIconContainer = document.getElementById("user-icon-container");
const statsWrap = document.getElementById("stats-dashboard");
const usersTbody = document.getElementById("users-tbody");
const reviewsWrap = document.getElementById("reviews-list");

const userSearchInput = document.getElementById("userSearch");
const reviewSearchInput = document.getElementById("reviewSearch");
const reviewRatingFilter = document.getElementById("reviewRatingFilter");

/* =========================
   STATE
========================= */
let cachedUsers = [];
let cachedReviews = [];

/* =========================
   HEADER DROPDOWN
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
   STATS
========================= */
function renderStatsSkeleton() {
  statsWrap.innerHTML = `
    ${StatCard({ id: "stat-users", label: "Total Users", value: "—" })}
    ${StatCard({ id: "stat-active-users", label: "Active Users", value: "—" })}
    ${StatCard({ id: "stat-reviews", label: "Reviews", value: "—" })}
  `;
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
   USERS
========================= */
async function loadUsers() {
  const listUsers = httpsCallable(functions, "listUsers");
  const res = await listUsers();
  cachedUsers = Array.isArray(res.data) ? res.data : [];

  document.getElementById("stat-users").textContent = cachedUsers.length;
  document.getElementById("stat-active-users").textContent =
    cachedUsers.filter(u => !u.disabled).length;

  renderUsers(cachedUsers);
}

userSearchInput.addEventListener("input", () => {
  const q = userSearchInput.value.toLowerCase();
  renderUsers(
    cachedUsers.filter(u => (u.email || "").toLowerCase().includes(q)));
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

  document.getElementById("stat-reviews").textContent = cachedReviews.length;
  applyReviewFilters();
}

function applyReviewFilters() {
  const minRating = Number(reviewRatingFilter.value || 0);
  const keyword = reviewSearchInput.value.toLowerCase();

  const filtered = cachedReviews.filter(r =>
    r.rating >= minRating &&
    (!keyword || r.description.toLowerCase().includes(keyword))
  );

  renderReviews(filtered);
}

reviewRatingFilter.addEventListener("change", applyReviewFilters);
reviewSearchInput.addEventListener("input", applyReviewFilters);

/* =========================
   AUTH
========================= */
renderStatsSkeleton();

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "LoginPage.html";
    return;
  }

  renderUserDropdown(user);
  await loadUsers();
  await loadReviews();
});
