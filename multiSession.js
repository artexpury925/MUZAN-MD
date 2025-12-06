// multiSession.js
import fs from 'fs'
import path from 'path'
import { useMultiFileAuthState } from "@whiskeysockets/baileys"

global.allBots = new Map() // number → sock

export const loadAllSessions = async () => {
    if (!fs.existsSync('./session')) fs.mkdirSync('./session', { recursive: true })

    const files = fs.readdirSync('./session')
        .filter(f => f.toLowerCase().includes('creds') && f.endsWith('.json'))

    console.log(`\nFound ${files.length} session(s) — Activating all...\n`)

    for (const file of files) {
        try {
            const filePath = path.join('./session', file)
            const raw = fs.readFileSync(filePath, 'utf-8')
            const creds = JSON.parse(raw)

            const phone = creds.me?.id?.split(':')[0] ||
                          creds.registeredPhoneNumber ||
                          'unknown'

            const numberOnly = phone.replace(/[^0-9]/g, '')
            const newFolder = `./session/${numberOnly}`

           

            if (!fs.existsSync(newFolder)) fs.mkdirSync(newFolder, { recursive: true })
            fs.writeFileSync(`${newFolder}/creds.json`, raw)

            if (!filePath.includes(numberOnly)) {
                fs.unlinkSync(filePath)
            }

            if (global.allBots.has(numberOnly)) continue

            const { state, saveCreds } = await useMultiFileAuthState(newFolder)

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

    console.log(`All ${global.allBots.size} bot(s) are ACTIVE`)
}

// Auto run on import
loadAllSessions()