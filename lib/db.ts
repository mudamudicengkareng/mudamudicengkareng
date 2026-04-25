import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let url = process.env.TURSO_DATABASE_URL || "file:local.db";
let authToken = process.env.TURSO_AUTH_TOKEN || "";

// Fix for mangled environment variables (common in Netlify/Vercel copy-paste)
if (url.includes(" ") || url.includes("%20") || url.includes("TURSO_AUTH_TOKEN=")) {
  console.log("DB_CLIENT: Detected mangled TURSO_DATABASE_URL, attempting to sanitize...");
  // Split by space or %20
  const parts = url.split(/\s+|%20/);
  url = parts[0];
  
  // If we don't have an authToken yet, try to find it in the parts
  if (!authToken || authToken === "") {
    for (const part of parts) {
      if (part.startsWith("TURSO_AUTH_TOKEN=")) {
        authToken = part.replace("TURSO_AUTH_TOKEN=", "");
      }
    }
  }
}

const client = createClient({
  url,
  authToken,
});

if (process.env.TURSO_DATABASE_URL) {
  console.log("DB_CLIENT_CONNECTING_TO:", process.env.TURSO_DATABASE_URL.substring(0, 20) + "...");
} else {
  console.log("DB_CLIENT: TURSO_DATABASE_URL is missing, using local fallback (normal during build time)");
}

export const db = drizzle(client, { schema });
export { client };
