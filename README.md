# SkillShare

SkillShare is a **local services marketplace** where people find trusted help nearby and others offer what they're good at.

Users can browse services offered by local providers (by category and proximity), request/hire a service, track the job through its lifecycle, pay online in Razorpay Test Mode, and leave ratings and reviews once a job is complete.

The project is split into two applications:

| App | Stack | Purpose |
|---|---|---|
| `backend/` | Node.js, Express, MongoDB | REST API, authentication, payments, Socket.io |
| `frontend/` | Next.js (Pages Router), React, TypeScript | Client-facing web app |

---

## Key Features

- **Service discovery** — browse nearby services by category and search term; results show real provider, price, and distance data.
- **Offer a service** — providers publish a service (title, description, category, price, contact info); listings are geo-linked to the provider's location.
- **Hiring flow** — a client requests a job on a service; the provider accepts, starts, and completes it; both sides can track the status.
- **Job state machine** — `requested → accepted → in_progress → completed`, with cancellation and payment transitions enforced server-side.
- **Email/password authentication** — bcrypt-hashed passwords with Zod validation and per-endpoint rate limiting.
- **Google Sign-In** — ID-token verification via Google's OAuth libraries (verified email required).
- **Access + refresh tokens** — short-lived access token with silent refresh and `tokenVersion`-based revocation (logout-everywhere, password reset).
- **Password reset** — time-limited reset link sent by email.
- **Payments (Razorpay Test Mode)** — orders are created and verified on the server; the client never supplies an amount and signatures are checked server-side.
- **Reviews & ratings** — the client of a completed/paid job can rate it once; the service's average rating updates automatically.
- **Location-aware search** — MongoDB geospatial queries return services near the user; location is *optional* during registration.
- **Real-time sockets** — Socket.io server with JWT-authenticated connections; users can only join their own room.

---

## User Flows

### Client

```text
Browse services
    → View a service
    → Request service (create job)
    → Provider accepts
    → Job starts (provider marks in_progress)
    → Pay via Razorpay (test mode)
    → Provider completes the job
    → Leave a review
```

### Provider

```text
Offer a service (publish)
    → Receive a job request
    → Accept
    → Start work (in_progress)
    → Complete the job
```

### Job status visibility

Both parties see their jobs on the **My Jobs** page with the single next action available to them (accept / start / complete / pay / cancel), depending on their role and the job state.

---

## Technology Stack

Versions below are the ranges declared in each `package.json`.

### Frontend (`frontend/package.json`)

| Technology | Version | Notes |
|---|---|---|
| Next.js | `^16.1.3` | Pages Router (`src/pages`) |
| React | `19.1.0` | with `react-dom` |
| TypeScript | `^5` | strict |
| @react-oauth/google | `^0.12.1` | Google Sign-In button |
| Styling | — | CSS Modules (`*.module.css`) + a global stylesheet |

### Backend (`backend/package.json`)

| Technology | Version | Purpose |
|---|---|---|
| Node.js / Express | `^4.19.2` | HTTP API |
| MongoDB / Mongoose | `^8.2.0` | Database + ODM (geospatial & text indexes) |
| jsonwebtoken | `^9.0.2` | Access & refresh JWTs |
| bcryptjs | `^2.4.3` | Password hashing |
| zod | `^4.4.3` | Request validation |
| google-auth-library | `^9.14.0` | Google ID-token verification |
| razorpay | `^2.9.4` | Razorpay orders & reconciliation |
| nodemailer | `^6.10.1` | Password-reset emails (Gmail SMTP) |
| socket.io | `^4.8.3` | Authenticated real-time events |
| express-rate-limit | `^8.5.2` | Brute-force / abuse protection |
| dotenv / cors | — | Env loading, CORS |

---

## Architecture

```text
Frontend (Next.js, src/pages)
    │  fetch via src/lib/api.ts (Bearer token, silent refresh on 401)
    ▼
REST API  /api/...   (Express, rate-limited)
    │
    ├── Routes → Controllers
    │       │
    │       ├── authMiddleware (protect) — verifies JWT + tokenVersion
    │       └── validation (Zod schemas)
    │       ▼
    └── MongoDB via Mongoose models (User, Service, Job, Payment, Review)

Socket.io (server.js) — JWT-authenticated handshake,
    users may only join their own user_<id> room
```

