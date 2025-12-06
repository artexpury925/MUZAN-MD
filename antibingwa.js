// antibingwa.js - Anti "Bingwa Sokoni" Spam System for MUZAN BOT

const fs = require('fs');
const path = require('path');

// File to save enabled groups (so it remembers after restart)
const DB_FILE = path.join(__dirname, 'antibingwa_db.json');

// Load or create database
let enabledGroups = new Set();
if (fs.existsSync(DB_FILE)) {
    try {
        enabledGroups = new Set(JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')));
    } catch (e) {
        enabledGroups = new Set();
    }
}

// Save database
function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify([...enabledGroups]), 'utf-8');
}

// Full spam text pattern (case-insensitive)
const BINGWA_SPAM_INDICATORS = [
    "bingwa sokoni",
    "make your orders despite your unpaid okoa jahazi",
    "system is automated and works 24hrs",
    "1.25gb@55",
    "1.5gb @50",
    "350mb @49",
    "2.5gb @300",
    "1gb@19",
    "250mbs@20",
    "1gb@99",
    "2gb @110sh",
    "1gb @ 23sh",
    "1.5gb @ 52sh",
    "45mins @22sh",
    "50mins @sh51",
    "till number:4096814",
    "4096814",
    "reverse call #0743658569"
];

// Check if message is Bingwa spam
function isBingwaSpam(text = "") {
    const lower = text.toLowerCase();
    return BINGWA_SPAM_INDICATORS.some(keyword => lower.includes(keyword));
}

// Command: .antibingwa → toggle on/off
async function antibingwaCommand(sock, msg) {
    if (!msg.key.remoteJid.endsWith('@g.us')) return;
    if (!msg.key.fromMe && !owner.includes(msg.key.participant)) return; // Only owner or bot itself can use

    const groupId = msg.key.remoteJid;
    const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").trim();

    if (text === ".antibingwa") {
        if (enabledGroups.has(groupId)) {
            enabledGroups.delete(groupId);
            saveDB();
            await sock.sendMessage(groupId, { text: "Anti-Bingwa Sokoni *OFF* in this group." });
        } else {
            enabledGroups.add(groupId);
            saveDB();
            await sock.sendMessage(groupId, { 
                text: "Anti-Bingwa Sokoni *ON*\nAny Bingwa spam will be deleted + user kicked instantly!" 
            });
        }
    }
}

// Main anti-spam handler (call this on every message)
async function antiBingwaHandler(sock, msg) {
    if (!msg.message) return;
    if (msg.key.fromMe) return;
    if (!msg.key.remoteJid.endsWith('@g.us')) return;
    if (!enabledGroups.has(msg.key.remoteJid)) return;

    const text = [
        msg.message.conversation,
        msg.message.extendedTextMessage?.text,
        msg.message.imageMessage?.caption,
        msg.message.videoMessage?.caption
    ].find(t => t) || "";

    if (isBingwaSpam(text)) {
        try {
            // Delete the message
            await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });

            // Kick the spammer
            await sock.groupParticipantsUpdate(
                msg.key.remoteJid,
                [msg.key.participant],
                "remove"
            );

            // Optional: Notify group
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Bingwa Sokoni spam detected!\nUser removed automatically.`,
                mentions: [msg.key.participant]
            });

            console.log(`[ANTI-BINGWA] Removed spammer ${msg.key.participant} from ${msg.key.remoteJid}`);
        } catch (err) {
            console.log(`[ANTI-BINGWA ERROR] ${err.message} | Make sure bot is admin!`);
        }
    }
}

module.exports = { antibingwaCommand, antiBingwaHandler };