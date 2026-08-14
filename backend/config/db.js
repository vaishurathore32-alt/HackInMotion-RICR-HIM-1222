const { MongoClient } = require("mongodb");

let client;
let db;

async function initPool() {
  if (db) return db;

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  db = client.db(process.env.MONGODB_DB_NAME || "learnpath");

  console.log("MongoDB Atlas connection established");
  return db;
}

async function getConnection() {
  if (!db) await initPool();
  return db;
}

async function closePool() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB Atlas connection closed");
  }
}

module.exports = { initPool, getConnection, closePool };
