const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const uid = process.env.FIREBASE_TARGET_UID;
if (!projectId || !uid) {
  console.error("Set GCLOUD_PROJECT and FIREBASE_TARGET_UID. Use a trusted operator account with Firebase Auth Admin and Firestore permissions.");
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });

async function main() {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), admin: true, moderator: true });
  await getFirestore().collection("profiles").doc(uid).set(
    { is_admin: true, is_moderator: true },
    { merge: true }
  );
  console.log("Admin claim granted to UID:", uid);
  console.log("Have the user refresh their ID token or sign in again.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
