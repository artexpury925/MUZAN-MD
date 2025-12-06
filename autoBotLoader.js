// autoBotLoader.js
// Drop ANY creds.json in ./session → becomes ACTIVE instantly
// Auto renames folder by phone number → unlimited bots
// Works perfectly with your current index.js + main.js

const fs = require('fs')
const path = require('path')
const { useMultiFileAuthState } = require("@whiskeysockets/baileys")

// Global storage for all bots
global.activeBots = global.activeBots || new Map()

const startAllDroppedSessions = async () => {
    if (!fs.existsSync('./session')) {
        fs.mkdirSync('./session', { recursive: true })
    }

    const files = fs.readdirSync('./session')
        .filter(f => f.toLowerCase().includes('creds') && f.endsWith('.json'))

    console.log(`\nSCANNING SESSION FOLDER → Found ${files.length} session(s)\n`)

    for (const file of files) {
        try {
            const fullPath = path.join('./session', file)
            const data = fs.readFileSync(fullPath, 'utf-8')
            const creds = JSON.parse(data)

            // Get real phone number
            const phone = creds.me?.id?.split(':')[0] ||
                          creds.registeredPhoneNumber ||
                          `temp_${Date.now()}`

            const numberOnly = phone.replace(/[^0-9]/g, '')
            const botFolder = `./session/${numberOnly`

            // Create unique folder named by number
            if (!fs.existsSync(botFolder)) {
                fs.mkdirSync(botFolder, { recursive: true })
            }

            // Move creds.json inside the folder
            const targetPath = path.join(botFolder, 'creds.json')
            fs.writeFileSync(targetPath, data)

            // Delete original file if outside folder
            if (fullPath !== targetPath) {
                fs.unlinkSync(fullPath)
            }

            // Skip if already running
            if (global.activeBots.has(numberOnly)) {
                console.log(`Already running → ${numberOnly}`)
                continue
            }

            console.log(`ACTIVATING BOT → ${numberOnly}`)

            const { state, saveCreds } = await useMultiFileAuthState(botFolder)

            const sock = global.connectToWhatsApp({  // your existing function
                auth: state,
                printQRInTerminal: false,
                logger: require('pino')({ level: 'silent' })
            })

            global.activeBots.set(numberOnly, sock)

            sock.ev.on('creds.update', saveCreds)

            sock.ev.on('connection.update', (update) => {
                if (update.connection === 'open') {
                    console.log(`ONLINE → ${numberOnly} (${sock.user?.name || 'User'})`)
                }
            })

        } catch (err) {
            console.log(`FAILED → ${file} | ${err.message}`)
        }
    }

    console.log(`\nALL ${global.activeBots.size} BOTS ARE NOW ACTIVE\n`)
}

// Watch folder — new session = auto start
fs.watch('./session', { persistent: true }, (event, filename) => {
    if (filename && filename.includes('creds') && filename.endsWith('.json')) {
        console.log(`NEW SESSION UPLOADED → ${filename}`)
        setTimeout(startAllDroppedSessions, 5000)
    }
})

// Run on startup
startAllDroppedSessions()

console.log("AUTO BOT LOADER ACTIVE — Ready for unlimited sessions")