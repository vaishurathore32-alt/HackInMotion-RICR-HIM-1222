const oracledb = require('node-oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function getConnection() {
  if (!global.oraclePool) {
    global.oraclePool = await oracledb.createPool({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
      poolMin: 0,
      poolMax: 2,
      poolIncrement: 1,
    });
  }
  return await global.oraclePool.getConnection();
}

module.exports = { getConnection };