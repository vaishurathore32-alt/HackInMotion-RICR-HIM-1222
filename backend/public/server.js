require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("../routes/authRoutes");
const { initPool, closePool } = require("../config/db");
const { startCleanupJob } = require("../jobs/cleanupPendingUsers");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve the frontend (index.html / script.js / style.css) so it and the
// API share the same origin — that's what lets script.js's relative
// API_BASE = "/api" work with no extra config on localhost.
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api/auth", require('../routes/authRoutes'));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

let cleanupHandle;

async function start() {
  try {
    await initPool();
    // Sweeps out unverified signup attempts once their OTP has expired.
    cleanupHandle = startCleanupJob();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

process.on("SIGINT", async () => {
  if (cleanupHandle) clearInterval(cleanupHandle);
  await closePool();
  process.exit(0);
});