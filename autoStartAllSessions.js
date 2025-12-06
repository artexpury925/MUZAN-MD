// autoStartAllSessions.js
// → Auto starts every creds.json in ./session/
// → Renames each folder to the phone number (2547xxx)
// → All bots become active instantly

const fs = require('fs')
const path = require('path')
const { useMultiFileAuthState } = require("@whiskeysockets/baileys")

global.activeBots = new Map() // number → sock

async function autoStartAll() {
    if (!fs.existsSync('./session')) fs.mkdirSync('./session')

    const files = fs.readdirSync('./session').filter(f => f.includes('creds') && f.endsWith('.json'))

    console.log(`\nFound ${files.length} session(s) — Starting all...\n`)

    for (const file of files) {
        try {
            const filePath = `./session/${file}`
            const raw = fs.readFileSync(filePath, 'utf-8')
            const creds = JSON.parse(raw)

            const phone = creds.me?.id?.split(':')[0] || 
                         creds.registeredPhoneNumber || 
                         "unknown"

            const cleanNumber = phone.replace(/[^0-9]/g, '')
            const folder = `./session/${cleanNumber}`

            // Create folder with number name
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
            fs.writeFileSync(`${folder}/creds.json`, raw)

            // Delete old file if outside folder
            if (!filePath.includes(cleanNumber)) {
                fs.unlinkSync(filePath)
            }

            const { state, saveCreds } = await useMultiFileAuthState(folder)

            const sock = global.connectToWhatsApp({ // your existing connect function
                auth: state,
                printQRInTerminal: false,
                logger: global.pino({ level: 'silent' })
            })

            global.activeBots.set(cleanNumber, sock)

            sock.ev.on('creds.update', saveCreds)
            sock.ev.on('connection.update', (update) => {
                if (update.connection === 'open') {
                    console.log(`ACTIVE → ${cleanNumber} (${sock.user?.name || 'Bot'})`)
                }
            })

        } catch (err) {
            console.log(`Failed ${file}: ${err.message}`)
        }
    }
}

// Run on startup
autoStartAll()

module.exports = { autoStartAll }