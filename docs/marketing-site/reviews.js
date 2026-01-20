// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";
import { getFirestore, collection, getDocs, query, where, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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

      // Add each review to the slider
      result.reviews.forEach((review) => {
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

  // Create user info (use userId, you can enhance this with user profile data)
  const userInfo = document.createElement('strong');
  const dateString = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';
  userInfo.textContent = `- Customer Review • ${dateString}`;

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
 * Then refresh the page to see them displayed
 */
window.addSampleReviews = async function() {
  const sampleReviews = [
    {
      rating: 5,
      description: "Deepfake Guard has been a game-changer for our organization's security. The peace of mind it provides is invaluable.",
      userId: "test-user-1"
    },
    {
      rating: 5,
      description: "The on-device processing is brilliant. It's fast, private, and doesn't drain the battery. Highly recommended.",
      userId: "test-user-2"
    },
    {
      rating: 5,
      description: "Integration was seamless with the SDK. Their support team was fantastic and helped us get up and running in no time.",
      userId: "test-user-3"
    },
    {
      rating: 5,
      description: "Outstanding solution for protecting against deepfake attacks. The real-time detection accuracy is impressive and the user experience is seamless.",
      userId: "test-user-4"
    },
    {
      rating: 5,
      description: "We deployed this across our entire organization and haven't looked back. The detection confidence metrics are transparent and reliable.",
      userId: "test-user-5"
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
