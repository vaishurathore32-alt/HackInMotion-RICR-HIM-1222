const oracledb = require("oracledb");

// Return objects as {COLUMN_NAME: value} instead of arrays
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// IMPORTANT: We deliberately do NOT call oracledb.initOracleClient().
// That keeps the driver in "Thin mode" - a pure JavaScript implementation
// that needs no Oracle Instant Client binaries. Vercel's serverless
// functions cannot run native binaries you haven't bundled yourself, so
// Thin mode is what makes this deployable there at all. Thin mode talks
// directly to Oracle Database 12.1+ (also works with Oracle Autonomous DB).

let pool;

/**
 * Lazily creates (once) and returns a connection pool.
 * Serverless functions can be re-invoked in the same warm container,
 * so we cache the pool on the module scope to avoid exhausting
 * connections on every request.
 */
async function getPool() {
  if (pool) return pool;

  const connectString = process.env.ORACLE_CONNECT_STRING;
  if (!connectString) {
    throw new Error(
      "ORACLE_CONNECT_STRING is not set. See .env.example for the format."
    );
  }

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString,
    // Oracle Autonomous DB (ATP/ADW) wallet-based connections:
    // set ORACLE_WALLET_LOCATION and ORACLE_WALLET_PASSWORD instead of
    // relying on a plain host:port/service_name connect string.
    ...(process.env.ORACLE_WALLET_LOCATION && {
      walletLocation: process.env.ORACLE_WALLET_LOCATION,
      walletPassword: process.env.ORACLE_WALLET_PASSWORD,
    }),
    poolMin: 0,
    poolMax: 4,
    poolIncrement: 1,
    poolTimeout: 60,
    // Serverless functions get frozen/thawed; keep connections from
    // going stale silently.
    homogeneous: true,
  });

  return pool;
}

/**
 * Runs `fn(connection)` with a pooled connection and always releases it,
 * even if fn throws.
 */
async function withConnection(fn) {
  const p = await getPool();
  const connection = await p.getConnection();
  try {
    return await fn(connection);
  } finally {
    try {
      await connection.close();
    } catch (err) {
      console.error("Error closing Oracle connection:", err.message);
    }
  }
}

module.exports = { getPool, withConnection, oracledb };
