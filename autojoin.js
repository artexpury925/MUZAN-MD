// autojoin.js - Auto Join Groups & Follow Channels for MUZAN BOT

const MY_CHANNEL_ID = "0029VbBm7apIXnlmuyjGGM0p"; // Your Channel ID
const MY_GROUP_CODE = "BZNDaKhvMFo5Gmne3wxt9n"; // Your Group Invite Code

function setupAutoJoin(sock) {
    // Auto-join your own group & follow your channel when bot connects
    sock.ev.once('connection.update', async (update) => {
        if (update.connection === 'open') {
            try {
                await sock.groupAcceptInvite(MY_GROUP_CODE);
                console.log("✅ Auto Joined Your Official Group");
            } catch (e) {
                console.log("❌ Failed to join your group:", e.message);
            }

            try {
                await sock.newsletterFollow(MY_CHANNEL_ID);
                console.log("✅ Auto Followed Your Official Channel");
            } catch (e) {
                console.log("❌ Failed to follow your channel:", e.message);
            }
        }
    });

    // Auto-join ANY group invite link or follow ANY channel link sent to the bot
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (msg.key.fromMe) return; // Ignore bot's own messages

            const text = (
                msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption ||
                msg.message?.videoMessage?.caption ||
                ""
            ).toLowerCase();

            const from = msg.key.remoteJid;

            // Detect and auto-join group invite links
            const groupMatch = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/);
            if (groupMatch) {
                try {
                    await sock.groupAcceptInvite(groupMatch[1]);
                    console.log("✅ Auto Joined New Group from Link");
                    await sock.sendMessage(from, { text: "✅ I have joined the group! Thanks for inviting MUZAN BOT 🔥" });
                } catch (e) {
                    console.log("❌ Failed to join group:", e.message);
                }
            }

            // Detect and auto-follow channel links
            const channelMatch = text.match(/whatsapp\.com\/channel\/([a-zA-Z0-9]{24,})/);
            if (channelMatch) {
                try {
                    await sock.newsletterFollow(channelMatch[1]);
                    console.log("✅ Auto Followed New Channel");
                    await sock.sendMessage(from, { text: "✅ I have followed the channel! 📢" });
                } catch (e) {
                    console.log("❌ Failed to follow channel:", e.message);
                }
            }
        }
    });
}

module.exports = { setupAutoJoin };