/**
 * Knight Bot - A WhatsApp Bot
 * Copyright (c) 2024 Professor
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('Garbage collection completed')
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('RAM too high (>400MB), restarting bot...')
        process.exit(1) // Panel will auto-restart
    }
}, 30_000) // check every 30 seconds

let phoneNumber = "254703110780"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "𝐌𝐔𝐙𝐀𝐍 𝐌𝐃"  // Updated bot name
global.themeemoji = "•"
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, use ownerNumber from settings
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}


async function startXeonBotInc() {
    try {
        let { version, isLatest } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const XeonBotInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !pairingCode,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        })

        // Save credentials when they update
        XeonBotInc.ev.on('creds.update', saveCreds)

        store.bind(XeonBotInc.ev)

        // Message handling
        XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
            try {
                const mek = chatUpdate.messages[0]
                if (!mek.message) return
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    await handleStatus(XeonBotInc, chatUpdate);
                    return;
                }
                // In private mode, only block non-group messages (allow groups for moderation)
                if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                    const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                    if (!isGroup) return // Block DMs in private mode, but allow group messages
                }
                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

                // Clear message retry cache to prevent memory bloat
                if (XeonBotInc?.msgRetryCounterCache) {
                    XeonBotInc.msgRetryCounterCache.clear()
                }

                try {
                    await handleMessages(XeonBotInc, chatUpdate, true)
                } catch (err) {
                    console.error("Error in handleMessages:", err)
                    if (mek.key && mek.key.remoteJid) {
                        await XeonBotInc.sendMessage(mek.key.remoteJid, {
                            text: 'An error occurred while processing your message.',
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: false,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '0029VbBm7apIXnlmuyjGGM0p@newsletter',
                                    newsletterName: '𝐌𝐔𝐙𝐀𝐍 𝐌𝐃',
                                    serverMessageId: -1
                                }
                            }
                        }).catch(console.error);
                    }
                }
            } catch (err) {
                console.error("Error in messages.upsert:", err)
            }
        })

        // Connection handling
        XeonBotInc.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect, qr } = s
            
            if (qr) {
                console.log(chalk.yellow('QR Code generated. Please scan with WhatsApp.'))
            }
            
            if (connection === 'connecting') {
                console.log(chalk.yellow('Connecting to WhatsApp...'))
            }
            
            if (connection == "open") {
                console.log(chalk.hex('#39FF14').bold(`Bot Connected Successfully!`))  // Neon Green
                console.log(chalk.hex('#FF1493').bold(`You are now connected with 𝐌𝐔𝐙𝐀𝐍 𝐌𝐃`)) // Neon Pink

                try {
                    // Handle successful connection and initialization
                    console.log(chalk.hex('#FF1493').bold(`Welcome to 𝐌𝐔𝐙𝐚𝐍 𝐌𝐃! The bot is now ready to serve you.`));
                } catch (error) {
                    console.error(chalk.red("Error during connection initialization: "), error);
                }
            }

            if (connection === 'close') {
                console.log(chalk.red("Connection closed. Reconnecting..."))
                const reason = lastDisconnect?.error?.output?.statusCode
                if (reason === DisconnectReason.loggedOut) {
                    console.log(chalk.red("Logged out. Please scan the new QR code to re-login."))
                } else {
                    console.log(chalk.yellow("Reconnecting in 10 seconds..."))
                    setTimeout(() => startXeonBotInc(), 10000)
                }
            }
        })

        // Monitor status changes (like user profile change, typing, etc.)
        XeonBotInc.ev.on('presence.update', (presence) => {
            console.log(chalk.blue("Presence update received: "), presence)
        })

        // Handle group participant updates (join, leave, promote, demote)
        XeonBotInc.ev.on('group-participants.update', async (participantUpdate) => {
            await handleGroupParticipantUpdate(XeonBotInc, participantUpdate)
        })

        // Handle incoming messages (text, media, etc.)
        XeonBotInc.ev.on('messages.upsert', async (messageUpdate) => {
            try {
                const message = messageUpdate.messages[0]
if (!message.message) return
                message.message = (Object.keys(message.message)[0] === 'ephemeralMessage') ? message.message.ephemeralMessage.message : message.message
                if (message.key && message.key.remoteJid === 'status@broadcast') {
                    await handleStatus(XeonBotInc, messageUpdate)
                    return
                }

                // Handle message types
                await handleMessages(XeonBotInc, messageUpdate)
            } catch (err) {
                console.error("Error in processing message:", err)
            }
        })

        // Handle media download (if necessary)
        XeonBotInc.ev.on('message-received', async (message) => {
            if (message.message && message.message.imageMessage) {
                // Example: Download an image
                try {
                    const imageBuffer = await downloadContentFromMessage(message.message.imageMessage, 'image')
                    const fileType = await FileType.fromBuffer(imageBuffer)
                    console.log(chalk.green(`Received image of type: ${fileType?.ext}`))
                } catch (err) {
                    console.error("Error downloading media:", err)
                }
            }
        })

        // Keep the bot running
        process.on('uncaughtException', (err) => {
            console.error("Uncaught Exception:", err)
            process.exit(1)
        })

        process.on('unhandledRejection', (err) => {
            console.error("Unhandled Promise Rejection:", err)
            process.exit(1)
        })

    } catch (error) {
        console.error(chalk.red("Error in starting bot: "), error)
        process.exit(1)
    }
}

// Run the bot
startXeonBotInc()