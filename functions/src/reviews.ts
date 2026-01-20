import * as functions from "firebase-functions/v1";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "./firebase";

// Helper function to add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Add CORS headers to response
 * @param {Object} res - Express response object
 */
function addCorsHeaders(res: {set: (headers: Record<string, string>) => void}) {
  res.set(corsHeaders);
}

/**
 * Review data structure
 */
export interface Review {
  userId: string;
  rating: number;
  description: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

/**
 * Add a new customer review
 * Requires authentication
 */
export const addReview = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const {rating, description} = data ?? {};
    const uid = context.auth.uid;

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Rating must be a number between 1 and 5"
      );
    }

    // Validate description
    if (typeof description !== "string" || description.trim().length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Review description is required"
      );
    }

    if (description.trim().length > 1000) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Review description must be 1000 characters or less"
      );
    }

    try {
      const reviewRef = await db.collection("reviews").add({
        userId: uid,
        rating: Math.round(rating),
        description: description.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        reviewId: reviewRef.id,
        message: "Review submitted successfully",
      };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to submit review"
      );
    }
  }
);

/**
 * Get all published reviews (paginated)
 * Public function - no authentication required
 */
export const getReviews = functions.https.onCall(
  async (data) => {
    const {limit = 10, offset = 0} = data ?? {};

    try {
      const snapshot = await db
        .collection("reviews")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset)
        .get();

      const reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.(),
        updatedAt: doc.data().updatedAt?.toDate?.(),
      }));

      return {
        success: true,
        reviews,
        count: reviews.length,
      };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to retrieve reviews"
      );
    }
  }
);

/**
 * Get reviews count and average rating
 * Public function - no authentication required
 */
export const getReviewStats = functions.https.onCall(
  async () => {
    try {
      const snapshot = await db.collection("reviews").get();

      if (snapshot.empty) {
        return {
          success: true,
          totalReviews: 0,
          averageRating: 0,
        };
      }

      const reviews = snapshot.docs.map((doc) => doc.data());
      const totalReviews = reviews.length;
      const averageRating =
        reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

      return {
        success: true,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to retrieve review stats"
      );
    }
  }
);

/**
 * Get only 5-star reviews for marketing site display
 * Public function - no authentication required
 * CORS enabled for web requests
 */
export const getFiveStarReviews = functions.https.onRequest(
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      addCorsHeaders(res);
      res.status(204).send("");
      return;
    }

    addCorsHeaders(res);

    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const snapshot = await db
        .collection("reviews")
        .where("rating", "==", 5)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset)
        .get();

      const reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        rating: doc.data().rating,
        description: doc.data().description,
        user_id: doc.data().user_id,
        createdAt: doc.data().createdAt?.toDate?.(),
      }));

      res.json({
        success: true,
        reviews,
        count: reviews.length,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve 5-star reviews",
      });
    }
  }
);

/**
 * Delete own review (only the user who created it)
 */
export const deleteReview = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const {reviewId} = data ?? {};
    const uid = context.auth.uid;

    if (typeof reviewId !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Review ID is required"
      );
    }

    try {
      const reviewRef = db.collection("reviews").doc(reviewId);
      const reviewSnap = await reviewRef.get();

      if (!reviewSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Review not found");
      }

      if (reviewSnap.data()?.userId !== uid) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You can only delete your own reviews"
        );
      }

      await reviewRef.delete();

      return {
        success: true,
        message: "Review deleted successfully",
      };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Failed to delete review"
      );
    }
  }
);
