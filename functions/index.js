const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { Firestore, FieldValue } = require("@google-cloud/firestore");

initializeApp();

// Use the stable Google Cloud Firestore server client for named-database access.
// Cloud Functions provides Application Default Credentials and GCLOUD_PROJECT.
const PROJECT_ID = process.env.GCLOUD_PROJECT
  || process.env.GOOGLE_CLOUD_PROJECT
  || "ai-studio-applet-webapp-8c041";
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID
  || "ai-studio-bicirclebisexual-7b1ba258-2320-4251-a404-a27b5a1fc949";
const db = new Firestore({ projectId: PROJECT_ID, databaseId: FIRESTORE_DATABASE_ID });

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
    moderator_id: request.auth.uid,
    target_type: "profile",
    target_id: uid,
    action_type: enabled ? "reinstate" : "warn",
    reason: (enabled ? "Granted " : "Revoked ") + role + " role",
    role_change: role,
    enabled,
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
  // Delete all user-owned/participating records from the same named database as the web app.
  // Each query uses the actual field names in the current Firestore document model.
  const querySpecs = [
    ["posts", "author_id", "==", uid],
    ["comments", "author_id", "==", uid],
    ["messages", "sender_id", "==", uid],
    ["friend_requests", "sender_id", "==", uid],
    ["friend_requests", "recipient_id", "==", uid],
    ["group_members", "user_id", "==", uid],
    ["friendships", "user_a", "==", uid],
    ["friendships", "user_b", "==", uid],
    ["blocks", "blocker_id", "==", uid],
    ["blocks", "blocked_id", "==", uid],
    ["notifications", "recipient_id", "==", uid],
    ["notifications", "actor_id", "==", uid],
    ["reports", "reporter_id", "==", uid],
    ["reports", "target_id", "==", uid],
    ["moderation_actions", "moderator_id", "==", uid],
    ["moderation_actions", "target_id", "==", uid],
    ["relationship_profiles", "uid", "==", uid],
    ["match_requests", "sender_id", "==", uid],
    ["match_requests", "recipient_id", "==", uid],
    ["post_likes", "user_id", "==", uid]
  ];

  const deletions = new Map();
  for (const [collectionName, field, operator, value] of querySpecs) {
    const snapshot = await db.collection(collectionName).where(field, operator, value).get();
    for (const document of snapshot.docs) deletions.set(document.ref.path, document.ref);
  }

  const conversations = await db.collection("conversations")
    .where("member_ids", "array-contains", uid).get();
  for (const document of conversations.docs) deletions.set(document.ref.path, document.ref);

  const references = [...deletions.values()];
  for (let start = 0; start < references.length; start += 400) {
    const batch = db.batch();
    references.slice(start, start + 400).forEach((reference) => batch.delete(reference));
    await batch.commit();
  }

  const directBatch = db.batch();
  directBatch.delete(db.collection("profiles").doc(uid));
  directBatch.delete(db.collection("user_private").doc(uid));
  await directBatch.commit();
  await getAuth().deleteUser(uid);
  return { success: true };
});
