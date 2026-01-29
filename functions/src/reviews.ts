import * as functions from "firebase-functions/v1";
import {defineSecret} from "firebase-functions/params";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "./firebase";
import * as https from "node:https";
import type {IncomingMessage} from "node:http";

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

interface ReviewModeration {
  pg13: boolean;
  sentiment: "positive" | "neutral" | "negative";
  screenedAt: Date;
  model: string;
  version: number;
}

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

/**
 * Returns the configured Gemini API key from secrets.
 * @return {string} Gemini API key
 */
function getGeminiApiKey(): string {
  const key = GEMINI_API_KEY.value();
  if (!key) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Gemini API key is not configured"
    );
  }
  return key;
}

/**
 * Calls the Gemini API with the provided prompt.
 * @param {string} apiKey - Gemini API key
 * @param {string} prompt - Prompt to send
 * @return {Promise<string>} Raw text response from Gemini
 */
function callGeminiApi(apiKey: string, prompt: string): Promise<string> {
  const body = JSON.stringify({
    contents: [{role: "user", parts: [{text: prompt}]}],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 256,
    },
  });

  const options: https.RequestOptions = {
    method: "POST",
    hostname: "generativelanguage.googleapis.com",
    path: `/v1/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: IncomingMessage) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Gemini API error ${res.statusCode}: ${raw}`));
          return;
        }
        try {
          const parsed = JSON.parse(raw) as {
            candidates?: Array<{content?: {parts?: Array<{text?: string}>}}>;
          };
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            reject(new Error("Gemini response missing text"));
            return;
          }
          resolve(text);
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Extracts the first JSON object from a text response.
 * @param {string} text - Text containing JSON
 * @return {Record<string, unknown>} Parsed JSON object
 */
function extractJsonObject(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON object found in Gemini response");
  }
  return JSON.parse(match[0]);
}

/**
 * Runs sentiment and PG-13 screening on review text.
 * @param {string} description - Review text
 * @return {Promise<ReviewModeration>} Moderation result
 */
async function analyzeReviewText(description: string): Promise<ReviewModeration> {
  const apiKey = getGeminiApiKey();
  const prompt = [
    "You are a safety and sentiment classifier for user reviews.",
    "Return ONLY valid JSON with keys: pg13 (boolean), sentiment (positive|neutral|negative).",
    "A review is NOT pg13 if it includes slurs, vulgarities, profanities, or explicit content.",
    "Do not repeat the input text. Do not include explanations.",
    "Review:",
    description,
  ].join("\n");

  const responseText = await callGeminiApi(apiKey, prompt);
  const json = extractJsonObject(responseText) as {
    pg13?: boolean;
    sentiment?: "positive" | "neutral" | "negative";
  };

  if (typeof json.pg13 !== "boolean") {
    throw new Error("Gemini response missing pg13 boolean");
  }

  const sentiment = json.sentiment ?? "neutral";
  if (!(["positive", "neutral", "negative"] as const).includes(sentiment)) {
    throw new Error("Gemini response has invalid sentiment");
  }

  return {
    pg13: json.pg13,
    sentiment,
    screenedAt: new Date(),
    model: GEMINI_MODEL,
    version: 1,
  };
}

/**
 * Returns moderation for a review, computing and caching if missing.
 * @param {string} reviewId - Firestore review document id
 * @param {string} description - Review text
 * @param {ReviewModeration} [existing] - Existing moderation if present
 * @return {Promise<ReviewModeration>} Moderation result
 */
async function ensureReviewModeration(
  reviewId: string,
  description: string,
  existing?: ReviewModeration
): Promise<ReviewModeration> {
  if (existing?.pg13 !== undefined && existing?.sentiment) {
    return {
      pg13: existing.pg13,
      sentiment: existing.sentiment,
      screenedAt: existing.screenedAt ?? new Date(),
      model: existing.model ?? GEMINI_MODEL,
      version: existing.version ?? 1,
    };
  }

  const moderation = await analyzeReviewText(description);
  await db.collection("reviews").doc(reviewId).set(
    {
      moderation: {
        pg13: moderation.pg13,
        sentiment: moderation.sentiment,
        screenedAt: moderation.screenedAt,
        model: moderation.model,
        version: moderation.version,
      },
      updatedAt: new Date(),
    },
    {merge: true}
  );
  return moderation;
}

/**
 * Returns a display name for the review author.
 * @param {string} userId - Review author user id
 * @param {boolean} [anonymous] - Whether the review is anonymous
 * @return {Promise<string>} Display name
 */
async function getDisplayName(userId: string, anonymous?: boolean): Promise<string> {
  if (anonymous) {
    return "Customer Review";
  }

  try {
    const publicUserDoc = await db.collection("public_users").doc(userId).get();
    if (publicUserDoc.exists) {
      return publicUserDoc.data()?.displayName || "Customer";
    }
  } catch (error) {
    return "Customer";
  }

  return "Customer";
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

    const {rating, description, anonymous} = data ?? {};
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

    // Validate anonymous (default to false)
    const isAnonymous = typeof anonymous === "boolean" ? anonymous : false;

    try {
      const reviewRef = await db.collection("reviews").add({
        userId: uid,
        rating: Math.round(rating),
        description: description.trim(),
        anonymous: isAnonymous,
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
export const getReviews = functions.runWith({secrets: [GEMINI_API_KEY]}).https.onCall(
  async (data) => {
    const {limit = 10, offset = 0} = data ?? {};

    try {
      const snapshot = await db
        .collection("reviews")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset)
        .get();

      const reviews = (await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const moderation = await ensureReviewModeration(
          doc.id,
          data.description,
          data.moderation
        );

        if (!moderation.pg13) {
          return null;
        }

        const displayName = await getDisplayName(data.userId, data.anonymous ?? false);

        return {
          id: doc.id,
          rating: data.rating,
          description: data.description,
          userId: data.userId,
          anonymous: data.anonymous ?? false,
          displayName,
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
        };
      }))).filter((review) => review !== null);

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
export const getFiveStarReviews = functions.runWith({secrets: [GEMINI_API_KEY]}).https.onRequest(
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

      const reviews = (await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();

        const moderation = await ensureReviewModeration(
          doc.id,
          data.description,
          data.moderation
        );

        if (!moderation.pg13 || moderation.sentiment !== "positive") {
          return null;
        }

        const displayName = await getDisplayName(data.userId, data.anonymous ?? false);

        return {
          id: doc.id,
          rating: data.rating,
          description: data.description,
          userId: data.userId,
          anonymous: data.anonymous ?? false,
          displayName: displayName,
          createdAt: data.createdAt?.toDate?.(),
        };
      }))).filter((review) => review !== null);

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
