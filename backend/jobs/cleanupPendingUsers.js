const { getConnection } = require("../config/db");

// Safety-net sweep: removes any signup attempt sitting in pending_users
// whose OTP has already expired without being verified (e.g. the user
// never came back to enter it, or entered it wrong and gave up).
async function cleanupExpiredPendingUsers() {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `DELETE FROM pending_users WHERE otp_expires_at < SYSTIMESTAMP`
    );
    if (result.rowsAffected > 0) {
      console.log(`Cleanup: removed ${result.rowsAffected} expired pending signup(s).`);
    }
  } catch (err) {
    console.error("Cleanup job error:", err);
  } finally {
    if (connection) await connection.close();
  }
}

// Runs once at startup, then repeats every OTP_CLEANUP_INTERVAL_MINUTES
// (default 5). Returns the interval handle so the caller can clear it
// on shutdown.
function startCleanupJob() {
  const intervalMinutes = Number(process.env.OTP_CLEANUP_INTERVAL_MINUTES) || 5;
  const intervalMs = intervalMinutes * 60 * 1000;

  cleanupExpiredPendingUsers();
  return setInterval(cleanupExpiredPendingUsers, intervalMs);
}

module.exports = { startCleanupJob, cleanupExpiredPendingUsers };
