// lib/channelInfo.js
// MUZAN MD - Official Channel Forwarding Style (No Thumbnail)
// Use with: { ...channelInfo } → looks 100% forwarded from your channel

const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '0029VbBm7apIXnlmuyjGGM0p@newsletter',  // Your real channel
            newsletterName: 'MUZAN MD',                            // Your channel name
            serverMessageId: 99
        }
    }
};

module.exports = { channelInfo };