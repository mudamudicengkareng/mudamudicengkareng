import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import http from "http";
import P from "pino";

const logger = P({ level: "info" });

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: true,
        logger,
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("Scan this QR Code to connect to WhatsApp:");
        }
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed due to ", lastDisconnect?.error, ", reconnecting ", shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === "open") {
            console.log("Opened connection");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Simple HTTP Server to receive send requests from the web app
    const server = http.createServer(async (req, res) => {
        if (req.method === "POST" && req.url === "/send") {
            let body = "";
            req.on("data", chunk => body += chunk);
            req.on("end", async () => {
                try {
                    const { target, message } = JSON.parse(body);
                    const jid = target.replace(/\D/g, "") + "@s.whatsapp.net";
                    await sock.sendMessage(jid, { text: message });
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: true }));
                } catch (e: any) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(3001, () => {
        console.log("WhatsApp Bot API listening on http://localhost:3001");
    });

    return sock;
}

connectToWhatsApp();
