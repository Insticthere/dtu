# MentorConnect — Complete Architecture & Technical Reference

> A deep-dive into every layer of the project: how pieces connect, why decisions were made, and how data flows from a user's click to the database and back.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Structure](#2-directory-structure)
3. [Tech Stack & Tools](#3-tech-stack--tools)
4. [Single-Config Design — The `.env` Strategy](#4-single-config-design--the-env-strategy)
5. [How Dev Mode Works — Vite Proxy](#5-how-dev-mode-works--vite-proxy)
6. [How Production Works — Single Process](#6-how-production-works--single-process)
7. [Database — MongoDB Atlas & Mongoose](#7-database--mongodb-atlas--mongoose)
8. [Data Models — Every Schema Explained](#8-data-models--every-schema-explained)
9. [Backend Architecture](#9-backend-architecture)
10. [Authentication Flow — JWT End to End](#10-authentication-flow--jwt-end-to-end)
11. [API Routes Reference](#11-api-routes-reference)
12. [Core Algorithms](#12-core-algorithms)
13. [Frontend Architecture](#13-frontend-architecture)
14. [Frontend ↔ Backend Connection — Every Layer](#14-frontend--backend-connection--every-layer)
15. [State Management — AuthContext & ThemeContext](#15-state-management--authcontext--themecontext)
16. [Dark Mode System](#16-dark-mode-system)
17. [Role-Based Access Control](#17-role-based-access-control)
18. [The Complete User Journey — Step by Step](#18-the-complete-user-journey--step-by-step)
19. [Error Handling Strategy](#19-error-handling-strategy)
20. [npm Scripts Reference](#20-npm-scripts-reference)

---

## 1. Project Overview

MentorConnect is a **mentor booking platform** with three user roles:

| Role | What they can do |
|---|---|
| **Student** | Browse approved mentors, book time slots, cancel bookings, leave reviews |
| **Mentor** | Apply to join, set weekly availability, view incoming bookings |
| **Admin** | Review and approve/reject mentor applications, view platform stats |

The platform enforces:
- **Atomic double-booking prevention** — two students can never book the same slot even under concurrent load
- **Lazy session completion** — past bookings auto-complete without a background job
- **Slot regeneration** — when availability changes, only future unbooked slots are affected

---

## 2. Directory Structure

```
mentorconnect/                   ← Project root (monorepo)
│
├── .env                         ← Single config file shared by both packages
├── .env.example                 ← Template showing what variables are needed
├── .gitignore                   ← Ignores node_modules, .env, frontend/dist
├── package.json                 ← Root orchestrator: workspaces + npm scripts
├── README.md                    ← Quick-start guide
├── ARCHITECTURE.md              ← This file
│
├── backend/
│   ├── package.json             ← Backend deps (express, mongoose, jwt, bcrypt…)
│   └── src/
│       ├── app.js               ← Express entry point, route mounting
│       ├── db.js                ← MongoDB Atlas connection
│       ├── seed.js              ← One-time data seeder (admin + demo accounts)
│       │
│       ├── api/                 ← Route + handler files (one per resource)
│       │   ├── auth.js          ← /api/auth — register, login, /me
│       │   ├── mentors.js       ← /api/mentors — directory, profile, slots, reviews
│       │   ├── availability.js  ← /api/mentor/availability — CRUD for rules
│       │   ├── bookings.js      ← /api/bookings — create, list, cancel
│       │   ├── reviews.js       ← /api/reviews — submit a review
│       │   └── admin.js         ← /api/admin — applications, dashboard
│       │
│       ├── models/              ← Mongoose schemas (one per collection)
│       │   ├── User.js
│       │   ├── MentorProfile.js
│       │   ├── Availability.js
│       │   ├── Slot.js
│       │   ├── Booking.js
│       │   └── Review.js
│       │
│       ├── middleware/
│       │   ├── auth.js          ← authenticate + requireRole middleware
│       │   └── errorHandler.js  ← Central error handler (catches everything)
│       │
│       └── utils/
│           ├── jwt.js           ← signToken + verifyToken
│           ├── slots.js         ← Slot generation & regeneration algorithms
│           └── conflicts.js     ← Overlap detection for availability rules
│
└── frontend/
    ├── package.json             ← React, Vite, Tailwind, React Router, Axios
    ├── vite.config.js           ← envDir + /api proxy config
    ├── tailwind.config.js       ← darkMode: 'class', Inter font
    ├── postcss.config.js
    ├── index.html               ← App shell: Inter font + anti-FOUC dark script
    │
    └── src/
        ├── main.jsx             ← ReactDOM.createRoot entry point
        ├── App.jsx              ← Router + ThemeProvider + AuthProvider + all routes
        ├── index.css            ← Tailwind directives + full design-system classes
        │
        ├── api/                 ← Client-side fetch wrappers (one per backend router)
        │   ├── client.js        ← Axios instance: auth header + error normalization
        │   ├── auth.js
        │   ├── mentors.js
        │   ├── availability.js
        │   ├── bookings.js
        │   ├── reviews.js
        │   └── admin.js
        │
        ├── context/
        │   ├── AuthContext.jsx  ← Global auth state: user, token, login(), logout()
        │   └── ThemeContext.jsx ← Dark/light mode toggle + localStorage persistence
        │
        ├── components/
        │   ├── Navbar.jsx           ← Sticky header, role-based links, dark toggle
        │   ├── ProtectedRoute.jsx   ← Auth + role guard for React Router routes
        │   ├── MentorCard.jsx       ← Card in the mentor directory
        │   ├── SlotPicker.jsx       ← Date-grouped slot grid with booking confirmation
        │   ├── BookingCard.jsx      ← Single booking with cancel / review actions
        │   │
        │   └── ui/                  ← Reusable atomic UI components
        │       ├── index.js         ← Barrel re-export
        │       ├── Icon.jsx         ← All SVG icons by name: <Icon name="search" />
        │       ├── Spinner.jsx      ← <PageSpinner /> and <InlineSpinner />
        │       ├── Alert.jsx        ← <Alert type="success|error|info|warning" />
        │       ├── Avatar.jsx       ← Initials avatar: <Avatar name="Priya" />
        │       ├── TabBar.jsx       ← <TabBar> + <Tab> for tabbed pages
        │       ├── PageHeader.jsx   ← Consistent page title block
        │       └── EmptyState.jsx   ← "Nothing here yet" placeholder
        │
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── StudentDashboard.jsx
        │   ├── MentorDirectory.jsx
        │   ├── MentorProfile.jsx
        │   ├── MyBookings.jsx
        │   ├── MentorDashboard.jsx
        │   ├── MentorAvailability.jsx
        │   ├── MentorBookings.jsx
        │   ├── AdminDashboard.jsx
        │   └── AdminApplications.jsx
        │
        └── utils/
            ├── format.js        ← formatDate, formatTime, formatDateTime, formatShortDate
            └── constants.js     ← ROLE_HOME, DAY_NAMES, STATUS_BADGE_CLASS
```

---

## 3. Tech Stack & Tools

### Backend

| Tool | Version | Why it was chosen |
|---|---|---|
| **Node.js** | 18+ | JavaScript runtime, native ESM support |
| **Express** | 4.x | Minimal, flexible HTTP framework |
| **Mongoose** | 8.x | MongoDB ODM — schema validation, indexes, hooks |
| **MongoDB Atlas** | Free M0 | Managed cloud database, no local setup |
| **jsonwebtoken** | 9.x | JWT signing and verification |
| **bcryptjs** | 2.x | Password hashing (pure JS, no native binary deps) |
| **dotenv** | 16.x | Loads `.env` into `process.env` |
| **cors** | 2.x | Enables cross-origin requests for dev/testing |
| **nodemon** | 3.x | Auto-restarts Express on file changes in dev |
| **cross-env** | 7.x | Sets `NODE_ENV` cross-platform in npm scripts |

### Frontend

| Tool | Version | Why it was chosen |
|---|---|---|
| **React** | 18.x | Component model, hooks, concurrent rendering |
| **Vite** | 5.x | Extremely fast dev server + HMR, ESM-native bundler |
| **React Router** | 6.x | Client-side routing with `<Routes>` and `<Navigate>` |
| **Axios** | 1.x | HTTP client with request/response interceptors |
| **Tailwind CSS** | 3.x | Utility-first CSS — dark mode via `dark:` variants |
| **PostCSS** | 8.x | Required by Tailwind for CSS processing |
| **Inter** (Google Fonts) | — | Clean, geometric font similar to Vercel's Geist |

### Monorepo Tooling

| Tool | Why |
|---|---|
| **npm workspaces** | Single `npm install` installs both packages |
| **concurrently** | Runs backend + frontend in one terminal with colored labels |

---

## 4. Single-Config Design — The `.env` Strategy

One of the most important architectural decisions: **there is only one `.env` file**, at the project root. Both backend and frontend read from it.

```
mentorconnect/
├── .env          ← SINGLE source of truth
├── backend/      ← reads via dotenv.config({ path: '../../.env' })
└── frontend/     ← reads via Vite envDir: path.resolve(__dirname, '..')
```

**Backend** (`backend/src/app.js`):
```js
// Resolve path from backend/src/ → project root (two levels up)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
```

**Frontend** (`frontend/vite.config.js`):
```js
// Point Vite's env reader one level up (frontend/ → project root)
envDir: path.resolve(__dirname, '..'),
```

> **Why?** Avoids duplicating secrets. Changing `MONGO_URI` updates both sides at once.

---

## 5. How Dev Mode Works — Vite Proxy

In development, **two servers run simultaneously**:
- **Vite dev server** on `localhost:5173` — serves React with hot-module replacement
- **Express server** on `localhost:5000` — serves the API

The browser always talks to **one origin** (port 5173). Vite intercepts `/api/*` and forwards to Express:

```
Browser
  → GET /api/mentors
  → Vite (5173)  [proxy intercepts]
  → Express (5000)
  → MongoDB Atlas
  → Express (5000)
  → Vite (5173)
  → Browser
```

**Vite proxy config** (`vite.config.js`):
```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
},
```

> **Key insight:** The frontend `api/client.js` uses `baseURL: '/api'` with no hostname. The exact same code works in dev (Vite proxies it) and prod (Express serves it directly). Zero environment-specific URL config needed.

---

## 6. How Production Works — Single Process

In production (`npm start`):

1. `npm run build` → Vite compiles React into `frontend/dist/` (static HTML/JS/CSS)
2. `NODE_ENV=production node backend/src/app.js` starts Express

Express then does three things:
1. Serves API routes at `/api/*`
2. Serves `frontend/dist/` as static files
3. Returns `frontend/dist/index.html` for **every non-`/api` route** (so React Router works on hard refresh)

```
Browser → GET /mentor/dashboard
  → Express
  → Not /api/* → returns index.html
  → React loads → React Router renders <MentorDashboard />

Browser → GET /api/mentor/availability
  → Express
  → Is /api/* → runs route handler → returns JSON
```

Configured in `app.js`:
```js
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  // SPA catch-all — MUST be AFTER all /api/* routes
  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
}
```

> **Critical ordering:** The catch-all `app.get('*')` must be registered AFTER all `/api/*` routes, otherwise it intercepts API calls and returns HTML instead of JSON.

---

## 7. Database — MongoDB Atlas & Mongoose

### Connection (`backend/src/db.js`)

```
Node.js app
  ↓ mongoose.connect(MONGO_URI)
MongoDB Atlas (cloud)
  cluster0.ic8gnf8.mongodb.net
    ↓
  database: mentorconnect
    ↓
  collections: users, mentorprofiles, availabilities, slots, bookings, reviews
```

The URI includes the database name:
```
mongodb+srv://user:pass@cluster.xyz.net/mentorconnect?retryWrites=true&w=majority
```

> **Common gotcha:** If `/mentorconnect` is missing from the URI, Mongoose puts everything in a database named `test`.

### ESM + `__dirname` workaround

Node ESM doesn't provide `__dirname`. Both backend and frontend use:
```js
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

---

## 8. Data Models — Every Schema Explained

### Relationships

```
User ─────────────── MentorProfile  (1:1, mentor users only)
                           │
                   Availability rules  (1:many)
                           │
                        Slots  (1:many per rule)
                           │
User (student) ──── Booking  (many:1 per slot) ──── Review  (1:1)
```

### `User`
```
_id, name, email (unique, lowercase), passwordHash, role (student|mentor|admin)
```
- Passwords are hashed with `bcryptjs` (cost factor 12) — plain text never stored
- `role` cannot be changed to `admin` via any public API endpoint

### `MentorProfile`
```
_id, user (→ User), professionalTitle, expertise (string[]),
yearsOfExperience, bio, profileUrl, preferredSessionDuration (30|60),
applicationStatus (PENDING|APPROVED|REJECTED), averageRating, totalReviews
```
- Created atomically alongside the mentor's User document on registration
- `averageRating` + `totalReviews` are **denormalized** — recomputed after each review via aggregation (avoids slow `$avg` on every profile read)
- `applicationStatus` starts as `PENDING`, changed only by admin

### `Availability`
```
_id, mentor (→ User), dayOfWeek (0=Sun – 6=Sat),
startTime ("HH:mm"), endTime ("HH:mm"), isActive (soft-delete)
Compound index: { mentor, dayOfWeek }
```
- Represents a **recurring weekly rule**, e.g. "every Monday 09:00–12:00"
- `isActive: false` = soft deleted (foreign keys in Slot docs remain valid for history)

### `Slot`
```
_id, mentor (→ User), availabilityRule (→ Availability),
date (midnight UTC), startTime (full Date), endTime (full Date),
status (AVAILABLE|BOOKED|CANCELLED), booking (→ Booking | null)
Index 1: { mentor, startTime }
Index 2: { availabilityRule, startTime }
```
- **Pre-generated** from rules for the next 10 days — makes atomic booking possible
- `startTime` is a full `Date` (not just "09:00") enabling `$gt: now` queries directly

### `Booking`
```
_id, slot (→ Slot), mentor (→ User, denormalized), student (→ User),
startTime, endTime (copied from slot at creation time),
status (CONFIRMED|COMPLETED|CANCELLED), cancelledAt
Partial unique index: { slot: 1 } WHERE status != CANCELLED
```
- Times are denormalized: if availability changes later, bookings keep their original times
- Partial index prevents two active bookings on one slot, while allowing re-booking after cancellation

### `Review`
```
_id, booking (→ Booking, unique), mentor (→ User), student (→ User),
rating (1–5), feedback (optional text)
Index: { mentor: 1 }
```
- Unique index on `booking` prevents duplicate reviews per session
- After submission, `MentorProfile.averageRating` is recomputed via aggregation pipeline

---

## 9. Backend Architecture

### Request lifecycle

```
HTTP Request
  │
  ▼
Express router (app.js)
  │  matches /api/* prefix
  │
  ▼
Route file (e.g. api/bookings.js)
  │
  ▼
Middleware chain:
  authenticate      ← verifies JWT, sets req.user
  requireRole()     ← checks req.user.role is in allowed list
  handler fn        ← async business logic
  │
  ▼
Mongoose query → MongoDB Atlas
  │
  ▼
JSON response   OR   next(error)
                           │
                           ▼
                     errorHandler.js  ← formats and sends error response
```

### Middleware chain example

```js
// Student booking a slot:
router.post('/',
  authenticate,          // Step 1: who are you? (JWT check)
  requireRole('student'), // Step 2: students only
  bookingHandler         // Step 3: business logic
);

// Approved mentor managing availability:
router.post('/availability',
  authenticate,
  requireRole('mentor'),
  requireApprovedMentor,  // Step 3: APPROVED status check
  createAvailabilityHandler
);
```

---

## 10. Authentication Flow — JWT End to End

### Registration / Login

```
Frontend form submits
  │
  POST /api/auth/register  OR  POST /api/auth/login
  │
  Backend:
  │  1. Hash password (bcrypt, cost 12)
  │  2. Save User (+ MentorProfile if mentor)
  │  3. Sign JWT: { id, name, email, role } + JWT_SECRET
  │  4. Return { token, user }
  │
  Frontend (AuthContext.login()):
  │  1. Store token → localStorage key 'mc_token'
  │  2. Set user in React state
  │  3. Navigate to role's home dashboard
```

### Subsequent API calls

```
Frontend api/client.js Axios interceptor:
  Every outgoing request:
    1. Read: token = localStorage.getItem('mc_token')
    2. Add:  Authorization: Bearer <token>
    3. Send request

Backend authenticate middleware:
  1. Parse: Authorization: Bearer <token>
  2. jwt.verify(token, JWT_SECRET)  ← throws if expired or tampered
  3. Attach decoded payload → req.user
  4. Call next()
```

### On page reload / app mount

```
AuthContext useEffect:
  1. Read token from localStorage
  2. If found → GET /api/auth/me
  3. If 200   → setUser(data.user)  ← user stays logged in
  4. If 401   → clear token         ← session expired
  5. setLoading(false) → ProtectedRoute can now safely redirect
```

### JWT payload structure

```json
{
  "id": "6a8d83bf5ac6c88418f4a20c",
  "name": "Priya Sharma",
  "email": "priya.mentor@demo.com",
  "role": "mentor",
  "iat": 1787659343,
  "exp": 1788264143
}
```

> The backend **never trusts the frontend for role or identity** — it always reads from the verified JWT payload.

---

## 11. API Routes Reference

All routes require `Authorization: Bearer <token>` unless marked **Public**.

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create student or mentor account |
| POST | `/api/auth/login` | Public | Login, returns token + user |
| GET | `/api/auth/me` | Any | Return current user from token |

### Mentors — `/api/mentors`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/mentors` | Any | List approved mentors (search, expertise filter) |
| GET | `/api/mentors/:id` | Any | Single mentor profile |
| GET | `/api/mentors/:id/slots` | Any | Future AVAILABLE slots |
| GET | `/api/mentors/:id/reviews` | Any | Reviews for a mentor |

### Availability — `/api/mentor/availability`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/mentor/availability` | Approved Mentor | List my rules |
| POST | `/api/mentor/availability` | Approved Mentor | Create rule + generate slots |
| PUT | `/api/mentor/availability/:id` | Approved Mentor | Update rule + regenerate slots |
| DELETE | `/api/mentor/availability/:id` | Approved Mentor | Soft-delete + remove future slots |

### Bookings
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | Student | Book a slot (atomic) |
| GET | `/api/bookings/me` | Student | My bookings (lazy completion) |
| GET | `/api/mentor/bookings` | Approved Mentor | Incoming bookings |
| PATCH | `/api/bookings/:id/cancel` | Student or Mentor | Cancel a booking |

### Reviews — `/api/reviews`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/reviews` | Student | Submit review for COMPLETED booking |

### Admin — `/api/admin`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/mentor-applications` | Admin | List applications |
| PATCH | `/api/admin/mentor-applications/:id/approve` | Admin | Approve a mentor |
| PATCH | `/api/admin/mentor-applications/:id/reject` | Admin | Reject a mentor |
| GET | `/api/admin/dashboard` | Admin | Platform stats |

---

## 12. Core Algorithms

### Algorithm 1 — Slot Generation (`utils/slots.js`)

**Triggered by:** Creating or updating an availability rule.

```
Input: Availability rule { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }
       daysAhead = 10

Process:
  Get mentor's preferredSessionDuration (30 or 60 min) from MentorProfile
  Parse startTime + endTime into hours/minutes

  For each day from today → today + 10:
    If day.getUTCDay() === rule.dayOfWeek:
      Compute window: [startDateTime, endDateTime] for that calendar date
      Slice window into durationMinutes-sized chunks
      Build candidate list of { startTime, endTime } pairs

  Fetch existing slots for this rule (ONE query, not N queries)
  Build Set of existing startTime ISO strings (O(1) lookup)
  Filter candidates: only keep those NOT already in Set  ← idempotency
  insertMany(newSlots, { ordered: false })
```

**Why pre-generate instead of computing on-the-fly?**
- Students select a specific bookable slot — a rule alone isn't enough
- The Slot document must exist for the atomic `findOneAndUpdate` to target
- Enables per-slot `status` tracking (AVAILABLE / BOOKED / CANCELLED)

### Algorithm 2 — Slot Regeneration (`utils/slots.js`)

**Triggered by:** Updating or deleting an availability rule.

| Slot Category | Action | Why |
|---|---|---|
| Past slots (`startTime ≤ now`) | **Never touched** | History is immutable |
| Future `AVAILABLE` slots | **Deleted** then regenerated | No bookings yet |
| Future `BOOKED` slots | **Left alone** | Student holds this booking |

```js
// Only delete future AVAILABLE slots
await Slot.deleteMany({
  availabilityRule: rule._id,
  status: 'AVAILABLE',
  startTime: { $gt: now },
});
// Then generate new slots from the updated rule
await generateSlotsForAvailability(rule, 10);
```

### Algorithm 3 — Atomic Booking Claim (`api/bookings.js`)

**The race condition:** Two students both see slot X as AVAILABLE, both click Book simultaneously. Without protection, both could create bookings for the same slot.

**The solution:**
```js
// findOneAndUpdate — only matches if status is STILL 'AVAILABLE'
const claimed = await Slot.findOneAndUpdate(
  { _id: slotId, status: 'AVAILABLE' },  // filter: must still be available
  { status: 'BOOKED' },                   // update: claim it atomically
  { new: true }
);

if (!claimed) {
  // Another request beat us — 0 or 1 requests succeed, never 2
  return res.status(409).json({ message: 'This slot is no longer available.' });
}
```

MongoDB guarantees single-document updates are atomic. Exactly one concurrent request matches the filter. The other gets `null` → 409.

**Database-level backstop — partial unique index:**
```js
bookingSchema.index(
  { slot: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'CANCELLED' } } }
);
```
Even if a bug bypasses the application check, the DB rejects the second insert.

### Algorithm 4 — Lazy Session Completion

**The problem:** CONFIRMED bookings whose `endTime` has passed should become COMPLETED, but running a cron job adds complexity.

**The solution:** Flip on every booking list read:
```js
// Runs before returning any booking list to the client
await Booking.updateMany(
  { status: 'CONFIRMED', endTime: { $lt: new Date() } },
  { $set: { status: 'COMPLETED' } }
);
```

No scheduler needed. Tradeoff: a booking isn't COMPLETED until someone fetches their list — acceptable for this use case.

---

## 13. Frontend Architecture

### Provider hierarchy

```jsx
<ThemeProvider>         ← dark/light mode, outermost (affects DOM class)
  <AuthProvider>        ← user identity, wraps routes
    <BrowserRouter>
      <Navbar />        ← always visible
      <Routes>
        ...
      </Routes>
    </BrowserRouter>
  </AuthProvider>
</ThemeProvider>
```

### Data flow inside a page

```
1. Component mounts
2. useEffect fires → API call(s)
3. Response → setState()
4. React re-renders with data
5. User interacts → event handler → API call
6. On success: update local state (optimistic or re-fetch)
7. On error: setError(err.message) → <Alert type="error" />
```

### Shared UI component library (`components/ui/`)

Instead of writing raw Tailwind classes in every page, components import from the UI barrel:
```js
import { Alert, Avatar, Icon, PageHeader, EmptyState, TabBar, Tab, PageSpinner } from '../components/ui';
```

This means:
- Dark mode is handled once in each UI component — pages don't repeat `dark:` classes
- Consistency: all error alerts look identical across the app
- Easy to change: update `Alert.jsx` → changes everywhere

---

## 14. Frontend ↔ Backend Connection — Every Layer

### Layer 1 — Axios instance (`src/api/client.js`)

```js
const client = axios.create({ baseURL: '/api' });

// Inject auth token on every request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('mc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize server error messages for the UI
client.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.message || err.message;
    return Promise.reject(new Error(message)); // always a clean string
  }
);
```

### Layer 2 — Resource modules (`src/api/*.js`)

One file per backend router:
```js
// src/api/bookings.js
export const bookingsApi = {
  create: (mentorId, slotId) => client.post('/bookings', { mentorId, slotId }),
  getMyBookings: ()         => client.get('/bookings/me'),
  getMentorBookings: ()     => client.get('/mentor/bookings'),
  cancel: (id)              => client.patch(`/bookings/${id}/cancel`),
};
```

### The full round-trip for a booking click

```
User clicks "Confirm Booking" in SlotPicker
  │
  ▼
SlotPicker → calls onBook(slot._id) [prop from MentorProfile]
  │
  ▼
MentorProfile.handleBook(slotId)
  → bookingsApi.create(mentorId, slotId)
  │
  ▼
api/client.js Axios
  → reads token from localStorage
  → adds Authorization: Bearer <token>
  → POST /api/bookings { mentorId, slotId }
  │
  ▼ [Vite proxy in dev / Express direct in prod]
  │
  ▼
Express → api/bookings.js POST /
  │
  ▼
authenticate → verifies JWT → req.user = { id, role: 'student' }
requireRole('student') → passes ✓
  │
  ▼
Handler:
  1. Validate slot exists & belongs to mentor
  2. hasStudentConflict() — no overlapping booking
  3. findOneAndUpdate(slot, AVAILABLE→BOOKED) — atomic
  4. Create Booking document
  5. Link slot.booking = booking._id
  6. Return 201 { message, booking }
  │
  ▼
Axios response → passes 201 through
  │
  ▼
bookingsApi.create() resolves
  │
  ▼
MentorProfile:
  → Removes booked slot from state (optimistic UI)
  → Shows <Alert type="success">Booking confirmed!</Alert>
```

---

## 15. State Management — AuthContext & ThemeContext

### AuthContext

```js
const { user, token, loading, login, logout } = useAuth();
// user    — { id, name, email, role } or null
// token   — raw JWT string or null
// loading — true while validating stored token on app mount
// login(token, user)  — store to localStorage + setState
// logout()            — clear localStorage + user = null
```

**On mount (page reload handling):**
```
1. Read 'mc_token' from localStorage
2. If found → GET /api/auth/me to validate
3. If 200: setUser(data.user) — session restored
4. If 401: removeToken()    — session expired, show login
5. setLoading(false) — ProtectedRoute can now make decisions
```

### ThemeContext

```js
const { theme, toggleTheme } = useTheme();
// theme — 'dark' or 'light'
// toggleTheme() — flip theme, sync to <html> class + localStorage
```

**Synchronization chain:**
```
User clicks sun/moon in Navbar
  → toggleTheme()
  → setTheme(newTheme)
  → useEffect:
      document.documentElement.classList.toggle('dark')
      localStorage.setItem('mc_theme', newTheme)
  → Tailwind dark: variants activate/deactivate globally
```

---

## 16. Dark Mode System

Uses **Tailwind's class-based dark mode** (`darkMode: 'class'`).

When `dark` class is on `<html>`, all `dark:` Tailwind classes activate:
```html
<div class="bg-white dark:bg-black text-gray-900 dark:text-white">
```

The design-system classes in `index.css` encapsulate both modes:
```css
.card {
  @apply bg-white border border-gray-200 rounded-xl p-6
         dark:bg-gray-950 dark:border-gray-800;
}
```
Pages use `.card` and get dark mode for free.

### Anti-FOUC Script

`index.html` runs this **before React loads**:
```html
<script>
  (function () {
    const stored = localStorage.getItem('mc_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```
Result: zero flash of wrong theme on page load, even on first visit.

---

## 17. Role-Based Access Control

### Backend — middleware chain

```js
// Every protected route:
router.post('/', authenticate, requireRole('student'), handler);
router.get('/mentor/bookings', authenticate, requireRole('mentor'), handler);
router.patch('/approve', authenticate, requireRole('admin'), handler);

// Extra check for mentor availability:
router.post('/availability',
  authenticate,
  requireRole('mentor'),
  requireApprovedMentor,  // applicationStatus must be 'APPROVED'
  handler
);
```

- `authenticate` returns **401** if token is missing/invalid
- `requireRole()` returns **403** if role doesn't match (user is authenticated, just not permitted)
- Admin accounts **cannot be created via API** — only via `npm run seed`

### Frontend — ProtectedRoute

```
loading?       → show <PageSpinner /> (prevents flash redirect)
!user?         → <Navigate to="/login" state={{ from: location }} />
wrong role?    → <Navigate to={ROLE_HOME[user.role]} />
correct role?  → render children
```

**Post-login redirect:**
```js
// Login.jsx reads where the user was trying to go
const from = location.state?.from?.pathname || ROLE_HOME[user.role];
navigate(from, { replace: true });
```

---

## 18. The Complete User Journey — Step by Step

### New Mentor applying
```
1. /register → select "Mentor" tab
2. Fill: name, email, password, title, expertise, years, bio, duration
3. POST /api/auth/register
4. Backend: hash password → create User + MentorProfile (PENDING)
5. Return JWT → frontend stores token → navigate to /mentor/dashboard
6. Dashboard shows "Application Under Review"
```

### Admin approving a mentor
```
1. Admin logs in → /admin/applications
2. GET /api/admin/mentor-applications → 2 PENDING applications shown
3. Click "Approve" → PATCH /api/admin/mentor-applications/:id/approve
4. Backend: MentorProfile.applicationStatus = 'APPROVED'
5. Mentor can now access /mentor/availability
```

### Mentor setting availability
```
1. /mentor/availability → click "+ Add Rule"
2. Fill: day=Monday, start=09:00, end=12:00
3. POST /api/mentor/availability
4. Backend: check no overlap → save rule → generateSlots(rule, 10)
5. Response: "Availability rule created. 2 slot(s) generated."
6. UI refreshes rule list
```

### Student booking a session
```
1. /mentors → see mentor cards (GET /api/mentors)
2. Click "View Profile" → /mentors/:id
3. GET /api/mentors/:id/slots → see time slot buttons
4. Click a slot → confirmation panel appears
5. Click "Confirm Booking"
6. POST /api/bookings { mentorId, slotId }
7. Backend: validate → hasStudentConflict? → findOneAndUpdate (atomic claim)
8. Slot removed from UI → success message shown
```

### Student leaving a review
```
1. Session ends → on next bookings fetch, lazy completion fires
2. /my-bookings → "Past" tab → COMPLETED booking shows "Leave Review"
3. Click → modal opens with 5-star selector + optional text
4. POST /api/reviews { bookingId, rating, feedback }
5. Backend: verify COMPLETED + not already reviewed
6. Create Review → re-aggregate mentor's average rating
7. Rating updates on mentor's profile card
```

---

## 19. Error Handling Strategy

### Backend

`errorHandler.js` maps error types to HTTP status codes:

| Error type | Status | Example |
|---|---|---|
| `mongoose.ValidationError` | 400 | Required field missing |
| `mongoose.CastError` | 400 | Invalid ObjectId format |
| MongoDB duplicate key (11000) | 409 | Email already exists |
| Custom `err.statusCode` | As set | 409 slot taken, 403 wrong role |
| Everything else | 500 | Unexpected crash |

```js
// Throwing a custom error in a handler:
const err = new Error('This slot is no longer available.');
err.statusCode = 409;
throw err;  // caught by errorHandler
```

### Frontend

Axios interceptor normalizes all errors to a plain `Error` with a readable message:
```js
error => {
  const message = error.response?.data?.message || error.message;
  return Promise.reject(new Error(message));
}
```

Every page:
```js
try {
  const data = await someApi.call();
  setData(data);
} catch (err) {
  setError(err.message);  // always a clean string
}
// Rendered as:
{error && <Alert type="error">{error}</Alert>}
```

---

## 20. npm Scripts Reference

Run all commands from the **project root** (`mentorconnect/`):

| Command | What it does |
|---|---|
| `npm install` | Installs all deps for backend AND frontend (npm workspaces) |
| `npm run seed` | Creates admin + 2 demo mentors + 1 demo student in Atlas |
| `npm run dev` | Runs backend (nodemon :5000) + frontend (Vite :5173) concurrently |
| `npm run build` | Vite builds frontend → `frontend/dist/` |
| `npm start` | `npm run build` then Express serves everything on :5000 |

### Demo credentials (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@mentorconnect.local` | value of `ADMIN_SEED_PASSWORD` in .env |
| Mentor | `priya.mentor@demo.com` | `Demo@123456` |
| Mentor | `arjun.mentor@demo.com` | `Demo@123456` |
| Student | `student@demo.com` | `Demo@123456` |

---

*This document is the complete technical reference for MentorConnect. Every connection, design decision, algorithm, and data flow is documented above.*
