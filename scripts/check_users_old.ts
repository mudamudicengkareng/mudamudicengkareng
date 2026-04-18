import { createClient } from "@libsql/client";
import dotenv from 'dotenv';

const envPath = 'c:\\Users\\ASUS\\OneDrive\\Documents\\Xampp1\\htdocs\\mudamudicengkareng\\.env.local';
dotenv.config({ path: envPath });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

async function main() {
  if (!url) {
    console.error("TURSO_DATABASE_URL is missing!");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  try {
    console.log("Checking users_old table info...");
    const info = await client.execute("PRAGMA table_info('users_old')");
    console.log("Table info:", JSON.stringify(info.rows, null, 2));

    const master = await client.execute("SELECT sql FROM sqlite_master WHERE name='users_old'");
    console.log("SQL definition:", master.rows[0]?.sql);
  } catch (error: any) {
    console.error("Check failed:", error);
  }
  process.exit(0);
}

main();
