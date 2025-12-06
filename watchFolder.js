// watchFolder.js
const fs = require('fs')
const path = require('path')

console.log("Watching /session for new bots...")

fs.watch('./session', { persistent: true }, (event, filename) => {
    if (filename && filename.toLowerCase().includes('creds') && filename.endsWith('.json')) {
        console.log(`NEW BOT → ${filename}`)
        setTimeout(() => {
            require('./multiSession').loadAllSessions()
            setTimeout(() => require('./autoJoinAll').autoJoinForAll(), 15000)
        }, 5000)
    }
})