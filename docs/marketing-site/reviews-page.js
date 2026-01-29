// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAC5WR-WL372sG418miEF9uN6Ic_jPv9OA",
  authDomain: "fyp-deepfakeguard.firebaseapp.com",
  projectId: "fyp-deepfakeguard",
  storageBucket: "fyp-deepfakeguard.appspot.com",
  messagingSenderId: "5675548760",
  appId: "1:5675548760:web:a55e537ee4cff9df4aca2d"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "us-central1");
const getReviews = httpsCallable(functions, "getReviews");

const reviewsContainer = document.getElementById("reviewsContainer");
const loadMoreBtn = document.getElementById("loadMoreBtn");

let offset = 0;
const limit = 9;
let isLoading = false;

function createReviewCard(review) {
  const card = document.createElement("div");
  card.className = "review-card";

  const starsDiv = document.createElement("div");
  starsDiv.className = "stars";
  for (let i = 0; i < review.rating; i++) {
    const star = document.createElement("span");
    star.textContent = "★";
    starsDiv.appendChild(star);
  }

  const reviewText = document.createElement("p");
  const description = review.description && review.description.trim().length > 0
    ? review.description
    : "No comment provided.";
  reviewText.textContent = `"${description}"`;

  const userInfo = document.createElement("strong");
  const dateString = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recently";
  const displayName = review.displayName || (review.anonymous ? "Customer Review" : "Customer");
  userInfo.textContent = `- ${displayName} • ${dateString}`;

  card.appendChild(starsDiv);
  card.appendChild(reviewText);
  card.appendChild(userInfo);

  return card;
}

async function loadReviews() {
  if (isLoading) {
    return;
  }

  isLoading = true;
  loadMoreBtn.disabled = true;

  try {
    const result = await getReviews({ limit, offset });
    const data = result.data;

    if (offset === 0) {
      reviewsContainer.innerHTML = "";
    }

    if (data?.success && Array.isArray(data.reviews)) {
      data.reviews.forEach((review) => {
        const card = createReviewCard(review);
        reviewsContainer.appendChild(card);
      });

      offset = typeof data.nextOffset === "number" ? data.nextOffset : (offset + data.reviews.length);

      if (data.hasMore === false) {
        loadMoreBtn.style.display = "none";
      } else {
        loadMoreBtn.style.display = "inline-flex";
      }
    } else if (offset === 0) {
      reviewsContainer.innerHTML = "<div class=\"review-card\"><p>No reviews yet.</p></div>";
      loadMoreBtn.style.display = "none";
    }
  } catch (error) {
    console.error("Error loading reviews:", error);
    if (offset === 0) {
      reviewsContainer.innerHTML = "<div class=\"review-card\"><p>Unable to load reviews at this moment.</p></div>";
    }
  } finally {
    isLoading = false;
    loadMoreBtn.disabled = false;
  }
}

loadMoreBtn.addEventListener("click", loadReviews);

document.addEventListener("DOMContentLoaded", () => {
  loadReviews();
});
