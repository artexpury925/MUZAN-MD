// watchNewSessions.js
// Watches ./session folder — any new creds.json = auto start

const fs = require('fs')
const path = require('path')

fs.watch('./session', { persistent: true }, async (event, filename) => {
    if (filename && filename.includes('creds') && filename.endsWith('.json')) {
        const fullPath = path.join('./session', filename)
        
        // Wait a sec for file to finish uploading
        setTimeout(async () => {
            if (fs.existsSync(fullPath)) {
                console.log(`NEW SESSION DETECTED → ${filename}`)
                require('./autoStartAllSessions').autoStartAll() // re-run loader
            }
        }, 4000)
    }
})

console.log("Watching for new sessions in /session folder...")