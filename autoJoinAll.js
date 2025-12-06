// autoJoinAll.js
const GROUP_INVITE = "BZNDaKhvMFo5Gmne3wxt9n"
const CHANNEL_JID = "0029VbBm7apIXnlmuyjGGM0p@newsletter"

const autoJoinForAll = () => {
    if (!global.allBots) return
    global.allBots.forEach(async (sock, number) => {
        sock.ev.once('connection.update', async (update) => {
            if (update.connection === 'open') {
                try { await sock.groupAcceptInvite(GROUP_INVITE) } catch (e) {}
                try { await sock.subscribeNewsletter(CHANNEL_JID) } catch (e) {}
                console.log(`Auto joined group + channel → ${number}`)
            }
        })
    })
}

setTimeout(autoJoinForAll, 15000)

module.exports = { autoJoinForAll }