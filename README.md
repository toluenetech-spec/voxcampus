# VoxCampus

Academic podcasts and live audio rooms for campus. Instructors publish lecture
audio, run live office hours, and grade submissions; students discover public
episodes, enrol with a six-character course code, and submit work.

Built with **React 19 + Vite 8**, **Tailwind CSS 3**, **Firebase** (Auth +
Firestore) and **ZegoCloud** for live audio. Ships as a PWA.

---

## Quick start

```bash
npm install
cp .env.example .env      # optional — defaults are checked in
npm run dev               # http://localhost:5173
```

| Script            | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Dev server with HMR (binds `0.0.0.0` for previews)   |
| `npm run build`   | Production build into `dist/`                        |
| `npm run preview` | Serve the production build                           |
| `npm run lint`    | ESLint across the project                            |
| `npm run smoke`   | Headless jsdom walk of every route (no network)      |

### `npm run smoke`

Boots the real app in jsdom against the demo backend, visits every route as both
a student and an instructor, and fails if a screen doesn't render or a React
error is logged. Handy as a sanity check before committing UI changes.

## No Firebase? Use the demo workspace

VoxCampus never shows a dead spinner when the backend is unreachable. Instead:

1. The landing page and sign-in screen expose **Explore the demo workspace**.
2. Demo mode swaps Firestore for an in-memory store (`src/lib/localDb.js`)
   seeded with realistic courses, episodes, materials, assignments and
   submissions — including playable sample audio in `public/demo/`.
3. A banner states clearly that you are in the demo, and **Profile → Reset demo
   data** restores the original seed.

Everything except the ZegoCloud audio bridge works in demo mode; the live room
shows an explanatory panel instead of a broken SDK.

## Project structure

```
src/
├── components/        Shared UI (Logo, GuidedTour, AudioPlayer, modals…)
├── context/           AppContext — session, theme, backend status
├── firebase/          Firebase initialisation (env-overridable)
├── layouts/           MainLayout — sidebar / bottom nav shell
├── lib/               Framework-free helpers
│   ├── localDb.js     In-memory Firestore-shaped store used by demo mode
│   ├── demoSeed.js    Demo courses, episodes, assignments, submissions
│   ├── avatars.js     Inline SVG avatars (no third-party requests)
│   └── audioManager.js  Ensures one audio stream plays at a time
├── services/
│   ├── store.js       Single data-access entry point (cloud ↔ demo)
│   └── upload.js      Cloudinary uploads with an offline fallback
└── views/             Route-level screens
```

Views never import `firebase/firestore` directly — they import from
`src/services/store.js`, which resolves to either the real backend or the demo
store. That keeps the swap a one-line decision.

## AI assistant

Route `/ai` (lazy-loaded, ~19 KB). The UI lives in `src/views/AIAssistantView.jsx`
and talks to the serverless function in `api/ai.js` at `POST /api/ai`.

**Tools:** Ask, Outline lecture, Draft feedback, Quiz, Flashcards. Prompts are
role-aware — instructors see *"Ask anything about teaching your courses"*,
students *"Ask anything about your studies"*.

**Context sent to the function:** the user's name, role and institution, their
course titles, and per-course podcasts, materials and assignments. Nothing else
leaves the browser.

**Chats** persist per user in `localStorage` under `vox_ai_chats_<uid>`, capped
at 40 conversations.

**Errors** are classified from the server's message into `offline`,
`unconfigured`, `billing`, `unauthorized` or `error`, each with its own panel.
The classifier matches on phrases, so keep `not configured`,
`payment method`/`billing`/`credits` and `authoriz` in the function's messages.

### Enabling it

Without `OPENCODE_API_KEY` the function returns 503 and the UI shows its
"AI not configured" state — the assistant degrades cleanly rather than
breaking. Add the key in your host's environment variables to switch it on.

The endpoint is not available in the demo workspace, and the view says so.

## Data model (Firestore)

| Collection    | Key fields                                                                |
| ------------- | ------------------------------------------------------------------------- |
| `users`       | `fullName`, `email`, `role` (`student`/`instructor`), `joinedCourses[]`    |
| `courses`     | `title`, `description`, `instructorId`, `instructorName`, `courseCode`     |
| `podcasts`    | `courseId`, `title`, `fileUrl`, `isPublic`, `likes[]`, `playCount`         |
| `materials`   | `courseId`, `title`, `fileUrl`, `fileExtension`                            |
| `assignments` | `courseId`, `title`, `description`, `dueDate`                              |
| `submissions` | `assignmentId`, `courseId`, `studentId`, `status`, `score`                 |
| `live_rooms`  | `roomId`, `courseId`, `topic`, `hostId`, `status` (`active`/`ended`)       |

## Deploying to Vercel

`vercel.json` is checked in and already contains the SPA rewrite, so no
dashboard configuration is required beyond the environment variables.

