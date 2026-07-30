import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function privateKey() {
  return process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS
    || (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && privateKey()),
  );
}

export function getFirebaseAdminServices() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin não configurado no servidor.");
  }

  const app = getApps()[0] ?? initializeApp({
    credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? applicationDefault()
      : cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey(),
      }),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  });

  return { adminAuth: getAuth(app), adminDb: getFirestore(app) };
}
