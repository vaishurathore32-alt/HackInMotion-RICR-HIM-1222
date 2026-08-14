// One-time setup script for MongoDB Atlas.
// Run with: node db/init-indexes.js
//
// Creates unique indexes on the "email" field in both collections,
// matching the UNIQUE(email) constraints from the old Oracle schema.

require("dotenv").config();
const { initPool, closePool } = require("../config/db");

async function initIndexes() {
  const db = await initPool();

  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("pending_users").createIndex({ email: 1 }, { unique: true });

  console.log("Indexes created on users.email and pending_users.email");
  await closePool();
}

initIndexes().catch((err) => {
  console.error("Failed to create indexes:", err);
  process.exit(1);
});