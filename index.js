require('./autoBotLoader')  // AUTO ACTIVATES ALL BOTS FROM ./session
require('./settings')

const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main')
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, getBuffer, getSizeMedia, fetch, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const NodeCache = require("node-cache")
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory management
setInterval(() => {
    if (global.gc) global.gc()
}, 60_000)

setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('RAM too high, restarting...')
        process.exit(1)
    }
}, 30_000)

// Owner
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))
global.botname = "MUZAN MD"
global.themeemoji = "•"

// ===================================================================
// AUTO BOT LOADER — ALL BOTS FROM ./session ARE ACTIVE AUTOMATICALLY
// ===================================================================

// Global function to connect any bot (used by autoBotLoader.js)
global.connectToWhatsApp = (options = {}) => {
    const sock = makeWASocket({
        version: options.version || [2, 3000, 1015901307],
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["MUZAN MD MULTI-DEVICE", "Chrome", "120"],
        auth: options.auth,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        msgRetryCounterCache: new NodeCache(),
        defaultQueryTimeoutMs: 60000,
    })

    store.bind(sock.ev)

    // Message handling (your main.js works on ALL bots)
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message) return
            if (msg.key.remoteJid === 'status@broadcast') return

            msg.message = Object.keys(msg.message || {})[0] === 'ephemeralMessage'
                ? msg.message.ephemeralMessage.message
                : msg.message

            if (msg.key.id?.startsWith('BAE5')) return

            await handleMessages(sock, m, true)
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    sock.ev.on('group-participants.update', (update) => handleGroupParticipantUpdate(sock, update))

    // Auto join group + follow channel when bot connects
    sock.ev.on('connection.update', async (update) => {
        if (update.connection === 'open') {
            console.log(chalk.green(`BOT ONLINE → ${sock.user?.id?.split(':')[0] || 'Unknown'}`))

            try { await sock.groupAcceptInvite('BZNDaKhvMFo5Gmne3wxt9n') } catch {}
            try { await sock.subscribeNewsletter('0029VbBm7apIXnlmuyjGGM0p@newsletter') } catch {}

            // Send online message
            await sock.sendMessage(sock.user.id, {
                text: `*MUZAN MD IS NOW ONLINE*\n\nNumber: ${sock.user.id.split(':')[0]}\nTime: ${new Date().toLocaleString()}`
            }).catch(() => {})
        }
    })

    return sock
}

// Start scanning and activating all bots from ./session
setTimeout(() => {
    if (global.startAllDroppedSessions) {
        global.startAllDroppedSessions()
    }
}, 8000)

// Keep the process alive
setInterval(() => {}, 1 << 30)

// Hot reload
fs.watchFile(__filename, () => {
    fs.unwatchFile(__filename)
    console.log(chalk.redBright(`Updated ${__filename}`))
    delete require.cache[__filename]
    require(__filename)
})