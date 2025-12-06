
// multiSession.js
const fs = require('fs')
const path = require('path')
const { useMultiFileAuthState } = require("@whiskeysockets/baileys")

global.allBots = new Map()

const loadAllSessions = async () => {
    if (!fs.existsSync('./session')) fs.mkdirSync('./session', { recursive: true })

    const files = fs.readdirSync('./session')
        .filter(f => f.toLowerCase().includes('creds') && f.endsWith('.json'))

    console.log(`\nFound ${files.length} bot(s) — Starting all...\n`)

    for (const file of files) {
        try {
            const filePath = path.join('./session', file)
            const raw = fs.readFileSync(filePath, 'utf-8')
            const creds = JSON.parse(raw)

            const phone = creds.me?.id?.split(':')[0] ||
                          creds.registeredPhoneNumber ||
                          'unknown'

            const numberOnly = phone.replace(/[^0-9]/g, '')
            const folder = `./session/${numberOnly}`

            if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
            fs.writeFileSync(`${folder}/creds.json`, raw)

            if (!filePath.includes(numberOnly)) {
                fs.unlinkSync(filePath)
            }

            if (global.allBots.has(numberOnly)) continue

            const { state, saveCreds } = await useMultiFileAuthState(folder)

            const sock = global.connectToWhatsApp({
                auth: state,
                printQRInTerminal: false,
                logger: global.pino({ level: 'silent' })
            })

            global.allBots.set(numberOnly, sock)

            sock.ev.on('creds.update', saveCreds)
            sock.ev.on('connection.update', (update) => {
                if (update.connection === 'open') {
                    console.log(`ACTIVE → ${numberOnly} (${sock.user?.name || 'Bot'})`)
                }
            })

        } catch (err) {
            console.log(`Failed ${file}: ${err.message}`)
        }
    }

    console.log(`\nAll ${global.allBots.size} bot(s) are now ACTIVE!\n`)
}

loadAllSessions()

// Export command — works with your style
module.exports = {
    loadAllSessions
}