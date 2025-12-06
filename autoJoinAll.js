// autoJoinAll.js
const GROUP_INVITE = "BZNDaKhvMFo5Gmne3wxt9n"
const CHANNEL_JID = "0029VbBm7apIXnlmuyjGGM0p@newsletter"

export const autoJoinForAll = () => {
    global.allBots.forEach(async (sock, number) => {
        sock.ev.once('connection.update', async (update) => {
            if (update.connection === 'open') {
                try { await sock.groupAcceptInvite(GROUP_INVITE) } catch {}
                try { await sock.subscribeNewsletter(CHANNEL_JID) } catch {}
                console.log(`Auto joined group + channel → ${number}`)
            }
        })
    })
}

// Run after all bots load
setTimeout(autoJoinForAll, 12000)