// libönen/channelInfo.js
// MUZAN MD Official Channel Forwarding Style
// Use with: { ...channelInfo } in any message

const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '0029VbBm7apIXnlmuyjGGM0p@newsletter',  // Your real channel
            newsletterName: 'MUZAN MD',                            // Your channel name
            serverMessageId: 99
        },
        externalAdReply: {
            title: "MUZAN MD",
            body: "The Most Powerful WhatsApp Bot 2025",
            thumbnailUrl: "https://files.catbox.sh/6x8z0z.jpg", // Replace with your logo (optional but recommended)
            sourceUrl: "https://whatsapp.com/channel/0029VbBm7apIXnlmuyjGGM0p",
            mediaType: 1,
            renderLargerThumbnail: true
        }
    }
};

module.exports = { channelInfo };