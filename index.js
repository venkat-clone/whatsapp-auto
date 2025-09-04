
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state
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
            console.log("✅ Connected to WhatsApp as Venkey's SoulBot! 💖");
            setInterval(async () => {
                try {
                    await sock.sendMessage(recipientJid, {
                        text: "💬 Scheduled message from Premalekha Bot! 🌸"
                    });
                    console.log("📤 Sent scheduled message.");
                } catch (err) {
                    console.error("❌ Failed to send scheduled message:", err);
                }
            }, 5 * 60 * 1000);
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (msg) => {
        const message = msg.messages[0];
        if (!message.message || message.key.fromMe) return;

        const text = message.message.conversation || message.message.extendedTextMessage?.text;
        if (text?.toLowerCase().includes("hello")) {
            await sock.sendMessage(message.key.remoteJid, {
                text: "Hi Venkey! 👩‍💻 Premalekha Bot at your service 💘"
            });
        }
    });
}

startBot();
