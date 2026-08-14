const express = require('express');
const { getConnection } = require('../lib/db');

const app = express();
app.use(express.json());

app.get('/api/users', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT id, username, email FROM users WHERE ROWNUM <= 10`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { console.error(e); }
    }
  }
});

app.get('/', (req, res) => {
  res.send('Oracle Express API is live on Vercel');
});

module.exports = app;