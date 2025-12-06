// logger.js - Neon Rainbow Logger for MUZAN BOT

function neonLog(text) {
    const colors = ['\x1b[35m', '\x1b[36m', '\x1b[33m', '\x1b[32m', '\x1b[34m', '\x1b[31m']; // Neon rainbow colors
    let output = '';
    let colorIndex = 0;
    for (let char of text) {
        if (char === '\n') {
            output += char;
            continue;
        }
        output += colors[colorIndex % colors.length] + char;
        colorIndex++;
    }
    console.log(output + '\x1b[0m'); // Reset color
}

async function setupNeonLogger(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (msg.key.fromMe) continue; // Ignore bot's own messages

            const sender = msg.pushName || 'Unknown User';
            const from = msg.key.remoteJid;
            let chatName = 'DM'; // Default

            // Get chat name (group or channel)
            try {
                if (from.endsWith('@g.us')) {
                    const meta = await sock.groupMetadata(from);
                    chatName = meta.subject || 'Unknown Group';
                } else if (from.endsWith('@newsletter')) {
                    const info = await sock.newsletterMetadata(from);
                    chatName = `Channel: ${info.newsletter.name || 'Unknown'}`;
                }
            } catch (e) {
                console.log('Error getting chat name:', e.message);
            }

            // Get message body
            const body = (
                msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption ||
                msg.message?.videoMessage?.caption ||
                '[Media/Message]'
            );

            // Log in neon rainbow style
            neonLog(`
✉️ NEW MESSAGE RECEIVED
├ Sender: ${sender}
├ Chat: ${chatName}
└ Text: ${body.substring(0, 150)}${body.length > 150 ? '...' : ''}
            `);
        }
    });
}

module.exports = { setupNeonLogger, neonLog };