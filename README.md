# MentorConnect

A full-stack mentor approval, availability, and session-booking platform.  
**Stack:** React (Vite) + Node.js/Express + MongoDB Atlas | JWT Auth | Tailwind CSS

---

## Quick Start

### One-time setup
1. **Create a MongoDB Atlas cluster** (see [MongoDB Atlas Setup](#mongodb-atlas-setup) below).
2. Copy `.env.example` to `.env` at the project root and fill in your values.
3. From the project root (never `cd` into a subfolder):
   ```bash
   npm install        # installs all dependencies for both backend and frontend
   npm run seed       # creates the admin account and demo accounts
   ```

### Daily development
```bash
npm run dev    # starts Express backend (nodemon) + Vite frontend concurrently, hot reload on both
```

### Production demo
```bash
npm start      # builds the React frontend, then starts Express serving everything on one port
```

---

## Environment Variables (`.env` at project root)

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default: 5000) |
| `MONGO_URI` | Full MongoDB Atlas connection string including database name (`/mentorconnect`) |
| `JWT_SECRET` | Secret for signing JWTs — use a long random string, never commit the real value |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`, `1h`) |
| `ADMIN_SEED_NAME` | Display name for the seeded admin account |
| `ADMIN_SEED_EMAIL` | Email for the seeded admin account |
| `ADMIN_SEED_PASSWORD` | Password for the seeded admin account |

This is the **only** configuration file. Both the backend and frontend read from it — the backend via `dotenv.config({ path: '../../.env' })` and Vite via its `envDir` config pointing to the project root.

---

## MongoDB Atlas Setup

1. Sign up / log in at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free **M0** cluster.
3. **Database Access** → Add a user (username + password).
4. **Network Access** → Allow from anywhere (`0.0.0.0/0`). ⚠️ See security note below.
5. **Connect → Drivers** → Copy the `mongodb+srv://...` string, replace `<password>`, and append `/mentorconnect` before the `?` parameters.

> **Security simplification:** `0.0.0.0/0` network access is used for this scoped project on a disposable free-tier cluster. In production, restrict to specific IPs.

---

## Architecture & Design Decisions

### 1. Slot Generation Algorithm
Slots are pre-generated from recurring Availability rules (see `utils/slots.js`).

**Why pre-generate?**
- Students need to select and book a specific, identifiable time unit.
- Pre-generating allows each slot to carry a `status` field (`AVAILABLE`/`BOOKED`/`CANCELLED`).
- This makes the atomic double-booking prevention possible — the slot document must exist to be targeted by `findOneAndUpdate`.

**How it works:**
1. Look up the mentor's `preferredSessionDuration` (30 or 60 min) from their profile.
2. For each calendar day from today through `today + daysAhead` (default 10):
   - If the day matches the rule's `dayOfWeek`, slice `[startTime, endTime)` into chunks of `durationMinutes`.
   - For each chunk: create a Slot if one doesn't already exist for that `(mentor, startTime)` pair.
3. The idempotency check (step 3) is done via a single bulk query, not N individual queries.

### 2. Double-Booking Prevention (§7.3)

Two independent layers:

**Layer 1 — Application: atomic `findOneAndUpdate`**
```
Slot.findOneAndUpdate(
  { _id: slotId, status: 'AVAILABLE' },  // Only matches if still AVAILABLE
  { status: 'BOOKED' },
  { new: true }
)
```
Two concurrent requests both see `status: 'AVAILABLE'` in step 6 (fast-fail). When they both reach step 9, exactly one will match the filter and get a document back; the other gets `null` → 409. MongoDB guarantees single-document updates are atomic — no multi-document transaction needed because the race condition only involves one document (the Slot).

**Why not a transaction?**
Multi-document transactions span multiple collections and add latency. The actual race condition here is two requests competing for one Slot document. A `findOneAndUpdate` with the status in the filter resolves this atomically. Transactions would add complexity with no benefit for this specific guarantee.

**Layer 2 — Database: partial unique index on Booking**
```js
bookingSchema.index(
  { slot: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'CANCELLED' } } }
)
```
This is a backstop: if a bug in the application code somehow lets two bookings through, MongoDB rejects the second insert. A partial index is used because cancelled bookings on the same slot (from re-bookings after cancellation) are allowed in the history.

### 3. Availability Update/Delete Regeneration (§7.2)

When an availability rule changes:
- **Past slots** (startTime ≤ now): **never touched**. History is immutable.
- **Future AVAILABLE slots**: **deleted** and regenerated with the new times.
- **Future BOOKED slots**: **left alone**. A student holds that booking — it is not cancelled automatically. The mentor must cancel it manually.

On delete, `isActive = false` is set (soft delete) so historical slots still trace back to a valid rule document for audit.

### 4. Role-Based Authorization

Three roles: `student`, `mentor`, `admin`.

- **`authenticate` middleware**: verifies the JWT signature, checks expiry, and attaches `req.user = { id, name, email, role }` to the request. Never trusts the frontend for role or identity.
- **`requireRole(...roles)` middleware**: compares `req.user.role` against the allowed list. Returns 403 (not 401) because the user is authenticated — they just lack permission.
- **`requireApprovedMentor` middleware**: an additional check on mentor routes that manage availability. A PENDING or REJECTED mentor cannot configure availability even with a valid mentor JWT.
- **Admin accounts**: cannot be self-registered. The only admin is created by `npm run seed` reading credentials from environment variables. This is a deliberate security choice — the operator controls who is admin via deployment config, not via a public endpoint.

---

## Assumptions

1. **Session duration is per-mentor, not per-block.** Set once at application time, applies to all availability rules. Keeps slot generation simple.
2. **All timestamps are UTC.** No timezone conversion UI. Known limitation — a production version would show times in the user's local timezone.
3. **JWT stored in `localStorage`.** Simpler than httpOnly cookies; XSS risk is acknowledged. An httpOnly-cookie approach with CSRF handling would be the production choice.
4. **Both student and mentor can cancel a booking.** The spec only explicitly requires student-side cancellation, but real mentors also need to cancel — this was added deliberately and noted here.
5. **Lazy COMPLETED status.** A `CONFIRMED` booking whose `endTime` has passed is flipped to `COMPLETED` the next time it's read (in list endpoints). No cron job required for this scope. Enhancement path: use `node-cron` or a cloud scheduler to run a background sweep periodically.
6. **Atlas network access `0.0.0.0/0`.** Appropriate for a scoped recruitment project on a free-tier disposable cluster. Not appropriate for production.
7. **No base-URL config needed.** Vite proxies `/api/*` to Express in dev; Express serves the built frontend in prod. Both environments use the same relative `/api/...` calls in the frontend.

---

## Demo Accounts (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@mentorconnect.local` | (set in `ADMIN_SEED_PASSWORD`) |
| Mentor (approved) | `priya.mentor@demo.com` | `Demo@123456` |
| Mentor (approved) | `arjun.mentor@demo.com` | `Demo@123456` |
| Student | `student@demo.com` | `Demo@123456` |

---

## Project Structure

```
mentorconnect/
├── backend/
│   ├── src/
│   │   ├── api/           Route + handler files by resource
│   │   ├── models/        Mongoose schemas
│   │   ├── middleware/     authenticate, requireRole, errorHandler
│   │   ├── utils/         jwt.js, slots.js, conflicts.js
│   │   ├── db.js          Atlas connection
│   │   ├── app.js         Express entry point
│   │   └── seed.js        Admin + demo data seeding
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           Client-side API modules (mirrors backend api/)
│   │   ├── context/       AuthContext.jsx
│   │   ├── components/    Navbar, ProtectedRoute, MentorCard, SlotPicker, BookingCard
│   │   ├── pages/         All page components by route
│   │   ├── App.jsx        Router setup
│   │   └── main.jsx       React entry point
│   ├── vite.config.js     envDir + proxy config
│   └── package.json
├── package.json            Root orchestrator (workspaces + scripts)
├── .env                    Single config file (git-ignored)
├── .env.example            Template
└── README.md
```

---

## Possible Enhancements

- **Cron-based completion**: replace lazy COMPLETED flip with a scheduled `node-cron` job that runs every 15 minutes.
- **Email notifications**: send confirmation/cancellation emails via Nodemailer or SendGrid.
- **Timezone support**: display all times in the user's local timezone using the browser's `Intl` API.
- **Mentor profile editing**: allow approved mentors to update their bio, expertise, etc.
- **Pagination**: add cursor-based pagination to long lists (mentors, bookings).
