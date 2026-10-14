# BiCircle — Bisexual Community Platform

> **"Find your people. Be yourself."**  
> A dedicated, authentic, full-stack social community platform for bisexual people. Built for friendship, peer support, shared interests, personal stories, and community circles.

---

### Important Platform Notice
**BiCircle is deliberately NOT a dating app.**  
It does not contain dating profiles, hookup discovery, swipe cards, attractiveness ratings, or romantic matchmaking algorithms. It protects community spaces where bisexual members can connect platonically without unsolicited romantic or sexual advances.

---

## 1. Technology Stack

- **Frontend & App Shell:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Primary Cloud Backend & Database:** Google Cloud Firestore (Firebase)
  - **Firestore Database ID:** `ai-studio-bicirclebisexual-7b1ba258-2320-4251-a404-a27b5a1fc949`
  - **Firebase Project ID:** `ai-studio-applet-webapp-8c041`
  - **Intermediate Blueprint:** `firebase-blueprint.json`
  - **Security Rules:** Deployed `firestore.rules`
- **Authentication:** Firebase Auth & multi-role reviewer session manager
- **Design System:** Custom dark theme (#0E0B13 background, #191321 cards, #9B5CFF primary purple, #F05AA6 accent pink)

---

## 2. Database Architecture (16 Tables)

The complete SQL migration is located in:
```
/supabase/migrations/20261013000000_bicircle_schema.sql
```

Tables included:
1. `profiles`: Public display name, username, bio, pronouns, interests, moderator flags, and status.
2. `user_private`: Confidential account data, private notes, and communication permissions (RLS protected).
3. `groups`: Community circles, topics, rules, and visibility (public or private).
4. `group_members`: Memberships with roles (`owner`, `moderator`, `member`) and approval statuses.
5. `friend_requests`: Pending, accepted, or rejected friendship requests with constraints.
6. `friendships`: Canonical bidirectional friendships.
7. `posts`: Feed and circle posts with markdown support and media references.
8. `post_likes`: Post reactions with uniqueness constraint.
9. `comments`: Nested and linear replies.
10. `conversations`: Private communication channels.
11. `conversation_members`: Authorized participants for direct messages.
12. `messages`: Timestamped, persisted text messages with status.
13. `blocks`: Mutual interaction restrictions enforced at database level.
14. `reports`: Confidential report queue for community safety.
15. `moderation_actions`: Audit trail of all warnings, content deletions, and suspensions.
16. `notifications`: Persistent user alerts with unread tracking.

---

## 3. Local Development & Quick Start

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/bicircle.git
cd bicircle

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run development server
npm run dev
```

The application runs on `http://localhost:3000`.

---

## 4. Connecting Your Supabase Project

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open and run the migration file `supabase/migrations/20261013000000_bicircle_schema.sql`.
4. In Supabase **Project Settings → API**, copy your **Project URL** and **anon public key**.
5. Add them to your `.env` file:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key"
   ```
6. Alternatively, click the **Supabase Config** button directly in the application header to enter your keys or toggle interactive local persistence.

---

## 5. Storage Buckets & Policies

In your Supabase Storage dashboard:
1. Create a public bucket named `avatars`:
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
   - File size limit: 5MB
   - Policy: Anyone can read, authenticated users can upload to their own user ID folder.
2. Create a restricted bucket named `community_media`:
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
   - File size limit: 10MB
   - Policy: Authenticated community members only.

---

## 6. Deployment to Vercel

1. Push your repository to GitHub.
2. Log into [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Set Framework Preset to **Vite**.
5. Add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy**.

---

## 7. Security and Launch Checklist

- [x] Strict prohibition on dating profiles, romantic matching, and hookup feeds.
- [x] Separate public profile (`profiles`) and confidential private data (`user_private`).
- [x] Row Level Security (RLS) enabled on all 16 tables.
- [x] Multi-role support: regular members, group owners, community moderators, and administrators.
- [x] Human moderation queue with audit trail logging for all actions.
- [x] Blocking system that prevents interaction across feeds, groups, and direct messages.
- [x] Machine-readable data export (.json) and account deletion workflow.
- [x] WCAG AA contrast standards and mobile-responsive layout.
