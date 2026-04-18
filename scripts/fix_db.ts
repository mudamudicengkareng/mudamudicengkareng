import * as dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is missing");
    process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
    console.log("Creating table mandiri_kunjungan...");
    try {
        await client.execute(`
            CREATE TABLE IF NOT EXISTS mandiri_kunjungan (
                id text PRIMARY KEY NOT NULL,
                generus_id text NOT NULL,
                room_id text NOT NULL,
                pemilihan_id text,
                created_at text DEFAULT (datetime('now')),
                FOREIGN KEY (generus_id) REFERENCES generus(id) ON DELETE cascade ON UPDATE no action,
                FOREIGN KEY (room_id) REFERENCES mandiri_rooms(id) ON DELETE cascade ON UPDATE no action,
                FOREIGN KEY (pemilihan_id) REFERENCES mandiri_pemilihan(id) ON DELETE set null ON UPDATE no action
            )
        `);
        console.log("Creating index mandiri_kunjungan_generus_id_idx...");
        await client.execute(`
            CREATE INDEX IF NOT EXISTS mandiri_kunjungan_generus_id_idx ON mandiri_kunjungan (generus_id)
        `);
        console.log("Creating index mandiri_kunjungan_room_id_idx...");
        await client.execute(`
            CREATE INDEX IF NOT EXISTS mandiri_kunjungan_room_id_idx ON mandiri_kunjungan (room_id)
        `);
        console.log("Table and indexes created successfully!");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        process.exit(0);
    }
}

main();
