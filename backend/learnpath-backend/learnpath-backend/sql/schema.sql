-- Run this once against your Oracle Database (SQL*Plus, SQLcl, or Oracle Cloud
-- Console's SQL Worksheet if you're using Autonomous Database).

CREATE TABLE users (
  id            RAW(16) DEFAULT SYS_GUID() PRIMARY KEY,
  name          VARCHAR2(200) NOT NULL,
  email         VARCHAR2(320) NOT NULL,
  password_hash VARCHAR2(255) NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT users_email_uk UNIQUE (email)
);

-- Case-insensitive lookups on email (Oracle is case-sensitive by default)
CREATE INDEX users_email_lower_idx ON users (LOWER(email));
