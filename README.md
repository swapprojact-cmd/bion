# BiCircle — Bisexual Community Platform

> **Find your people. Be yourself.**

BiCircle is a community platform focused on friendship, peer support, shared interests, personal stories, and community circles. It is deliberately **not a dating app**.

## Technology

- React 19, TypeScript, Vite, Tailwind CSS v4
- Firebase Authentication
- Cloud Firestore (document database and realtime listeners)
- Cloud Storage for Firebase
- Cloud Functions for Firebase
- Firebase Hosting

## Start here

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for the full Firebase project setup, environment configuration, local emulators, security rules, and deployment commands.

### Local development

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
# Fill .env.local with the Web App config from your own Firebase project.
npm run dev
```

The app is served at http://localhost:3000.

### Deploy

After configuring the project with `firebase use --add`, reviewing the rules, and testing with the Emulator Suite:

```bash
npm run lint
npm test
npm run build
npm --prefix functions install
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
firebase deploy --only hosting
```

## Backend migration status

This repository now includes Firebase Hosting configuration, Firestore indexes and security rules, Storage rules and upload helpers, a Cloud Functions package, and Firebase Auth-only sign-in/sign-up behavior. No Supabase data or accounts are migrated.

**Important:** the app's existing `DataService` and many screens still use demo data/localStorage and are not yet fully converted to Firestore. Do not treat this infrastructure work as a production-ready full-stack migration until the remaining reads/writes, realtime subscriptions, account deletion, and end-to-end security tests are completed. Firestore is not PostgreSQL; relational constraints and SQL joins require a document-model redesign.

## Community safety

- No client-side demo login or demo role switching.
- Client profiles cannot grant admin/moderator roles; privileged roles use Firebase Auth custom claims.
- Firestore and Storage rules default-deny unrecognized paths.
- Review [FIREBASE_SETUP.md](FIREBASE_SETUP.md) before deploying any rules to a real project.
