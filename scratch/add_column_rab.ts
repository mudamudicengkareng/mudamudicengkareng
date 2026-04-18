
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
    console.error("TURSO_DATABASE_URL is missing");
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function main() {
    try {
        console.log("Adding is_submitted to rab_approval...");
        await client.execute("ALTER TABLE rab_approval ADD COLUMN is_submitted integer DEFAULT 0");
        console.log("Done!");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

main();
