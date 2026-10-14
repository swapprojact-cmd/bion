const { onCall, HttpsError } = require("firebase-functions/v2/https");
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
  await db.collection("profiles").doc(uid).set(
    role === "admin" ? { is_admin: enabled } : { is_moderator: enabled },
    { merge: true }
  );
  await db.collection("moderation_actions").add({
    actor_id: request.auth.uid,
    target_user_id: uid,
    action: enabled ? "grant_role" : "revoke_role",
    role,
    created_at: FieldValue.serverTimestamp()
  });
  return { success: true };
});

/**
 * Account deletion is callable only for the authenticated account. This removes
 * the account's profile/private document and user-authored content that is stored
 * in top-level collections. Review new collections here whenever the schema grows.
 */
exports.deleteOwnAccount = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in before deleting your account.");
  const uid = request.auth.uid;
  const querySpecs = [
    ["posts", "author_id", uid],
    ["comments", "author_id", uid],
    ["messages", "sender_id", uid],
    ["friend_requests", "sender_id", uid],
    ["friend_requests", "receiver_id", uid],
    ["group_members", "user_id", uid],
    ["friendships", "user_ids", uid],
    ["blocks", "blocker_id", uid],
    ["blocks", "blocked_id", uid],
    ["notifications", "recipient_id", uid],
    ["reports", "reporter_id", uid]
  ];
  for (const [collectionName, field, value] of querySpecs) {
    const snapshot = await db.collection(collectionName).where(field, field === "user_ids" ? "array-contains" : "==", value).get();
    for (let start = 0; start < snapshot.docs.length; start += 400) {
      const batch = db.batch();
      snapshot.docs.slice(start, start + 400).forEach((document) => batch.delete(document.ref));
      await batch.commit();
    }
  }
  const directBatch = db.batch();
  directBatch.delete(db.collection("profiles").doc(uid));
  directBatch.delete(db.collection("user_private").doc(uid));
  await directBatch.commit();
  await getAuth().deleteUser(uid);
  return { success: true };
});
