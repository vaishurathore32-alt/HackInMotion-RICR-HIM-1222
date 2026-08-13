

CREATE TABLE users (
  id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR2(255) NOT NULL,
  email      VARCHAR2(255) NOT NULL UNIQUE,
  password   VARCHAR2(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Holds a signup attempt between "email validated + OTP sent" and
-- "OTP confirmed". Rows here never appear in the real users table until
-- the OTP is verified. The cleanup job (jobs/cleanupPendingUsers.js)
-- sweeps out rows whose OTP has expired and was never verified.
CREATE TABLE pending_users (
  id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           VARCHAR2(255) NOT NULL,
  email          VARCHAR2(255) NOT NULL UNIQUE,
  password       VARCHAR2(255) NOT NULL,
  otp_hash       VARCHAR2(255) NOT NULL,
  otp_expires_at TIMESTAMP NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
