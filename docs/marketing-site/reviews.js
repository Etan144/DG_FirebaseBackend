// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";
import { getFirestore, collection, getDocs, query, where, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

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
const functions = getFunctions(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Expose to window for console access
window.auth = auth;
window.db = db;

/**
 * Shuffle array using seeded random based on date (same shuffle daily)
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArrayDaily(array) {
  // Create a seeded random using today's date
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Simple seeded pseudo-random generator
  let rng = seed;
  const random = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };
  
  // Fisher-Yates shuffle with seeded random
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Fetch 5-star reviews from Firebase and display them
 */
async function loadFiveStarReviews() {
  const reviewSlider = document.getElementById('reviewSlider');
  const loadingCard = document.querySelector('.review-card.loading');

  try {
    // Call the CORS-enabled Cloud Function via HTTP
    const response = await fetch(
      'https://us-central1-fyp-deepfakeguard.cloudfunctions.net/getFiveStarReviews?limit=20'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }

    const result = await response.json();

    if (result.success && result.reviews.length > 0) {
      // Clear loading card
      if (loadingCard) {
        loadingCard.remove();
      }

      // Shuffle reviews daily and take first 3
      const shuffledReviews = shuffleArrayDaily(result.reviews);
      const displayedReviews = shuffledReviews.slice(0, 3);

      // Add each review to the slider
      displayedReviews.forEach((review) => {
        const reviewCard = createReviewCard(review);
        reviewSlider.appendChild(reviewCard);
      });

      // Trigger slider update
      if (window.onReviewsLoaded) {
        window.onReviewsLoaded();
      }
    } else {
      // Show message if no 5-star reviews
      if (loadingCard) {
        loadingCard.innerHTML = '<p>No 5-star reviews yet. Be the first to share your experience!</p>';
      }
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
    if (loadingCard) {
      loadingCard.innerHTML = '<p>Unable to load reviews at this moment.</p>';
    }
  }
}

/**
 * Create a review card element
 */
function createReviewCard(review) {
  const card = document.createElement('div');
  card.className = 'review-card';

  // Create stars
  const starsDiv = document.createElement('div');
  starsDiv.className = 'stars';
  for (let i = 0; i < review.rating; i++) {
    const star = document.createElement('span');
    star.textContent = '★';
    starsDiv.appendChild(star);
  }

  // Create review text
  const reviewText = document.createElement('p');
  reviewText.textContent = `"${review.description}"`;

  // Create user info (show "Customer Review" or username based on anonymous flag)
  const userInfo = document.createElement('strong');
  const dateString = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';
  
  const displayName = review.displayName || (review.anonymous ? 'Customer Review' : 'Customer');
  userInfo.textContent = `- ${displayName} • ${dateString}`;

  // Append to card
  card.appendChild(starsDiv);
  card.appendChild(reviewText);
  card.appendChild(userInfo);

  return card;
}

// Load reviews when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadFiveStarReviews();
});

/**
 * TEST FUNCTION: Add sample 5-star reviews to Firebase
 * Call this in browser console: window.addSampleReviews()
 * Requires: Must be logged in
 */
window.addSampleReviews = async function() {
  // Wait a moment to ensure auth is fully initialized
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    alert('❌ You must be logged in to add reviews. Please log in first.');
    return;
  }
  
  console.log('Adding reviews for user:', currentUser.uid);

  const sampleReviews = [
    {
      rating: 5,
      description: "Deepfake Guard has been a game-changer for our organization's security. The peace of mind it provides is invaluable.",
      userId: currentUser.uid,
      anonymous: true
    },
    {
      rating: 5,
      description: "The on-device processing is brilliant. It's fast, private, and doesn't drain the battery. Highly recommended.",
      userId: currentUser.uid,
      anonymous: false
    },
    {
      rating: 5,
      description: "Integration was seamless with the SDK. Their support team was fantastic and helped us get up and running in no time.",
      userId: currentUser.uid,
      anonymous: true
    },
    {
      rating: 5,
      description: "Outstanding solution for protecting against deepfake attacks. The real-time detection accuracy is impressive and the user experience is seamless.",
      userId: currentUser.uid,
      anonymous: false
    },
    {
      rating: 5,
      description: "We deployed this across our entire organization and haven't looked back. The detection confidence metrics are transparent and reliable.",
      userId: currentUser.uid,
      anonymous: true
    }
  ];

  try {
    for (const review of sampleReviews) {
      await addDoc(collection(db, 'reviews'), {
        ...review,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('✅ Sample reviews added successfully! Refresh the page to see them.');
    alert('Sample reviews added! Please refresh the page to see them displayed.');
  } catch (error) {
    console.error('❌ Error adding sample reviews:', error);
    alert('Error adding sample reviews. Check console for details.');
  }
};

/**
 * TEST FUNCTION: Clear all reviews from Firebase
 * Call this in browser console: window.clearAllReviews()
 */
window.clearAllReviews = async function() {
  if (!confirm('Are you sure you want to delete ALL reviews? This cannot be undone.')) {
    return;
  }

  try {
    const q = query(collection(db, 'reviews'));
    const snapshot = await getDocs(q);
    for (const reviewDoc of snapshot.docs) {
      await deleteDoc(doc(db, 'reviews', reviewDoc.id));
    }
    console.log('✅ All reviews deleted successfully!');
    alert('All reviews deleted! Refresh the page.');
  } catch (error) {
    console.error('❌ Error deleting reviews:', error);
    alert('Error deleting reviews. Check console for details.');
  }
};
