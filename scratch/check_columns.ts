
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

async function checkTable(tableName: string) {
    try {
        const result = await client.execute(`PRAGMA table_info(${tableName})`);
        return result.rows.map(row => row.name);
    } catch (e) {
        return [];
    }
}

async function main() {
    const tables = [
        "mandiri_rooms",
        "rab_approval",
        "rundown_approval",
        "mandiri_pemilihan",
        "generus",
        "mandiri"
    ];

    for (const table of tables) {
        const columns = await checkTable(table);
        console.log(`Table ${table} columns:`, columns);
    }
    process.exit(0);
}

main();
