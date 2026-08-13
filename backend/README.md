# Learnpath AI — Backend (Express + Oracle DB, localhost, no Docker)

Plain Node.js/Express API for the Learnpath AI auth screen, talking directly
to a local Oracle Database. No containers involved.

## 1. Prerequisites

- **Node.js** 18+ installed.
- **Oracle Database** already installed and running on your machine
  (Oracle XE is the free, easy option: https://www.oracle.com/database/technologies/xe-downloads.html).
- A DB user/schema you can connect to (create one, or use an existing one).

> Note: `node-oracledb` v6 runs in **thin mode** by default — it's pure
> JavaScript, so you do **not** need to separately install Oracle Instant
> Client for normal (non-TLS, non-advanced-feature) connections. Just
> `npm install` and go.

## 2. Create the schema

Connect to your Oracle DB as the user in `.env` (e.g. via SQL*Plus or
SQL Developer) and run:

```
db/schema.sql
```

This creates a single `users` table (id, name, email, password hash,
created_at).

## 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
DB_USER=learnpath_user
DB_PASSWORD=your_db_password
DB_CONNECT_STRING=localhost:1521/XEPDB1
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

`DB_CONNECT_STRING` format is `host:port/service_name`. For Oracle XE the
default service name is usually `XEPDB1` (or `XE` for older versions) —
check `lsnrctl status` if unsure.

## 4. Install and run

```bash
npm install
npm run dev      # nodemon, auto-restarts on changes
# or
npm start        # plain node
```

You should see:

```
Oracle DB connection pool created
Server running on http://localhost:5000
```

## 5. Open the app

Visit **http://localhost:5000** in your browser. The server serves the
frontend (`public/index.html`, `script.js`, `style.css` — copies of your
uploaded files) from the same origin as the API, so `script.js`'s
`API_BASE = "/api"` works with zero changes.

If you'd rather run the frontend separately (e.g. Live Server on another
port), change `API_BASE` in `script.js` to `http://localhost:5000/api` —
otherwise its relative `/api` calls will hit the wrong origin and fail
with a CORS or 404 error.

## API

| Method | Endpoint          | Body                          | Notes                     |
|--------|-------------------|--------------------------------|----------------------------|
| POST   | `/api/auth/signup`| `{ name, email, password }`   | Creates user, returns JWT |
| POST   | `/api/auth/login` | `{ email, password }`         | Returns JWT                |
| GET    | `/api/auth/me`    | —                               | Requires `Authorization: Bearer <token>` |
| GET    | `/api/health`     | —                               | Health check                |

Passwords are hashed with bcrypt before storage; the DB never sees or
stores plaintext passwords. Tokens are signed JWTs, valid for
`JWT_EXPIRES_IN` (default 7 days).

## Project structure

```
learnpath-backend/
├── config/db.js              # Oracle connection pool
├── controllers/authController.js
├── middleware/authMiddleware.js
├── routes/authRoutes.js
├── db/schema.sql             # run once against your DB
├── public/                   # your frontend, served statically
├── server.js
├── .env.example
└── package.json
```
