const crypto = require("crypto");

// 6-digit numeric OTP, e.g. "042917"
function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

// We never store the raw OTP in the database, only its hash - same
// principle as password hashing.
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function isOtpValid(otp, hash) {
  return hashOtp(otp) === hash;
}

module.exports = { generateOtp, hashOtp, isOtpValid };
