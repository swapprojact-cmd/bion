# BiCircle Firebase-only backend

This repository is configured for Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions, and Firebase Hosting. This is a fresh setup: no Supabase data or users are migrated. Firebase client configuration is public application configuration, not a service-account credential; never commit service-account JSON or private keys.

## Firebase features and current boundaries

- Authentication: Firebase Authentication (enable Email/Password and any additional providers in the console).
- Database and realtime: Cloud Firestore documents and snapshot listeners.
- File storage: Cloud Storage with owner-scoped image uploads and MIME/size limits.
- Server-side operations: Cloud Functions v2 with Admin SDK; privileged role changes require an existing admin custom claim.
- Hosting: Firebase Hosting with Vite SPA rewrites and basic security headers.
- SQL replacement: Firestore is a document database, not PostgreSQL. SQL joins, relational constraints, and Supabase RLS policies must be redesigned as document paths, transactions, indexes, and Firebase Security Rules.

## 1. Create/select a Firebase project

1. Create a project in https://console.firebase.google.com/.
2. Add a Web app and copy its Firebase web config.
3. Enable Authentication > Sign-in method > Email/Password.
4. Create a Cloud Firestore database in production mode.
5. Enable Cloud Storage and choose the region deliberately; database/storage regions generally cannot be changed in place.
6. For Cloud Functions, enable billing if your project/region requires it.
7. Add your local and deployed site domains to Authentication > Settings > Authorized domains.

## 2. Configure the app (no invented credentials)

Copy .env.example to .env.local and fill these values from your own Firebase Web App settings:

    VITE_FIREBASE_API_KEY=your-web-api-key
    VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your-project-id
    VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    VITE_FIREBASE_APP_ID=your-web-app-id
    VITE_FIRESTORE_DATABASE_ID=(default)

The app intentionally fails fast when any required Firebase value is missing; it does not silently connect to the previous AI Studio project. Never put Admin SDK credentials in VITE_* variables.

## 3. Select the Firebase CLI project

Install Node.js 20+ and the CLI:

    npm install
    npm install -g firebase-tools
    firebase login
    firebase projects:list

Set the actual project ID for this checkout:

    firebase use --add

Choose your project and assign the alias default. This creates/updates .firebaserc locally. Review it before committing; it contains a project ID, not a secret.

## 4. Run locally

    npm run dev
    npm --prefix functions install
    firebase emulators:start --only auth,firestore,storage,functions,hosting

The emulator UI is at http://127.0.0.1:4000. To make the frontend use emulators, add explicit emulator connection calls in development; do not point production builds at emulators.

## 5. Deploy

After setting your Firebase project and reviewing rules:

    npm run lint
    npm test
    npm run build
    npm --prefix functions install
    firebase deploy --only firestore:rules,firestore:indexes,storage,functions
    firebase deploy --only hosting

Or deploy all configured resources with firebase deploy. Deploying rules replaces the rules currently configured in the console, so review the rules files first. Do not deploy until you have verified the selected project ID.

## 6. Data model and permissions

The starter rules use these collections: profiles, user_private, groups, group_members, posts, comments, friend_requests, friendships, blocks, conversations, messages, notifications, reports, and moderation_actions. They intentionally default-deny unknown paths.

- Role grants use Firebase Auth custom claims, not writable profile booleans. Bootstrap the first admin manually with a trusted one-off Admin SDK script or a trusted server environment; never expose an endpoint that lets a user grant themselves a role.
- Private report reads and moderation audit reads require admin/moderator claims.
- Storage upload helpers accept images only; security rules enforce ownership and size limits as a second layer.
- Firestore rules are not filters. Queries must be constrained so every possible returned document satisfies the corresponding read rule.
- Cloud Functions use the Admin SDK, which bypasses Firestore rules. Validate authorization and input in every function.

## Important integration note

This commit establishes Firebase infrastructure and safe service helpers. The existing UI/data layer still contains demo/localStorage behavior and may expect legacy document shapes. Do not treat this infrastructure commit alone as proof that every screen is fully cloud-backed. Before launch, finish converting all DataService mutations and reads to Firestore, use onSnapshot for live feed/messages/notifications, replace any Supabase settings UI, and remove demo-account login paths. Test end-to-end flows with the Firebase Emulator Suite and a fresh test project before production deployment.
