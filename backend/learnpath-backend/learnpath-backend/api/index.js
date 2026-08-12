require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const serverless = require("serverless-http");

const { withConnection, oracledb } = require("../lib/db");
const { requireAuth } = require("../lib/auth-middleware");

const app = express();

app.use(cors());
app.use(express.json());

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d";

function signToken(user) {
  return jwt.sign(
    { id: user.ID, email: user.EMAIL, name: user.NAME },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- Health check -----------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "learnpath-backend" });
});

// --- Signup -------------------------------------------------------------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please fill all fields." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await withConnection(async (connection) => {
      // Check for an existing account first for a clean error message.
      const existing = await connection.execute(
        `SELECT id FROM users WHERE LOWER(email) = :email`,
        { email }
      );
      if (existing.rows.length > 0) {
        const err = new Error("An account with this email already exists.");
        err.statusCode = 409;
        throw err;
      }

      const result = await connection.execute(
        `INSERT INTO users (name, email, password_hash)
         VALUES (:name, :email, :passwordHash)
         RETURNING id, name, email INTO :id, :outName, :outEmail`,
        {
          name,
          email,
          passwordHash,
          id: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
          outName: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
          outEmail: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        },
        { autoCommit: true }
      );

      return {
        ID: result.outBinds.id[0],
        NAME: result.outBinds.outName[0],
        EMAIL: result.outBinds.outEmail[0],
      };
    });

    const token = signToken(user);
    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: { id: user.ID, name: user.NAME, email: user.EMAIL },
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Signup error:", err);
    res.status(500).json({ error: "Something went wrong creating your account." });
  }
});

// --- Login ----------------------------------------------------------------
app.post("/api/auth/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    const user = await withConnection(async (connection) => {
      const result = await connection.execute(
        `SELECT id, name, email, password_hash
         FROM users
         WHERE LOWER(email) = :email`,
        { email }
      );
      return result.rows[0] || null;
    });

    if (!user) {
      return res.status(401).json({ error: "No account found. Please create an account first." });
    }

    const passwordMatches = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const token = signToken(user);
    res.json({
      message: "Login successful!",
      token,
      user: { id: user.ID, name: user.NAME, email: user.EMAIL },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong logging you in." });
  }
});

// --- Current user (example protected route) -------------------------------
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// 404 fallback for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found." });
});

module.exports = app;
module.exports.handler = serverless(app);
