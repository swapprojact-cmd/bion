const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onUserDeleted } = require("firebase-functions/v2/identity");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

exports.setCommunityRole = onCall(async (request) => {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Administrator access is required.");
  }
  const { uid, role, enabled } = request.data || {};
  if (typeof uid !== "string" || !uid || !["admin", "moderator"].includes(role) || typeof enabled !== "boolean") {
    throw new HttpsError("invalid-argument", "Provide uid, role (admin|moderator), and enabled.");
  }
  if (uid === request.auth.uid && role === "admin" && enabled === false) {
    throw new HttpsError("failed-precondition", "Use another administrator to remove your own admin role.");
  }
  const user = await getAuth().getUser(uid);
  const claims = { ...(user.customClaims || {}) };
  if (enabled) claims[role] = true;
  else delete claims[role];
  await getAuth().setCustomUserClaims(uid, claims);
  await db.collection("moderation_actions").add({
    actor_id: request.auth.uid,
    target_user_id: uid,
    action: enabled ? "grant_role" : "revoke_role",
    role,
    created_at: FieldValue.serverTimestamp()
  });
  return { success: true };
});

exports.cleanupDeletedUser = onUserDeleted(async (event) => {
  const uid = event.data.uid;
  const batch = db.batch();
  for (const collectionName of ["profiles", "user_private"]) {
    batch.delete(db.collection(collectionName).doc(uid));
  }
  await batch.commit();
});
