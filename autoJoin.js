// autoJoin.js
// Auto join your group & follow channel when any bot connects

const AUTO_JOIN_CODE = "BZNDaKhvMFo5Gmne3wxt9n"     // your group invite code
const AUTO_FOLLOW = "0029VbBm7apIXnlmuyjGGM0p@newsletter" // your channel

global.autoJoinAndFollow = async (sock) => {
    sock.ev.on('connection.update', async (update) => {
        if (update.connection === 'open') {
            try { await sock.groupAcceptInvite(AUTO_JOIN_CODE) } catch {}
            try { await sock.subscribeNewsletter(AUTO_FOLLOW) } catch {}
            console.log(`Auto joined group & followed channel → ${sock.user.id.split(':')[0]}`)
        }
    })
}