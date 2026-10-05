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

## Deployment notes

- `public/_redirects` rewrites all paths to `index.html` (Netlify/Cloudflare).
  Add the equivalent SPA rewrite for your host of choice.
- The ZegoCloud SDK is ~5 MB, so the live room route is lazily loaded — it is
  fetched only when someone opens a room.
- Rotate `VITE_ZEGO_SERVER_SECRET` before going to production; the server secret
  can mint tokens for any room on the account.