- **Request pipeline:** every `/api/*` request passes a global rate limiter; protected routes then run `authMiddleware.protect`, which verifies the access-token JWT (signature, user existence, `tokenVersion`). Handlers validate the body with Zod before touching the database.
- **Auth flow:** the backend issues a 1-hour access token and a 30-day refresh token. The frontend stores them in `localStorage`, sends `Authorization: Bearer <token>`, and on a `401` automatically calls `/api/auth/refresh-token` once and retries the original request. If refresh fails, the user is redirected to `/login`.
- **Payment flow:** the frontend never computes amounts or verifies signatures. It asks the backend to create a Razorpay order, opens the Razorpay Checkout, then returns the result for **server-side signature verification** (see [Payments](#payments-razorpay-test-mode)).
- **Socket flow:** connections authenticate with the same JWT at handshake time; the socket identity is fixed at connection, so room joins are restricted to the authenticated user's own room. Controllers emit targeted events (`newJobRequest`, `jobUpdate`) to the relevant `user_<id>` rooms.

---

## Repository Structure

```text
SkillShare/
├── backend/                      # Express + MongoDB API
│   ├── config/
│   │   └── db.js                 # Mongoose connection
│   ├── controllers/              # Route handlers
│   │   ├── authController.js     # register/login/Google/reset/refresh
│   │   ├── serviceController.js  # service CRUD + geo search
│   │   ├── jobController.js      # hire + status state machine
│   │   ├── paymentController.js  # Razorpay order/verify/status
│   │   └── reviewController.js   # reviews + service rating sync
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT `protect`
│   │   ├── rateLimiter.js        # per-endpoint + global limits
│   │   └── validation.js         # Zod schemas
│   ├── models/
│   │   ├── User.js               # provider/client accounts
│   │   ├── Service.js            # marketplace listings
│   │   ├── Job.js                # hire lifecycle + state machine
│   │   ├── Payment.js            # Razorpay order/payment records
│   │   └── Review.js             # ratings + comments
│   ├── routes/                   # Express routers (1 per domain)
│   ├── server.js                 # Entry point (Express + Socket.io + env check)
│   └── package.json
│
├── frontend/                     # Next.js app (Pages Router)
│   ├── public/                   # static assets
│   └── src/
│       ├── components/           # Navbar, Toast, Skeleton, ConfirmDialog
│       ├── context/
│       │   └── AuthContext.tsx   # auth state + token storage
│       ├── lib/
│       │   └── api.ts            # fetch client (base URL, refresh on 401)
│       ├── pages/                # routes: index, browse, services/[id],
│       │                         #   post-service, my-services, my-jobs,
│       │                         #   profile, login, register, ...
│       └── styles/               # CSS Modules
│
├── .gitignore
└── README.md
```

---

## Data Models

### User
An account is either a **client**, a **provider**, or both — there is no role split; anyone can offer services and hire others.
Key fields: `name`, `email` (unique), hashed `password` (absent for pure Google accounts), `googleId`, `avatar`, `authProvider` (`local` | `google`), optional GeoJSON `location`, `tokenVersion` (token revocation), password-reset fields.

### Service
A marketplace listing created by a **provider**.
Key fields: `title`, `description`, `category` (`Education`, `Repair`, `Health & Fitness`, `Tech Help`, `Other`), `price` (INR), `currency`, `contactInfo`, `provider` (ref → User), optional GeoJSON `location` + `address`, denormalized `averageRating` / `totalReviews`, and `isActive` — a soft-delete flag. Removing a service sets `isActive: false`; jobs already referencing it remain valid.

### Job
A hiring request between a **client** (who requests) and a **provider** (who owns the service). A Job snapshots `price`/`currency` from the service at hire time and keeps two independent fields:
- `status` — the workflow state machine (below), and
- `paymentStatus` — `pending` | `succeeded` | `failed` | `refunded`.

It also records `razorpayOrderId` and a `statusHistory` audit trail (from/to/changedBy/changedAt) for every transition.

### Payment
Records each Razorpay order created for a Job: `orderId` (unique), `paymentId` and `signature` (stored only after successful server-side verification), `amount` in the smallest currency unit (paise for INR, computed server-side from the Job), and a `status` (`created` → `succeeded` | `failed` | `cancelled`).

### Review
A rating (1–5) and optional comment left by the **client** about the **provider** for a completed/paid job. One review per job per reviewer (unique index); each review refreshes the service's `averageRating` and `totalReviews`.

---

## Job Lifecycle

The workflow `status` is a state machine enforced in the Job model and guarded by role checks in the controller:

```text
requested ──→ accepted ──→ in_progress ──→ completed ──→ paid
    │            │              │
    └─────┬──────┴──────────────┘
          ▼
      cancelled
```

- `requested` → **client** requested the service. Provider may **accept** or either party may **cancel**.
- `accepted` → provider agreed; provider may **start work** (`in_progress`) or either party may **cancel**.
- `in_progress` → provider marks the job **completed**; either party may **cancel**.
- `completed` → work is done.
- `paid` → reached **only** through successful server-verified payment (never via the status endpoint).
- `cancelled` and `paid` are terminal states.

Role rules: only the **client** creates jobs; nobody can hire themselves; duplicate active requests for the same client + service are rejected; only the **provider** can accept/start/complete; only the job's client or provider can change status; invalid transitions are rejected; a soft-deleted service cannot be hired.

**Payment is deliberately separate from job status.** A job can be `completed` before it is `paid` (pay-on-completion), and `paymentStatus` tracks the money side independently. Manual status updates can never set `paid`.

---

## Payments (Razorpay Test Mode)

The app integrates **Razorpay in Test Mode only** — no live charge is possible with test keys.

1. The client opens a payable Job (accepted or completed) on **My Jobs** and clicks **Pay**.
2. The frontend calls `POST /api/payment/create-order` with only the `jobId`.
3. The backend loads the Job from MongoDB, verifies the caller is the job's client, confirms the job has not been paid and is eligible to move to `paid`, and **derives the amount server-side** (`price × 100` → paise, INR). It never trusts an amount from the client.
4. A Razorpay order is created (`razorpay.orders.create`), the order ID is stored on the Job and in a `Payment` record, and the response (order id, amount, currency, public key id) goes back to the client.
5. The frontend opens **Razorpay Checkout** with the order id and the public key.
6. After the checkout, the frontend sends `{ orderId, paymentId, signature }` to `POST /api/payment/verify`.
7. The backend recomputes the expected HMAC-SHA256 signature over `orderId|paymentId` with `RAZORPAY_KEY_SECRET` and compares it with a timing-safe comparison. Verification happens **on the server only**.
8. On success the `Payment` is marked `succeeded`, the Job's `paymentStatus` becomes `succeeded`, and the job transitions through the state machine to `paid` (only if `paid` is a legal transition). The flow is idempotent — an already-paid job returns success without reprocessing.
9. Cancelled/failed checkouts are reported to `POST /api/payment/status`; the server reconciles with Razorpay's authoritative order status (`CREATED`/`ATTEMPTED`/`PAID`) before recording `failed`/`cancelled`, and never downgrades a succeeded payment.

> **Test mode:** keys look like `rzp_test_...` and no real money moves. Going live requires Razorpay live credentials and is not configured in this codebase.

---

## Authentication

- **Email/password** — `POST /api/auth/register` and `/api/auth/login`. Passwords are hashed with bcrypt; login and registration are rate-limited.
- **Google Sign-In** — the frontend obtains a Google ID-token (`@react-oauth/google`) and sends it to `POST /api/auth/google`. The backend verifies the token's signature and audience, rejects accounts with unverified emails, and creates the user — or, if the email already exists as a password account, links the `googleId` **without** switching the account to Google-only, so password login keeps working.
- **Tokens** — login/register/Google return an **access token** (1 h) and a **refresh token** (30 d). Refresh tokens carry a `type: 'refresh'` claim and can only be exchanged via `POST /api/auth/refresh-token` for a new access token.
- **Revocation** — each user has a `tokenVersion`. Password resets and `POST /api/auth/logout-everywhere` increment it, invalidating every outstanding token. The REST `protect` middleware and the Socket.io handshake both check it.
- **Password reset** — `POST /api/auth/forgot-password` emails a hashed, 10-minute reset link (Gmail SMTP via Nodemailer); `POST /api/auth/reset-password` applies the new password and revokes old tokens.
- **Authorization** — protected endpoints (`Authorization: Bearer <token>`) verify the user, and controllers enforce ownership/role rules (e.g. only the job's client can pay, only its provider can accept).
- **Logout** — the frontend discards tokens locally; `logout-everywhere` also invalidates them server-side.

Tokens are stored in `localStorage` by the frontend for simplicity — this means any XSS in the browser could read them; keep this in mind and treat the client as untrusted (the backend never relies on client assertions for authorization).

---

## Location

- **Registration** asks the browser for geolocation, but location is **optional** — users can create an account without granting permission.
- Providers store a GeoJSON point when they register with a location; **service creation copies the provider's location** onto the Service so listings are geo-searchable.
- **Browse** requests the browser's location, then calls `GET /api/services?lat=...&lon=...&radius=...`; the backend runs a MongoDB `$geoWithin` query over providers and returns their active services. If geolocation is unavailable or denied, the frontend falls back to a default location (Delhi, India).
- Distances shown on service cards are computed client-side (haversine) from the service's real coordinates.
- Geolocation/permission changes after registration are not currently re-synced (see Limitations).

---

## API Reference

All routes are mounted under `/api`. `🔒` = requires `Authorization: Bearer <access token>`.

### Authentication — `/api/auth`

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account (location optional) |
| POST | `/api/auth/login` | — | Log in with email + password |
| POST | `/api/auth/google` | — | Log in / link with Google ID token |
| POST | `/api/auth/forgot-password` | — | Email a password-reset link |
| POST | `/api/auth/reset-password` | — | Set a new password with the reset token |
| POST | `/api/auth/refresh-token` | — | Exchange a refresh token for a new access token |
| POST | `/api/auth/logout-everywhere` | 🔒 | Revoke all of the user's tokens |
| GET | `/api/auth/me` | 🔒 | Current user profile |
| PUT | `/api/auth/update-profile` | 🔒 | Update profile (name) |

### Services — `/api/services`

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/services?lat=&lon=&radius=` | — | Nearby active services (km radius) |
| GET | `/api/services/my` | 🔒 | Current user's services |
| GET | `/api/services/:id` | — | Single active service |
| POST | `/api/services` | 🔒 | Publish a service |
| DELETE | `/api/services/:id` | 🔒 | Soft-delete own service (`isActive: false`) |

### Jobs — `/api/jobs`

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/jobs/hire` | 🔒 | Client requests a job on a service |
| GET | `/api/jobs/myjobs?page=&limit=&status=` | 🔒 | Jobs where the user is client or provider |
| PATCH | `/api/jobs/:id/status` | 🔒 | Transition job status (state-machine enforced; `paid` rejected) |

### Payments — `/api/payment`

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/payment/create-order` | 🔒 | Create a Razorpay order (client only, amount from DB) |
| POST | `/api/payment/verify` | 🔒 | Verify signature server-side, mark paid |
| POST | `/api/payment/status` | 🔒 | Record cancelled/failed checkout (server-reconciled) |

### Reviews — `/api/reviews`

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/reviews` | 🔒 | Client reviews a completed/paid job (once) |
| GET | `/api/reviews/provider/:providerId` | — | Reviews + average for a provider |
| GET | `/api/reviews/service/:serviceId` | — | Reviews + average for a service |

### Health

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Uptime/status probe |
| GET | `/` | API banner |

---

## Environment Variables

Never commit real `.env` files. Create them from the tables below with placeholder values.

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | ✅ | JWT signing secret — **at least 32 characters** (startup enforces) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID (Web app) |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay **test mode** key id (`rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay **test mode** key secret — server only, never expose |
| `EMAIL_USER` | for reset email | Gmail address used to send password-reset mail |
| `EMAIL_PASS` | for reset email | Gmail app password (not your account password) |
| `FRONTEND_URL` | optional | Frontend origin for reset links (default `http://localhost:3000`) |
| `ALLOWED_ORIGINS` | optional | Comma-separated CORS origins (default `http://localhost:3000`) |
| `VERCEL_PROJECT_NAME` | optional | If set, also allows CORS from this Vercel project's `*.vercel.app` preview origins |
| `PORT` | optional | API port (default `5000`) |
| `NODE_ENV` | optional | `development` / `production` |

The server fails fast at startup if any of the five required variables is missing.

### Frontend — `frontend/.env.local`

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_API_URL` | ✅ | Backend base URL (default `http://localhost:5000`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | for Google login | Google OAuth client ID (same as backend) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | for payments | Razorpay **test mode** key id (`rzp_test_...`) |

Only public values go to the frontend; `RAZORPAY_KEY_SECRET` never leaves the backend.

---

## Local Development

### Prerequisites

- **Node.js 20+** (recent LTS recommended)
- **MongoDB** — a local instance or a free MongoDB Atlas cluster
- A **Razorpay test-mode account** (dashboard keys `rzp_test_...`)
- (For Google login) a **Google Cloud OAuth 2.0 Client ID** for web applications
- (For password-reset emails) a **Gmail address with an app password**

### Clone

```bash
git clone https://github.com/svmbhardwaj/Skill-Share.git
cd SkillShare
```

### 1. Backend

```bash
cd backend
npm install
# create backend/.env using the placeholder values in the
# "Environment Variables → Backend" table above (required vars: MONGO_URI,
# JWT_SECRET, GOOGLE_CLIENT_ID, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
npm run dev               # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
# create frontend/.env.local using the placeholder values in the
# "Environment Variables → Frontend" table above (at minimum
# NEXT_PUBLIC_BACKEND_API_URL, plus the Google / Razorpay public keys you use)
npm run dev                  # http://localhost:3000
```

### Google authentication setup

1. In the Google Cloud Console, create an OAuth 2.0 **Client ID** of type *Web application*.
2. Add your frontend origin (e.g. `http://localhost:3000`) to **Authorized JavaScript origins**.
3. Put the same client ID in `GOOGLE_CLIENT_ID` (backend) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend).

### Password-reset email setup

Gmail SMTP requires an [app password](https://support.google.com/accounts/answer/185833): enable 2-step verification on the sending Gmail account, create an app password, and put it in `EMAIL_PASS` with the address in `EMAIL_USER`. Without these, the reset-email endpoint returns an error (the rest of the app works normally).

### Razorpay test mode setup

1. Create a free Razorpay account and open the **Test Mode** keys from the dashboard.
2. Put `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`, and `RAZORPAY_KEY_ID` (public key) in `frontend/.env.local`.
3. In test mode, Razorpay Checkout shows a success/failure simulator — use the provided test card details to complete a payment. No real money moves.

---

## Commands

### Backend

```bash
cd backend
npm run dev      # start with nodemon (auto-reload)
npm start        # start with plain node
```

### Frontend

```bash
cd frontend
npm run dev      # development server (Next.js)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```

There are no automated tests in the repository at this time.

---

## Security Notes

- All secrets live in environment variables — never commit `.env` files (both `.gitignore` files already exclude them).
- `RAZORPAY_KEY_SECRET` and `JWT_SECRET` are used **only server-side**; the frontend only ever receives the public Razorpay key id.
- The backend is the source of truth for authorization and money amounts: it derives payment amounts from the stored Job and re-verifies Razorpay signatures instead of trusting the client.
- Auth endpoints are rate-limited (login, registration, forgot-password) and the whole API sits behind a general limiter.
- Passwords are hashed with bcrypt; tokens carry a `tokenVersion` so password changes and "logout everywhere" revoke them.
- Socket connections are authenticated at handshake time and can only join the authenticated user's own room.

---

## Test Mode Payment Notes

- The codebase is wired for **Razorpay Test Mode only** — it expects `rzp_test_...` keys.
- Use the Razorpay test card/success simulator to verify payments during development; **no real charges occur**.
- Going live requires replacing the test keys with live keys from your own Razorpay account and is a deployment decision, not something this repo does by default.
- Never publish or commit real key values; only the public key id belongs in the frontend.

---

## Known Limitations

- **No provider payouts** — payments flow into the Razorpay account configured by the merchant; there is no escrow/disbursement system that pays providers automatically.
- **Production (live) payments are not configured** — Razorpay runs in test mode only.
- **No automated tests** are included yet (no test runner is configured).
- **Real-time events are server-side only** — the backend emits Socket.io events, but the current frontend does not ship a socket client, so pages reflect updates on load/refresh rather than via live push.
- **Ratings appear only after real reviews exist** — service cards show an average rating only once the service has at least one review; until then no rating is displayed.
- **Profile location is set at registration** — moving to a new area isn't re-synced through the UI, so geo-search reflects the location stored at sign-up.
- **Password reset email needs a Gmail app password** — without `EMAIL_USER`/`EMAIL_PASS`, the forgot-password endpoint returns an error.
- **Tokens are stored in `localStorage`** — a pragmatic choice that keeps the client simple but is XSS-readable (the server stays authoritative regardless).

---

## Future Improvements

These are **not implemented** and are listed only as possible next steps:

- Provider payout / settlement flow.
- Live-mode Razorpay configuration for production.
- A frontend socket client for live job/payment notifications.
- Automated tests for the state machine, auth, and payment verification.
- Re-syncable user location and a per-service service area.
- Message/chat between client and provider.

---

## Product Overview

SkillShare is designed to answer two questions on the homepage: *"I need someone to help me"* and *"I can offer this service."* Clients land on the **Browse** page, filter by category and proximity, open a service, and request it with one action; providers publish a service in a few minutes and receive requests they can accept, track, and complete. Every step — hire, status changes, payment, completion, review — is explicit and visible to both parties, keeping the relationship between a local client and provider transparent from first request to final rating.
