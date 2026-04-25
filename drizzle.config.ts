import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

let dbUrl = process.env.TURSO_DATABASE_URL!;
let dbAuthToken = process.env.TURSO_AUTH_TOKEN;

// Fix for mangled environment variables
if (dbUrl && (dbUrl.includes(" ") || dbUrl.includes("%20") || dbUrl.includes("TURSO_AUTH_TOKEN="))) {
  const parts = dbUrl.split(/\s+|%20/);
  dbUrl = parts[0];
  if (!dbAuthToken) {
    for (const part of parts) {
      if (part.startsWith("TURSO_AUTH_TOKEN=")) {
        dbAuthToken = part.replace("TURSO_AUTH_TOKEN=", "");
      }
    }
  }
}

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: dbUrl,
    authToken: dbAuthToken,
  },
});
