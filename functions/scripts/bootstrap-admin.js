const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { Firestore } = require("@google-cloud/firestore");

const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const uid = process.env.FIREBASE_TARGET_UID;
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "ai-studio-bicirclebisexual-7b1ba258-2320-4251-a404-a27b5a1fc949";
if (!projectId || !uid) {
  console.error("Set GCLOUD_PROJECT and FIREBASE_TARGET_UID. Use a trusted operator account with Firebase Auth Admin and Firestore permissions.");
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });

async function main() {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), admin: true, moderator: true });
  const firestore = new Firestore({ projectId, databaseId: FIRESTORE_DATABASE_ID });
  await firestore.collection("profiles").doc(uid).set(
    { is_admin: true, is_moderator: true },
    { merge: true }
  );
  console.log("Admin claim granted to UID:", uid);
  console.log("Firestore database targeted:", FIRESTORE_DATABASE_ID);
  console.log("Have the user refresh their ID token or sign in again.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
