const oracledb = require("oracledb");

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

let pool;

async function initPool() {
  if (pool) return pool;

  pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
  });

  console.log("Oracle DB connection pool created");
  return pool;
}

async function getConnection() {
  if (!pool) await initPool();
  return pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close(10);
    pool = null;
    console.log("Oracle DB connection pool closed");
  }
}

module.exports = { initPool, getConnection, closePool };
