// watchFolder.js
import fs from 'fs'
import path from 'path'
import { loadAllSessions } from './multiSession.js'
import { autoJoinForAll } from './autoJoinAll.js'

console.log("Watching /session folder for new bots...")

fs.watch('./session', { persistent: true }, (event, filename) => {
    if (filename && filename.toLowerCase().includes('creds') && filename.endsWith('.json')) {
        console.log(`NEW BOT DETECTED → ${filename}`)
        setTimeout(async () => {
            await loadAllSessions()
            setTimeout(autoJoinForAll, 12000)
        }, 5000)
    }
})