const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const oracledb = require("oracledb");
const { getConnection } = require("../config/db");
const { isEmailReal } = require("../services/emailValidationService");
const { sendOtpEmail } = require("../services/emailService");
const { generateOtp, hashOtp, isOtpValid } = require("../utils/otp");

function generateToken(user) {
  return jwt.sign(
    { id: user.ID, email: user.EMAIL },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function toPublicUser(row) {
  return { id: row.ID, name: row.NAME, email: row.EMAIL };
}

async function signup(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }

  let connection;
  try {
    connection = await getConnection();

    const existing = await connection.execute(
      `SELECT id FROM users WHERE email = :email`,
      { email }
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // Step 1: confirm the address is real and can actually receive mail
    // (AbstractAPI Email Validation & Verification) before doing anything
    // else. Fake/non-existent/undeliverable addresses are rejected here.
    let emailIsReal;
    try {
      emailIsReal = await isEmailReal(email);
    } catch (validationErr) {
      console.error("Email validation error:", validationErr);
      return res.status(502).json({ error: "Couldn't verify that email address right now. Please try again." });
    }

    if (!emailIsReal) {
      return res.status(400).json({
        error: "This email address doesn't appear to exist. Please use a real, deliverable email address.",
      });
    }

    // Step 2: don't create the real account yet. Stage it in
    // pending_users with a hashed OTP, and email the OTP to the user.
    // The account only lands in `users` once verifyOtp() confirms it.
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;

    // Replace any earlier abandoned attempt for this email address.
    await connection.execute(`DELETE FROM pending_users WHERE email = :email`, { email });

    await connection.execute(
      `INSERT INTO pending_users (name, email, password, otp_hash, otp_expires_at)
       VALUES (:name, :email, :password, :otpHash, SYSTIMESTAMP + NUMTODSINTERVAL(:expiryMinutes, 'MINUTE'))`,
      { name, email, password: hashedPassword, otpHash, expiryMinutes }
    );

    try {
      await sendOtpEmail(email, otp);
    } catch (mailErr) {
      console.error("OTP email send error:", mailErr);
      // Don't leave an unusable pending row behind if the email never went out.
      await connection.execute(`DELETE FROM pending_users WHERE email = :email`, { email });
      return res.status(502).json({ error: "Couldn't send the verification email. Please try again." });
    }

    return res.status(200).json({
      message: `We sent a 6-digit verification code to ${email}. It expires in ${expiryMinutes} minutes.`,
      email,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  } finally {
    if (connection) await connection.close();
  }
}

async function verifyOtp(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and code are required." });
  }

  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT name, email, password, otp_hash, otp_expires_at
       FROM pending_users WHERE email = :email`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "No pending signup found for this email. Please sign up again." });
    }

    const pending = result.rows[0];

    if (new Date(pending.OTP_EXPIRES_AT) < new Date()) {
      await connection.execute(`DELETE FROM pending_users WHERE email = :email`, { email });
      return res.status(400).json({ error: "That code has expired. Please sign up again." });
    }

    if (!isOtpValid(otp, pending.OTP_HASH)) {
      return res.status(400).json({ error: "Incorrect code. Please try again." });
    }

    // OTP confirmed - this is now a real account.
    const insertResult = await connection.execute(
      `INSERT INTO users (name, email, password)
       VALUES (:name, :email, :password)
       RETURNING id INTO :id`,
      {
        name: pending.NAME,
        email: pending.EMAIL,
        password: pending.PASSWORD,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    await connection.execute(`DELETE FROM pending_users WHERE email = :email`, { email });

    const user = { ID: insertResult.outBinds.id[0], NAME: pending.NAME, EMAIL: pending.EMAIL };
    const token = generateToken(user);

    return res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  } finally {
    if (connection) await connection.close();
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT id, name, email, password FROM users WHERE email = :email`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.PASSWORD);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = generateToken(user);
    return res.status(200).json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  } finally {
    if (connection) await connection.close();
  }
}

async function me(req, res) {
  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT id, name, email FROM users WHERE id = :id`,
      { id: req.userId }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({ user: toPublicUser(result.rows[0]) });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { signup, verifyOtp, login, me };