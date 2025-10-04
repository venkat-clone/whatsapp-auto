const express = require("express");
const qrcode = require("qrcode-terminal");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const axios = require("axios");
const app = express();
const fs = require('fs');
const os = require('os');
const path = require('path');
app.use(express.json());

let sock; // WhatsApp socket will be stored here

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("📸 Scan this QR with WhatsApp:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "close") {
            const error = new Boom(lastDisconnect?.error);
            const shouldReconnect = error.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("❌ Connection closed. Reconnecting:", shouldReconnect);
            if (shouldReconnect) startBot();
        }

        if (connection === "open") {
            console.log("✅ Connected to WhatsApp API");
        }
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("groups.update",async (t)=>{
        console.log(t);
    });

    sock.ev.on("chats.update", async (t) => {
        console.log(t);
    console.log("🧾 Group Chats:");
    
});


    // sock.ev.on("messages.upsert", async (msg) => {
    //     const message = msg.messages[0];
    //     if (!message.message || message.key.fromMe) return;

    //     const text = message.message.conversation || message.message.extendedTextMessage?.text;
    //     if (text?.toLowerCase().includes("hello")) {
    //         await sock.sendMessage(message.key.remoteJid, {
    //             text: "Hi! WhatsApp API Bot here 👋"
    //         });
    //     }
    // });
}

startBot();

// ======= ✅ EXPRESS API ROUTE =======
app.post("/send-message", async (req, res) => {
    const { jid, message, s3Url,fileName } = req.body;

    if (!sock) return res.status(503).send({ error: "WhatsApp not connected." });
    if (!jid) return res.status(400).send({ error: "Missing jid." });

    console.log(`Sending message to ${jid} message: ${message} s3Url: ${s3Url}`);
    try {
        if (s3Url) {
            // Download the file from s3Url
            const response = await axios.get(s3Url, {
                responseType: 'arraybuffer',
            });

            const fileBuffer = Buffer.from(response.data, 'binary');
            const contentType = response.headers['content-type'] || mime.lookup(s3Url);
            const url = new URL(s3Url);            // Step 1: Parse the URL properly
            const pathname = url.pathname;         // Step 2: Get just the path (e.g. /bucket/date/file.pdf)
            const docName = pathname.split('/').pop(); // Step 3: Extract file name from path


            const tempFilePath = path.join(os.tmpdir(), 'test-file');

            // Save buffer to temp file
            fs.writeFileSync(tempFilePath, fileBuffer);
            console.log(`📝 File saved to temp path: ${tempFilePath}`);
            let mediaMessage = {
                document: fileBuffer,
                mimetype: contentType,
                fileName: fileName||docName,
                caption: message || '', // Optional caption
            };

            await sock.sendMessage(jid, mediaMessage);
            return res.send({ success: true, message: "File sent via WhatsApp." });

        } else if (message) {
            // Send text message
            await sock.sendMessage(jid, { text: message });
            return res.send({ success: true, message: "Message sent." });
        } else {
            return res.status(400).send({ error: "Provide either message or s3Url." });
        }
    } catch (err) {
        console.error("❌ Error sending message:", err);
        return res.status(500).send({ error: "Failed to send message." });
    }
});

app.get("/test", async (req, res) => {
    const number = "8184926683"; // Without country code: ❌
    const fullNumber = "918184926683"; // With country code: ✅

    const jid = `${fullNumber}@s.whatsapp.net`; // Format as WhatsApp JID
    const message = "test message";

    if (!sock) return res.status(503).send({ error: "WhatsApp not connected." });

    try {
        await sock.sendMessage(jid, { text: message });
        res.send({ success: true, message: "Message sent." });
    } catch (err) {
        console.error("❌ Error sending message:", err);
        res.status(500).send({ error: "Failed to send message." });
    }
});


// ======= ✅ START EXPRESS SERVER =======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}`);
});
