/**
 * Firebase initialization - shared across all functions
 */
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
export const db = getFirestore();
