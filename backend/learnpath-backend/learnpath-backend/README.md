# Learnpath AI — Backend (Node.js + Express + Oracle DB) on Vercel

Replaces the original `localStorage`-based fake auth with a real signup/login
API backed by an Oracle database, deployable on Vercel.

## Project layout

```
api/index.js          Express app (all routes) — the Vercel serverless function
lib/db.js              Oracle connection pool (Thin mode — no client install needed)
lib/auth-middleware.js JWT auth middleware
sql/schema.sql          Run once against your Oracle DB to create the users table
public/                 Your frontend (index.html, style.css, script.js — updated to call the API)
local-server.js         Runs the same Express app locally with `npm run dev`
vercel.json              Routes /api/* to the function, everything else to /public
.env.example             Copy to .env for local dev
```

## 1. Set up the Oracle database

Any Oracle Database 12.1+ works, including a free **Oracle Autonomous
Database** instance on OCI's Always Free tier.

1. Run `sql/schema.sql` against your database (SQL*Plus, SQLcl, or the OCI
   console's SQL Worksheet if using Autonomous DB).
2. Note your connection details:
   - **Plain Oracle instance**: host, port, service name → becomes
     `ORACLE_CONNECT_STRING=host:port/service_name`.
   - **Autonomous DB (ATP/ADW)**: download the wallet zip from the OCI
     console, unzip it somewhere in the project (e.g. `./wallet`), and use
     the TNS alias from `tnsnames.ora` (e.g. `mydb_high`) as your connect
     string, plus `ORACLE_WALLET_LOCATION` / `ORACLE_WALLET_PASSWORD`.

The backend uses **node-oracledb in Thin mode**, meaning it's pure
JavaScript — no Oracle Instant Client installation required. This matters
because Vercel's serverless functions can't run arbitrary native binaries,
so Thick mode would not work there.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING` (and the
wallet variables if using Autonomous DB), and a random `JWT_SECRET`
(e.g. `openssl rand -hex 32`).

## 3. Run locally

```bash
npm install
npm run dev
```

This serves the API at `http://localhost:3000/api/...`. Open
`public/index.html` in a browser (or serve the `public/` folder with any
static server) — the frontend calls `/api/auth/signup` and
`/api/auth/login` as relative paths, so serve it from the same origin as
the API during local testing, or update `API_BASE` in `public/script.js`.

## 4. Deploy to Vercel

```bash
npm install -g vercel   # if you don't already have it
vercel login
vercel
```

Then set the same environment variables from your `.env` in the Vercel
project dashboard (**Settings → Environment Variables**) for the
Production/Preview/Development environments, and redeploy:

```bash
vercel --prod
```

If you're using an Autonomous DB wallet, commit the wallet folder into the
project (Vercel will bundle it with the function) — just make sure the repo
is private, since the wallet contains credentials-adjacent files.

## API reference

| Method | Path              | Body                          | Notes                          |
|--------|-------------------|--------------------------------|---------------------------------|
| POST   | `/api/auth/signup`| `{ name, email, password }`   | Creates user, returns JWT       |
| POST   | `/api/auth/login` | `{ email, password }`         | Verifies password, returns JWT  |
| GET    | `/api/auth/me`    | —  (`Authorization: Bearer <token>`) | Returns decoded user info |
| GET    | `/api/health`     | —                              | Health check                    |

## Security notes

- Passwords are hashed with bcrypt (10 salt rounds) — never stored in plain text.
- The JWT (`JWT_SECRET`) signs tokens valid for 7 days; adjust `TOKEN_EXPIRY`
  in `api/index.js` as needed.
- Email lookups are case-insensitive (`LOWER(email)`), matching typical login UX.
- CORS is currently open (`cors()` with no options) since the frontend is
  same-origin on Vercel by default — restrict it via
  `cors({ origin: "https://yourdomain.com" })` if you split frontend/backend
  hosting.