### Option A — Git integration (recommended)

1. Go to <https://vercel.com/new> and import `toluenetech-spec/voxcampus`.
2. Vercel detects Vite from `vercel.json`. Leave the defaults:

   | Setting          | Value           |
   | ---------------- | --------------- |
   | Framework        | Vite            |
   | Build command    | `npm run build` |
   | Output directory | `dist`          |
   | Install command  | `npm install`   |
   | Node version     | 22 (see `engines` in `package.json`) |

3. Add the environment variables below, then **Deploy**. Every push to `main`
   (and every branch) gets its own preview URL from then on.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Environment variables

Set these in **Project → Settings → Environment Variables**. All are optional:
the app boots with the checked-in Firebase defaults and falls back to the
built-in demo workspace when a backend is unreachable.

| Variable                             | Required for        | Public?                          |
| ------------------------------------ | ------------------- | -------------------------------- |
| `VITE_FIREBASE_API_KEY`              | auth + Firestore    | Yes — safe in the browser        |
| `VITE_FIREBASE_AUTH_DOMAIN`          | auth + Firestore    | Yes                              |
| `VITE_FIREBASE_PROJECT_ID`           | auth + Firestore    | Yes                              |
| `VITE_FIREBASE_STORAGE_BUCKET`       | auth + Firestore    | Yes                              |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`  | auth + Firestore    | Yes                              |
| `VITE_FIREBASE_APP_ID`               | auth + Firestore    | Yes                              |
| `VITE_CLOUDINARY_CLOUD`              | audio/file uploads  | Yes                              |
| `VITE_CLOUDINARY_PRESET`             | audio/file uploads  | Yes — use an *unsigned* preset   |
| `VITE_ZEGO_APP_ID`                   | live audio rooms    | Yes                              |
| `VITE_ZEGO_SERVER_SECRET`            | live audio rooms    | **No — see the warning below**   |

Live audio rooms are optional. Leave both Zego variables unset and the room page
still renders — it just shows an explanatory panel instead of the audio bridge.

> **Warning.** Anything prefixed `VITE_` is inlined into the client bundle and
> is readable by anyone who loads the site. That is fine for the Firebase web
> config (it is public by design and Firestore rules do the authorising), but
> **not** for the Zego server secret, which can mint a token for *any* room on
> the account. Before enabling live rooms, move token minting into a serverless
> function that reads a non-prefixed `ZEGO_SERVER_SECRET`.

### Firebase Console setup (required for every new domain)

Two things cannot be done from code and must be done once per domain in the
Firebase Console, or sign-in and data access will fail on a deployed site even
though everything works on `localhost`.

**1. Authorise the domain for sign-in.** Firebase rejects OAuth from origins it
does not recognise (`auth/unauthorized-domain`). Without this, **email/password
sign-in works but Google sign-in does not.**

Firebase Console → **Authentication → Settings → Authorized domains → Add
domain**, then add each of:

- `your-app.vercel.app` (the exact host, no `https://`, no trailing slash)
- any Vercel preview host you want to test (e.g. `your-app-git-branch.vercel.app`)
- any custom domain you connect

`localhost` and `127.0.0.1` are already there by default.

**2. Check the API key's referrer restrictions.** If *every* Firebase call fails
on the deployed site (the app shows "Could not reach Firebase" rather than just
Google sign-in failing), the API key is restricted to `localhost`.

Google Cloud Console → **APIs & Services → Credentials** → your API key →
**Application restrictions → HTTP referrers**. Add `your-app.vercel.app/*` and
`your-app.vercel.app/*/*`, or set it to *None* while testing. Note that Firebase
web API keys are not secret — restricting them by referrer is optional.

**3. Deploy the Firestore rules** (see below). Until you do, the project is
running on its default rules and queries will fail with *"Missing or
insufficient permissions"*.

### Firestore rules

`firestore.rules` is checked in but is **not** deployed by Vercel — Firestore
rules live in your Firebase project, not in the build. Deploy them once with the
Firebase CLI, or paste the file into **Firestore Database → Rules**:

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

If the deployed app shows *"Missing or insufficient permissions"*, the project's
rules are still the defaults (usually either fully open or fully closed).

### Other notes

- `vercel.json` rewrites every path to `index.html`, which client-side routing
  needs; without it `/dashboard` returns a 404 on a hard refresh.
- Immutable assets under `/assets/` get a one-year cache header; `/sw.js` is
  explicitly set to `must-revalidate` so the service worker can update.
- The ZegoCloud SDK is ~5 MB, so the live room route is lazily loaded — it is
  fetched only when someone opens a room. When no Zego credentials are present
  at build time the chunk is also excluded from the service-worker precache,
  which keeps the install down to ~880 KiB instead of ~5.8 MB.
- Netlify/Cloudflare users can rely on `public/_redirects` instead.
