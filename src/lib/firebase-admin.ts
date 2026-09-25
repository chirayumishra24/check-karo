import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// On Firebase App Hosting the service account and project are picked up
// automatically. Locally, either run the Firestore emulator
// (FIRESTORE_EMULATOR_HOST) or point GOOGLE_APPLICATION_CREDENTIALS at a
// service-account key.
function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT;
  return initializeApp(projectId ? { projectId } : undefined);
}

/** Shared Firestore handle. Firestore rejects `undefined` field values, so strip them before writing. */
export function firestore(): Firestore {
  return getFirestore(app());
}
