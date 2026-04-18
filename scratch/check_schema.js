const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    const res = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='generus'");
    console.log(res.rows[0].sql);
  } catch (err) {
    console.error(err);
  } finally {
    client.close();
  }
}

main();
