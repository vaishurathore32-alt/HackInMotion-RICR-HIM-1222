const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587/others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendOtpEmail(toEmail, otp) {
  const mailer = getTransporter();
  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 10;

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: "Your Learnpath AI verification code",
    text: `Your verification code is ${otp}. It expires in ${expiryMinutes} minutes.`,
    html: `<p>Your Learnpath AI verification code is:</p><h2 style="letter-spacing:4px;">${otp}</h2><p>This code expires in ${expiryMinutes} minutes.</p>`,
  });
}

module.exports = { sendOtpEmail };
