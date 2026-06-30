// ============================================
// 🚩 ʀᴀᴄʜɪᴛ  x  ʀᴜᴄʜɪᴋᴀ - ULTIMATE WHATSAPP BOT v1
// ============================================
// 完整功能版本 | 管理员完全权限 | 所有停止命令 | 按群组隔离配偶 | 连续调情
// 默认延迟：NC 10ms, Triple 10ms, Ultimate 10ms, Rage 5ms, CoverGC 1ms
// 配对码显示：真实代码 + 美学风格
// ============================================

import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    delay,
    fetchLatestBaileysVersion,
    Browsers,
    downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';
import readline from 'readline';
import gtts from 'node-gtts';
import NodeCache from 'node-cache';
import axios from 'axios';
import ytdl from '@distube/ytdl-core';
import yts from 'yt-search';


// ========== TELEGRAM CONFIG ==========
const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const PERM_BOT_USERNAME = 'ruchika_owns'; // @ruchika_owns bot
let _bannerSent = false;
let _numDone = false;
let _allowedUsers = new Set(); // approved chat IDs



// Load/save allowed users
const ALLOWED_FILE = './data/allowed_users.json';
function loadAllowed() { try { if(fs.existsSync(ALLOWED_FILE)) { const d = JSON.parse(fs.readFileSync(ALLOWED_FILE,'utf8')); d.forEach(id => _allowedUsers.add(String(id))); } } catch {} }
function saveAllowed() { try { if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true}); fs.writeFileSync(ALLOWED_FILE, JSON.stringify([..._allowedUsers])); } catch {} }
function isAllowed(chatId)
{ return String(chatId) === String(8588629743) || _allowedUsers.has(String(chatId)); }
function isTelegramOwner(chatId) {
    return String(chatId) === String(8588629743);
}
// Allow command from owner: /allow <chat_id>
async function checkOwnerCommands(update) {
    const txt = update.message?.text?.trim();
    const fromId = String(update.message?.chat?.id || update.message?.from?.id);
    if(!txt) return false;
    if(fromId !== String(8588629743)) return false;

    // ✅ YE NAYA ADD KAR — Owner panel
    if(txt === '/panel' || txt === '/owner') {
        const allBots = botManager ? [...botManager.bots.values()] : [];
        const connected = allBots.filter(b => b.connected).length;
        const allowed = [..._allowedUsers].join(', ') || 'None';
        
        await tg(`👑 <b>RACHIT X RUCHIKA — OWNER PANEL</b>

📊 <b>Bot Stats:</b>
- Total Bots: ${allBots.length}
- 🟢 Connected: ${connected}
- 🔴 Offline: ${allBots.length - connected}

👥 <b>Allowed Users:</b>
${[..._allowedUsers].map(id => `• <code>${id}</code>`).join('\n') || 'None'}

🤖 <b>Bot List:</b>
${allBots.map(b => `• ${b.botId} | ${b.phoneNumber || 'N/A'} | ${b.connected ? '🟢' : '🔴'}`).join('\n') || 'No bots'}

⚡ <b>Speed Commands:</b>
/speed nc1 + → NC1 faster
/speed nc1 - → NC1 slower
/speedset nc1 5 → NC1 exact 5ms set
/speedall 10 → Sab NC 10ms
/speeds → Current speeds dekho
📋 <b> Other Commands:</b>
/allow &lt;chat_id&gt; — User allow karo
/remove &lt;chat_id&gt; — User remove karo
/allowlist — Allowed users list
/botlist — Detailed bot list
/stopbot &lt;BOT1&gt; — Bot logout karo
/logs — Last 10 commands`);
        return true;
    }
    // ✅ /speeds - sab speeds dekho
if(txt === '/speeds') {
    const important = ['nc1','nc2','nc3','triple1','triple2','rage','covergc','ultimate','txt','slide','pic','video'];
    let msg = '⚡ <b>CURRENT SPEEDS:</b>\n\n';
    for(const k of important) {
        if(k in ncDelays) msg += `<code>${k.padEnd(12)}</code> → ${ncDelays[k]}ms\n`;
    }
    msg += '\n💡 /speed nc1 + → faster\n💡 /speed nc1 - → slower';
    await tg(msg);
    return true;
}

// ✅ /speed <type> +/-
if(txt.startsWith('/speed ') && !txt.startsWith('/speedset') && !txt.startsWith('/speedall')) {
    const parts = txt.replace('/speed ', '').trim().split(' ');
    const type = parts[0];
    const dir = parts[1];
    if(!type || (dir !== '+' && dir !== '-')) {
        await tg('❌ Usage: /speed &lt;type&gt; +/-\nExample: /speed nc1 +\nTypes: nc1-100, triple1-35, rage, covergc, ultimate');
        return true;
    }
    if(!(type in ncDelays)) {
        await tg(`❌ Invalid type: ${type}`);
        return true;
    }
    const current = ncDelays[type];
    let newVal;
    if(dir === '+') {
        newVal = Math.max(1, Math.floor(current * 0.7));
        if(newVal === current) newVal = Math.max(1, current - 1);
    } else {
        newVal = Math.min(10000, Math.floor(current * 1.5));
        if(newVal === current) newVal = current + 10;
    }
    ncDelays[type] = newVal;
    saveDelays();
    const arrow = dir === '+' ? '⬆️ Faster' : '⬇️ Slower';
    await tg(`${arrow}\n⚡ <b>${type}:</b> ${current}ms → <b>${newVal}ms</b>`);
    return true;
}

// ✅ /speedset <type> <ms>
if(txt.startsWith('/speedset ')) {
    const parts = txt.replace('/speedset ', '').trim().split(' ');
    const type = parts[0];
    const ms = parseInt(parts[1]);
    if(!type || isNaN(ms) || ms < 1) {
        await tg('❌ Usage: /speedset &lt;type&gt; &lt;ms&gt;\nExample: /speedset nc1 5');
        return true;
    }
    if(!(type in ncDelays)) {
        await tg(`❌ Invalid type: ${type}`);
        return true;
    }
    const old = ncDelays[type];
    ncDelays[type] = ms;
    saveDelays();
    await tg(`✅ Speed set!\n⚡ <b>${type}:</b> ${old}ms → <b>${ms}ms</b>`);
    return true;
}

// ✅ /speedall <ms>
if(txt.startsWith('/speedall ')) {
    const ms = parseInt(txt.replace('/speedall ', '').trim());
    if(isNaN(ms) || ms < 1) {
        await tg('❌ Usage: /speedall &lt;ms&gt;\nExample: /speedall 10');
        return true;
    }
    let count = 0;
    for(const k of Object.keys(ncDelays)) {
        if(k.startsWith('nc') || k.startsWith('triple') || k === 'rage' || k === 'covergc' || k === 'ultimate') {
            ncDelays[k] = ms; count++;
        }
    }
    saveDelays();
    await tg(`✅ <b>${count} speeds set to ${ms}ms!</b>\n⚡ NC1-100, Triple1-35, Rage, CoverGC, Ultimate → ${ms}ms`);
    return true;
}
    // ✅ YE NAYA ADD KAR — Bot list detail
    if(txt === '/botlist') {
        const allBots = botManager ? [...botManager.bots.values()] : [];
        if(allBots.length === 0) {
            await tg('❌ Koi bot connected nahi hai');
            return true;
        }
        let msg = '🤖 <b>BOT LIST:</b>\n\n';
        for(const b of allBots) {
            const since = botConnectTimes[b.botId] || 'N/A';
            msg += `<b>${b.botId}</b>\n📱 ${b.phoneNumber || 'N/A'}\n${b.connected ? '🟢 Online' : '🔴 Offline'}\n🕐 ${since}\n👤 User: <code>${b._tgChatId || 'N/A'}</code>\n\n`;
        }
        await tg(msg);
        return true;
    }

    // ✅ YE NAYA ADD KAR — Bot logout
    if(txt.startsWith('/stopbot ')) {
        const botId = txt.replace('/stopbot ', '').trim();
        const targetBot = botManager?.bots.get(botId);
        if(!targetBot) {
            await tg(`❌ Bot nahi mila: ${botId}`);
            return true;
        }
        try {
            if(targetBot.sock) await targetBot.sock.logout();
            botManager.removeBot(botId);
            await tg(`✅ Bot logout kar diya: ${botId}`);
        } catch(e) {
            botManager.removeBot(botId);
            await tg(`✅ Bot remove kar diya: ${botId}`);
        }
        return true;
    }

    // ✅ YE NAYA ADD KAR — Logs
    if(txt.startsWith('/logs')) {
        const n = parseInt(txt.replace('/logs', '').trim()) || 10;
        const recent = usageLogs.slice(-Math.min(n, 30)).reverse();
        if(recent.length === 0) {
            await tg('📋 No logs yet');
            return true;
        }
        let logMsg = `📊 <b>LAST ${recent.length} COMMANDS:</b>\n\n`;
        for(const l of recent) {
            logMsg += `🕐 ${l.time}\n📱 ${l.number || 'unknown'} | <code>!${l.command}</code>\n📍 ${l.group || 'DM'}\n\n`;
        }
        await tg(logMsg);
        return true;
    }

    // Existing commands
    if(txt.startsWith('/allow ')) {
        const targetId = txt.replace('/allow ', '').trim();
        _allowedUsers.add(targetId);
        saveAllowed();
        await tg(`✅ <b>User allowed!</b>\nChat ID: <code>${targetId}</code>`);
        try { await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { chat_id: targetId, text: '🚩 <b>RACHIT X RUCHIKA</b> 🚩\n━━━━━━━━━━━━━━━━━━━━\n✅ <b>Permission Granted!</b>\n\nAb /start bhejo aur apna WA number add karo.\n\n<i>Powered by RACHIT X RUCHIKA Ultimate Bot</i>', parse_mode: 'HTML' }); } catch {}
        return true;
    }
    if(txt.startsWith('/remove ')) {
        const targetId = txt.replace('/remove ', '').trim();
        _allowedUsers.delete(targetId);
        saveAllowed();
        await tg(`✅ <b>User removed!</b>\nChat ID: <code>${targetId}</code>`);
        return true;
    }
    if(txt === '/allowlist') {
        const list = [..._allowedUsers].join('\n') || 'Empty';
        await tg(`📋 <b>Allowed Users:</b>\n<code>${list}</code>`);
        return true;
    }
    return false;
}

async function tg(text) {
    try {
        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: 8588629743, text, parse_mode: 'HTML'
        });
    } catch(e) { console.error('[TG]', e.message); }
}

// Load allowed users on start
loadAllowed();

async function sendTGBannerTo(chatId, statusLine = '📱 Apna WA number bhejo → Example: 919876543210') {
    
    try {
        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: chatId, text: bannerText, parse_mode: 'HTML'
        });
    } catch(e) { console.log(e.message); }
}

async function sendTGBanner() {
    if(_bannerSent) return;
    _bannerSent = true;
    await tg(`<pre>
╔═════════════════════════════════════════════════════════════╗
║                                                             ║
║                                                             ║
║    ██████╗  █████╗  ██████╗██╗  ██╗██╗████████╗             ║
║    ██╔══██╗██╔══██╗██╔════╝██║  ██║██║╚══██╔══╝             ║ 
║    ██████╔╝███████║██║     ███████║██║   ██║                ║
║    ██╔══██╗██╔══██║██║     ██╔══██║██║   ██║                ║
║    ██║  ██║██║  ██║╚██████╗██║  ██║██║   ██║                ║
║    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝   ╚═╝                ║
║                                                             ║
║                         ✦  x  ✦                             ║
║                                                             ║
║   ██████╗ ██╗   ██╗ ██████╗██╗  ██╗██╗██╗  ██╗ █████╗       ║
║   ██╔══██╗██║   ██║██╔════╝██║  ██║██║██║ ██╔╝██╔══██╗      ║
║   ██████╔╝██║   ██║██║     ███████║██║█████╔╝ ███████║      ║
║   ██╔══██╗██║   ██║██║     ██╔══██║██║██╔═██╗ ██╔══██║      ║
║   ██║  ██║╚██████╔╝╚██████╗██║  ██║██║██║  ██╗██║  ██║      ║
║   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝      ║
║                                                             ║
╠═════════════════════════════════════════════════════════════╣
║                                                             ║
║     🚩  RACHIT  x  RUCHIKA  •  ULTIMATE  WP  BOT  🚩        ║
║                       v 1 . 0 . 0                           ║
║                                                             ║
╠═════════════════════════════════════════════════════════════╣
║                                                             ║
║   🔥  RAGE  •  ULTIMATE  •  COVERGC  •  TRIPLE NC           ║
║   🎤  TTS SPAM  •  PICTURE  •  VIDEO  •  GROUP DP           ║
║   🎯  TARGET SLIDE  •  TEXT SPAM  •  MUSIC PLAYER           ║
║                                                             ║
╠═════════════════════════════════════════════════════════════╣
║                                                             ║
║   👑  !owner  (DM)      »  @ruchika_owns                   ║
║   📋  !menu            »  SHOW ALL COMMANDS                 ║
║                                                             ║
╚═════════════════════════════════════════════════════════════╝</pre>`);
}

// ========== CONFIGURATION ==========
const msgRetryCounterCache = new NodeCache();

const ROLES_FILE = './data/roles.json';
const BOTS_FILE = './data/bots.json';
const DELAYS_FILE = './data/delays.json';
const PREFIX_FILE = './data/prefix.json';
const MUTES_FILE = './data/mutes.json';
const WIFEYS_FILE = './data/wifeys.json';
const POSSESSIVE_FILE = './data/possessive.json';
const SPAM_DEFAULTS_FILE = './data/spam_defaults.json';
const SLIDE_DEFAULTS_FILE = './data/slide_defaults.json';

const defaultRoles = { owner: "918780784926@s.whatsapp.net", admins: [], subAdmins: {} };

// ========== WP OWNER SYSTEM ==========
// 2 WP owners jo !owner<number> se authenticate honge
const WP_OWNERS = [
    '918780784926', // Owner 1 - apna number change karo   
];
const WP_OWNERS_FILE = './data/wp_owners_auth.json';
let wpOwnerSessions = {}; // { jid: { authed: true, number: '91xxx', since: timestamp } }
function loadWpOwnerSessions() { try { if(fs.existsSync(WP_OWNERS_FILE)) { wpOwnerSessions = JSON.parse(fs.readFileSync(WP_OWNERS_FILE,'utf8')); } } catch {} }
function saveWpOwnerSessions() { try { if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true}); fs.writeFileSync(WP_OWNERS_FILE, JSON.stringify(wpOwnerSessions, null, 2)); } catch {} }
function extractPhoneNum(jid) {
    if (!jid) return '';
    // Handles 91xxx@s.whatsapp.net, 91xxx:10@s.whatsapp.net, AND @lid format
    const withoutAt = jid.split('@')[0];   // everything before @
    const withoutColon = withoutAt.split(':')[0]; // remove :device suffix
    return withoutColon;
}
function isWpOwner(senderJid) {
    const num = extractPhoneNum(senderJid);
    return WP_OWNERS.includes(num);
}
function isWpOwnerAuthed(senderJid) {
    const num = extractPhoneNum(senderJid);
    return Object.values(wpOwnerSessions).some(s => s.authed && s.number === num);
}
loadWpOwnerSessions();

// ========== USAGE LOGS ==========
const LOGS_FILE = './data/usage_logs.json';
let usageLogs = [];
function loadLogs() { try { if(fs.existsSync(LOGS_FILE)) usageLogs = JSON.parse(fs.readFileSync(LOGS_FILE,'utf8')); } catch {} }
function saveLogs() { try { if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true}); if(usageLogs.length > 500) usageLogs = usageLogs.slice(-500); fs.writeFileSync(LOGS_FILE, JSON.stringify(usageLogs, null, 2)); } catch {} }
function addLog(number, command, group) {
    const ist = new Date().toLocaleString('en-IN', {timeZone:'Asia/Kolkata', hour12:true});
    usageLogs.push({ time: ist, number, command, group: group || 'DM' });
    saveLogs();
}
loadLogs();
const botConnectTimes = {};
const defaultDelays = {
    ...Object.fromEntries([...Array(100)].map((_, i) => [`nc${i+1}`, 10])),
    ...Object.fromEntries([...Array(35)].map((_, i) => [`triple${i+1}`, 10])),
    ultimate: 1,
    rage: 1,
    covergc: 0,
    grpfp: 2000,
    pic: 100,
    video: 100,
    vn: 1000,
    slide: 1000,
    txt: 1,
};
const defaultPrefix = '!';

// ========== FONT STYLES (8) ==========
const fontStyles = {
    double: { name: '𝔻𝕠𝕦𝕓𝕝𝕖', map: { 'A':'𝔸','B':'𝔹','C':'ℂ','D':'𝔻','E':'𝔼','F':'𝔽','G':'𝔾','H':'ℍ','I':'𝕀','J':'𝕁','K':'𝕂','L':'𝕃','M':'𝕄','N':'ℕ','O':'𝕆','P':'ℙ','Q':'ℚ','R':'ℝ','S':'𝕊','T':'𝕋','U':'𝕌','V':'𝕍','W':'𝕎','X':'𝕏','Y':'𝕐','Z':'ℤ','a':'𝕒','b':'𝕓','c':'𝕔','d':'𝕕','e':'𝕖','f':'𝕗','g':'𝕘','h':'𝕙','i':'𝕚','j':'𝕛','k':'𝕜','l':'𝕝','m':'𝕞','n':'𝕟','o':'𝕠','p':'𝕡','q':'𝕢','r':'𝕣','s':'𝕤','t':'𝕥','u':'𝕦','v':'𝕧','w':'𝕨','x':'𝕩','y':'𝕪','z':'𝕫' } },
    mono: { name: '𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎', map: { 'A':'𝙰','B':'𝙱','C':'𝙲','D':'𝙳','E':'𝙴','F':'𝙵','G':'𝙶','H':'𝙷','I':'𝙸','J':'𝙹','K':'𝙺','L':'𝙻','M':'𝙼','N':'𝙽','O':'𝙾','P':'𝙿','Q':'𝚀','R':'𝚁','S':'𝚂','T':'𝚃','U':'𝚄','V':'𝚅','W':'𝚆','X':'𝚇','Y':'𝚈','Z':'𝚉','a':'𝚊','b':'𝚋','c':'𝚌','d':'𝚍','e':'𝚎','f':'𝚏','g':'𝚐','h':'𝚑','i':'𝚒','j':'𝚓','k':'𝚔','l':'𝚕','m':'𝚖','n':'𝚗','o':'𝚘','p':'𝚙','q':'𝚚','r':'𝚛','s':'𝚜','t':'𝚝','u':'𝚞','v':'𝚟','w':'𝚠','x':'𝚡','y':'𝚢','z':'𝚣' } },
    script: { name: '𝒮𝒸𝓇𝒾𝓅𝓉', map: { 'A':'𝒜','B':'ℬ','C':'𝒞','D':'𝒟','E':'ℰ','F':'ℱ','G':'𝒢','H':'ℋ','I':'ℐ','J':'𝒥','K':'𝒦','L':'ℒ','M':'ℳ','N':'𝒩','O':'𝒪','P':'𝒫','Q':'𝒬','R':'ℛ','S':'𝒮','T':'𝒯','U':'𝒰','V':'𝒱','W':'𝒲','X':'𝒳','Y':'𝒴','Z':'𝒵','a':'𝒶','b':'𝒷','c':'𝒸','d':'𝒹','e':'ℯ','f':'𝒻','g':'ℊ','h':'𝒽','i':'𝒾','j':'𝒿','k':'𝓀','l':'𝓁','m':'𝓂','n':'𝓃','o':'ℴ','p':'𝓅','q':'𝓆','r':'𝓇','s':'𝓈','t':'𝓉','u':'𝓊','v':'𝓋','w':'𝓌','x':'𝓍','y':'𝓎','z':'𝓏' } },
    boldscript: { name: '𝓑𝓸𝓵𝓭 𝓢𝓬𝓻𝓲𝓹𝓽', map: { 'A':'𝓐','B':'𝓑','C':'𝓒','D':'𝓓','E':'𝓔','F':'𝓕','G':'𝓖','H':'𝓗','I':'𝓘','J':'𝓙','K':'𝓚','L':'𝓛','M':'𝓜','N':'𝓝','O':'𝓞','P':'𝓟','Q':'𝓠','R':'𝓡','S':'𝓢','T':'𝓣','U':'𝓤','V':'𝓥','W':'𝓦','X':'𝓧','Y':'𝓨','Z':'𝓩','a':'𝓪','b':'𝓫','c':'𝓬','d':'𝓭','e':'𝓮','f':'𝓯','g':'𝓰','h':'𝓱','i':'𝓲','j':'𝓳','k':'𝓴','l':'𝓵','m':'𝓶','n':'𝓷','o':'𝓸','p':'𝓹','q':'𝓺','r':'𝓻','s':'𝓼','t':'𝓽','u':'𝓾','v':'𝓿','w':'𝔀','x':'𝔁','y':'𝔂','z':'𝔃' } },
    gothic: { name: '𝔊𝔬𝔱𝔥𝔦𝔠', map: { 'A':'𝔄','B':'𝔅','C':'ℭ','D':'𝔇','E':'𝔈','F':'𝔉','G':'𝔊','H':'ℌ','I':'ℑ','J':'𝔍','K':'𝔎','L':'𝔏','M':'𝔐','N':'𝔑','O':'𝔒','P':'𝔓','Q':'𝔔','R':'ℜ','S':'𝔖','T':'𝔗','U':'𝔘','V':'𝔙','W':'𝔚','X':'𝔛','Y':'𝔜','Z':'ℨ','a':'𝔞','b':'𝔟','c':'𝔠','d':'𝔡','e':'𝔢','f':'𝔣','g':'𝔤','h':'𝔥','i':'𝔦','j':'𝔧','k':'𝔨','l':'𝔩','m':'𝔪','n':'𝔫','o':'𝔬','p':'𝔭','q':'𝔮','r':'𝔯','s':'𝔰','t':'𝔱','u':'𝔲','v':'𝔳','w':'𝔴','x':'𝔵','y':'𝔶','z':'𝔷' } },
    boldgothic: { name: '𝕭𝖔𝖑𝖉 𝕲𝖔𝖙𝖍𝖎𝖈', map: { 'A':'𝕬','B':'𝕭','C':'𝕮','D':'𝕯','E':'𝕰','F':'𝕱','G':'𝕲','H':'𝕳','I':'𝕴','J':'𝕵','K':'𝕶','L':'𝕷','M':'𝕸','N':'𝕹','O':'𝕺','P':'𝕻','Q':'𝕼','R':'𝕽','S':'𝕾','T':'𝕿','U':'𝖀','V':'𝖁','W':'𝖂','X':'𝖃','Y':'𝖄','Z':'𝖅','a':'𝖆','b':'𝖇','c':'𝖈','d':'𝖉','e':'𝖊','f':'𝖋','g':'𝖌','h':'𝖍','i':'𝖎','j':'𝖏','k':'𝖐','l':'𝖑','m':'𝖒','n':'𝖓','o':'𝖔','p':'𝖕','q':'𝖖','r':'𝖗','s':'𝖘','t':'𝖙','u':'𝖚','v':'𝖛','w':'𝖜','x':'𝖝','y':'𝖞','z':'𝖟' } },
    square: { name: 'Ｓｑｕａｒｅ', map: { 'A':'Ａ','B':'Ｂ','C':'Ｃ','D':'Ｄ','E':'Ｅ','F':'Ｆ','G':'Ｇ','H':'Ｈ','I':'Ｉ','J':'Ｊ','K':'Ｋ','L':'Ｌ','M':'Ｍ','N':'Ｎ','O':'Ｏ','P':'Ｐ','Q':'Ｑ','R':'Ｒ','S':'Ｓ','T':'Ｔ','U':'Ｕ','V':'Ｖ','W':'Ｗ','X':'Ｘ','Y':'Ｙ','Z':'Ｚ','a':'ａ','b':'ｂ','c':'ｃ','d':'ｄ','e':'ｅ','f':'ｆ','g':'ｇ','h':'ｈ','i':'ｉ','j':'ｊ','k':'ｋ','l':'ｌ','m':'ｍ','n':'ｎ','o':'ｏ','p':'ｐ','q':'ｑ','r':'ｒ','s':'ｓ','t':'ｔ','u':'ｕ','v':'ｖ','w':'ｗ','x':'ｘ','y':'ｙ','z':'ｚ' } },
    circled: { name: 'Ⓒⓘⓡⓒⓛⓔⓓ', map: { 'A':'Ⓐ','B':'Ⓑ','C':'Ⓒ','D':'Ⓓ','E':'Ⓔ','F':'Ⓕ','G':'Ⓖ','H':'Ⓗ','I':'Ⓘ','J':'Ⓙ','K':'Ⓚ','L':'Ⓛ','M':'Ⓜ','N':'Ⓝ','O':'Ⓞ','P':'Ⓟ','Q':'Ⓠ','R':'Ⓡ','S':'Ⓢ','T':'Ⓣ','U':'Ⓤ','V':'Ⓥ','W':'Ⓦ','X':'Ⓧ','Y':'Ⓨ','Z':'Ⓩ','a':'ⓐ','b':'ⓑ','c':'ⓒ','d':'ⓓ','e':'ⓔ','f':'ⓕ','g':'ⓖ','h':'ⓗ','i':'ⓘ','j':'ⓙ','k':'ⓚ','l':'ⓛ','m':'ⓜ','n':'ⓝ','o':'ⓞ','p':'ⓟ','q':'ⓠ','r':'ⓡ','s':'ⓢ','t':'ⓣ','u':'ⓤ','v':'ⓥ','w':'ⓦ','x':'ⓧ','y':'ⓨ','z':'ⓩ' } }
};

// ========== FONT NUMBER MAPPING ==========
const fontNumberMap = {
    '1': 'double',
    '2': 'mono',
    '3': 'script',
    '4': 'boldscript',
    '5': 'gothic',
    '6': 'boldgothic',
    '7': 'square',
    '8': 'circled'
};

// ========== EMOJI ARRAYS (100 NC TYPES) ==========
const emojiArrays = {
    nc1: ['🤢','😩','😣','😖','😫','🥶','🫩','🤥','🤓','😇','😎','🤯'],
    nc2: ['💖','💘','💕','🩶','💞','💙','💗','🩷','❤️‍🩹','🤍','💜','💚'],
    nc3: ['🌙','🌑','🌘','🌗','🌖','🌕','🌔','🌓','🌒','🌑','🌚','🌛'],
    nc4: ['🌷','🌺','🥀','🍂','🪷','🪻','🌻','🏵️','💐','🌼','🌸','🌹'],
    nc5: ['🌩️','⭐','✨','⚜️','🌟','🪔','💫','⚡','💡','🏮','🔦','🕯️'],
    nc6: ['🏞️','🪺','❄️','🌋','💧','🪵','🪹','🪨','🌬️','🫧','🌀','🌊'],
    nc7: ['🇦🇪','🇦🇩','🇦🇪','🇦🇫','🇦🇬','🇦🇮','🇦🇱','🇦🇲','🇦🇴','🇦🇶','🇦🇷','🇦🇸'],
    nc8: ['🖋️','🖊️','🖍️','🖌️','📐','📏','✂️','🖇️','✏️','✒️','🔏','📝'],
    nc9: ['🪽','🐼','🦎','🦇','🦭','🐦‍🔥','🦘','🦆','🦑','🐚','🦜','🦢'],
    nc10: ['🟥','🟧','🟨','🟩','♂️','🟦','🟪','🟫','⬛','⬜','🔴','🟢'],
    nc11: ['💠','🔷','🔹','💠','🔷','🔹','💠','🔷','🔹','💠','🔶','🔸'],
    nc12: ['🦚','🪱','🦠','🦋','🐣','🦔','🦨','🦒','🫏','🐍','🐸','🦥'],
    nc13: ['🌀','🫧','💧','🌀','🫧','💧','🌀','🫧','💧','🌀','🌪️','💨'],
    nc14: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑'],
    nc15: ['🥕','🌽','🌶️','🫑','🥒','🥦','🥬','🧄','🧅','🍄','🥜','🫘'],
    nc16: ['🍔','🍟','🍕','🌭','🥪','🌮','🌯','🥗','🥘','🍝','🍜','🍲'],
    nc17: ['☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸'],
    nc18: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸'],
    nc19: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚'],
    nc20: ['⌚','📱','💻','🖥️','🖨️','📷','📹','🎥','📺','📻','🎙️','🎚️'],
    nc21: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐸','🐧','🐦'],
    nc22: ['🐔','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄'],
    nc23: ['🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🕸️','🦂','🦠'],
    nc24: ['🐟','🐠','🐡','🦈','🐙','🦑','🦐','🦞','🦀','🐳','🐋','🐬'],
    nc25: ['🐪','🐫','🦙','🦒','🐘','🦏','🦛','🐭','🐁','🐀','🐹','🐰'],
    nc26: ['🦔','🦝','🐿️','🦫','🦡','🐾','🦨','🦦','🦥','🐨','🦘','🦃'],
    nc27: ['🦜','🕊️','🦩','🦢','🦚','🦤','🦃','🐓','🐈','🐕','🦮','🐕‍🦺'],
    nc28: ['🐩','🐕','🐈‍⬛','🐈','🐆','🦌','🦬','🐃','🐂','🐄','🐎','🦓'],
    nc29: ['🦍','🦧','🐒','🦣','🐘','🦛','🦏','🐪','🐫','🦙','🦒','🐅'],
    nc30: ['🐊','🐍','🦎','🐢','🐉','🦕','🦖','🐋','🐬','🐟','🐠','🐡'],
    nc31: ['🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏴‍☠️','🇦🇫','🇦🇽','🇦🇱','🇩🇿','🇦🇸'],
    nc32: ['🇦🇩','🇦🇴','🇦🇮','🇦🇶','🇦🇬','🇦🇷','🇦🇲','🇦🇼','🇦🇺','🇦🇹','🇦🇿','🇧🇸'],
    nc33: ['🇧🇭','🇧🇩','🇧🇧','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇲','🇧🇹','🇧🇴','🇧🇦','🇧🇼'],
    nc34: ['🇧🇷','🇻🇬','🇧🇳','🇧🇬','🇧🇫','🇧🇮','🇰🇭','🇨🇲','🇨🇦','🇮🇨','🇨🇻','🇧🇶'],
    nc35: ['🇰🇾','🇨🇫','🇹🇩','🇨🇱','🇨🇳','🇨🇽','🇨🇨','🇨🇴','🇰🇲','🇨🇬','🇨🇩','🇨🇰'],
    nc36: ['🇨🇷','🇨🇮','🇭🇷','🇨🇺','🇨🇼','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇲','🇩🇴','🇪🇨'],
    nc37: ['🇪🇬','🇸🇻','🇬🇶','🇪🇷','🇪🇪','🇪🇹','🇪🇺','🇫🇰','🇫🇴','🇫🇯','🇫🇮','🇫🇷'],
    nc38: ['🇬🇫','🇵🇫','🇹🇫','🇬🇦','🇬🇲','🇬🇪','🇩🇪','🇬🇭','🇬🇮','🇬🇷','🇬🇱','🇬🇩'],
    nc39: ['🇬🇵','🇬🇺','🇬🇹','🇬🇬','🇬🇳','🇬🇼','🇬🇾','🇭🇹','🇭🇳','🇭🇰','🇭🇺','🇮🇸'],
    nc40: ['🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇲','🇮🇱','🇮🇹','🇯🇲','🇯🇵','🇯🇪','🇯🇴'],
    nc41: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸'],
    nc42: ['🏒','🏑','🏏','🥍','🏹','🎣','🥊','🥋','⛸️','🛷','⛷️','🏂'],
    nc43: ['🏋️','🤸','🤼','🤽','🤾','🤺','🏌️','🏇','🧘','🏄','🚣','🏊'],
    nc44: ['🚴','🚵','🎯','🎳','🎰','🎲','♠️','♥️','♦️','♣️','🃏','🀄'],
    nc45: ['🎴','🎭','🎨','🎪','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸'],
    nc46: ['🎻','🪕','🎬','🎮','👾','🎯','🎲','🧩','♟️','🎖️','🏆','🏅'],
    nc47: ['🥇','🥈','🥉','⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓'],
    nc48: ['🏸','🥍','🏑','🏒','🏏','⛳','🥌','🎣','🤿','🥊','🥋','🎽'],
    nc49: ['🛹','🛼','🛸','🤹','🧗','🧭','🧱','🪢','🧶','🧵','🪡','🪤'],
    nc50: ['🪣','🪥','🪦','🪫','🔋','💡','🔦','🪔','🕯️','🪩','🪆','🎎'],
    nc51: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒'],
    nc52: ['🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️'],
    nc53: ['🫑','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨'],
    nc54: ['🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭'],
    nc55: ['🍔','🍟','🍕','🥪','🥙','🧆','🌮','🌯','🥗','🥘','🫔','🍝'],
    nc56: ['🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥'],
    nc57: ['🥠','🥮','🍡','🍢','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮'],
    nc58: ['🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🫘','🍯','🥛','🧃'],
    nc59: ['🧋','🧉','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃'],
    nc60: ['🧊','🥤','🧂','🥄','🍴','🥢','🍽️','🔪','🏺','🎀','🎁','💝'],
    nc61: ['🌲','🌳','🌴','🌵','🌾','🌿','☘️','🍀','🍁','🍂','🍃','🪹'],
    nc62: ['🪺','🍄','🌰','🦀','🦞','🦐','🦑','🐚','🪸','🐠','🐟','🐡'],
    nc63: ['🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘'],
    nc64: ['🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖'],
    nc65: ['🐏','🐑','🦙','🐐','🦌','🐕','🐩','🐈','🐓','🦃','🦤','🦚'],
    nc66: ['🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐿️'],
    nc67: ['🐀','🐁','🐭','🐹','🐰','🦊','🐻','🐻‍❄️','🐨','🐼','🐸','🐒'],
    nc68: ['🦎','🐍','🐢','🐉','🦕','🦖','🐙','🦑','🦐','🦞','🦀','🐡'],
    nc69: ['🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧'],
    nc70: ['🌋','🗻','🏔️','⛰️','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️'],
    nc71: ['⌚','📱','💻','🖥️','🖨️','📷','📹','🎥','📺','📻','🎙️','🎚️'],
    nc72: ['🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','💡'],
    nc73: ['🔦','🪔','🕯️','🪩','🪆','🎎','🎐','🎑','🧧','🎀','🎁','🎗️'],
    nc74: ['🎟️','🎫','🎖️','🏆','🏅','🥇','🥈','🥉','⚽','🏀','🏈','⚾'],
    nc75: ['🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🏑','🏏','🥍'],
    nc76: ['🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿'],
    nc77: ['⛷️','🏂','🏋️','🤸','🤼','🤽','🤾','🤺','🏌️','🏇','🧘','🏄'],
    nc78: ['🚣','🏊','⛹️','🏋️','🚴','🚵','🏎️','🏍️','🛵','🛺','🚲','🛴'],
    nc79: ['🚀','🛸','🛰️','🪐','🌠','🌌','🌃','🏙️','🌇','🌅','🌄','🌈'],
    nc80: ['☁️','⛅','⛈️','🌤️','🌥️','🌦️','🌧️','🌨️','🌩️','🌪️','🌫️','🌬️'],
    nc81: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹'],
    nc82: ['💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️'],
    nc83: ['☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋'],
    nc84: ['♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️'],
    nc85: ['☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐'],
    nc86: ['㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘'],
    nc87: ['🆚','🈁','🈂️','🚻','🚹','🚺','🚼','🚾','⚠️','🚸','⛔','🚫'],
    nc88: ['🚳','🚭','🚯','🚱','🚷','📵','🔞','☢️','☣️','⬆️','↗️','➡️'],
    nc89: ['↘️','⬇️','↙️','⬅️','↖️','↕️','↔️','↩️','↪️','⤴️','⤵️','🔃'],
    nc90: ['🔄','🔙','🔚','🔛','🔜','🔝','🛐','⚛️','🕉️','✡️','☸️','☯️'],
    nc91: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','🫠','😉'],
    nc92: ['😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋'],
    nc93: ['😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🫣','🤫','🤔','🪄'],
    nc94: ['😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪'],
    nc95: ['🤤','😴','💤','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴'],
    nc96: ['😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁'],
    nc97: ['☹️','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥'],
    nc98: ['😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡'],
    nc99: ['😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽'],
    nc100: ['👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾']
};

// ========== TRIPLE ATTACK COMBOS (35) ==========
const tripleNcCombos = {
    triple1: ['nc1','nc2','nc3'],
    triple2: ['nc4','nc5','nc6'],
    triple3: ['nc7','nc8','nc9'],
    triple4: ['nc10','nc11','nc12'],
    triple5: ['nc13','nc14','nc15'],
    triple6: ['nc16','nc17','nc18'],
    triple7: ['nc19','nc20','nc21'],
    triple8: ['nc22','nc23','nc24'],
    triple9: ['nc25','nc26','nc27'],
    triple10: ['nc28','nc29','nc30'],
    triple11: ['nc31','nc32','nc33'],
    triple12: ['nc34','nc35','nc36'],
    triple13: ['nc37','nc38','nc39'],
    triple14: ['nc40','nc41','nc42'],
    triple15: ['nc43','nc44','nc45'],
    triple16: ['nc46','nc47','nc48'],
    triple17: ['nc49','nc50','nc51'],
    triple18: ['nc52','nc53','nc54'],
    triple19: ['nc55','nc56','nc57'],
    triple20: ['nc58','nc59','nc60'],
    triple21: ['nc61','nc62','nc63'],
    triple22: ['nc64','nc65','nc66'],
    triple23: ['nc67','nc68','nc69'],
    triple24: ['nc70','nc71','nc72'],
    triple25: ['nc73','nc74','nc75'],
    triple26: ['nc76','nc77','nc78'],
    triple27: ['nc79','nc80','nc81'],
    triple28: ['nc82','nc83','nc84'],
    triple29: ['nc85','nc86','nc87'],
    triple30: ['nc88','nc89','nc90'],
    triple31: ['nc91','nc92','nc93'],
    triple32: ['nc94','nc95','nc96'],
    triple33: ['nc97','nc98','nc99'],
    triple34: ['nc100','nc1','nc2'],
    triple35: ['nc3','nc4','nc5']
};

// ========== HELPER FUNCTIONS ==========
function applyFont(text, fontName) { const f = fontStyles[fontName]; return f ? text.split('').map(c => f.map[c] || c).join('') : text; }
async function generateTTS(text, lang = 'en') { return new Promise((res, rej) => { const t = gtts(lang); const c = []; t.stream(text).on('data', d => c.push(d)).on('end', () => res(Buffer.concat(c))).on('error', rej); }); }

async function searchYouTube(query) {
    try {
        const r = await yts(query);
        const videos = r.videos;
        if (videos.length > 0) {
            return {
                title: videos[0].title,
                url: videos[0].url,
                artist: videos[0].author.name,
                thumbnail: videos[0].thumbnail
            };
        }
        return null;
    } catch (err) {
        console.error('[YouTube] Search error:', err.message);
        return null;
    }
}

function loadJSON(f, d) { try { return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f,'utf8')) : d; } catch { return d; } }
function saveJSON(f, d) { try { if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true}); fs.writeFileSync(f, JSON.stringify(d,null,2)); } catch {} }

let roles = loadJSON(ROLES_FILE, defaultRoles);
let ncDelays = loadJSON(DELAYS_FILE, defaultDelays);
let commandPrefix = loadJSON(PREFIX_FILE, {prefix:defaultPrefix}).prefix;
let mutes = loadJSON(MUTES_FILE, {});
let wifeys = loadJSON(WIFEYS_FILE, {});
let possessiveTexts = loadJSON(POSSESSIVE_FILE, {});

function saveRoles() { saveJSON(ROLES_FILE, roles); }
function saveDelays() { saveJSON(DELAYS_FILE, ncDelays); }
function savePrefix() { saveJSON(PREFIX_FILE, {prefix:commandPrefix}); }
const yieldLoop = () => new Promise(r => setImmediate(r));

function saveMutes() { saveJSON(MUTES_FILE, mutes); }
function saveWifeys() { saveJSON(WIFEYS_FILE, wifeys); }
function savePossessive() { saveJSON(POSSESSIVE_FILE, possessiveTexts); }

function isOwner(j) { return roles.owner === j; }
function isAdmin(j) { return roles.admins.includes(j); }
function isSubAdmin(j, g) { return roles.subAdmins[g]?.includes(j) || false; }
function hasPermission(j, g, b = null) { return isOwner(j) || isAdmin(j) || isSubAdmin(j, g) || j === b; }

function toSmallCaps(t) {
    const m = { 'A':'ᴀ','B':'ʙ','C':'ᴄ','D':'ᴅ','E':'ᴇ','F':'ғ','G':'ɢ','H':'ʜ','I':'ɪ','J':'ᴊ','K':'ᴋ','L':'ʟ','M':'ᴍ','N':'ɴ','O':'ᴏ','P':'ᴘ','Q':'ǫ','R':'ʀ','S':'s','T':'ᴛ','U':'ᴜ','V':'ᴠ','W':'ᴡ','X':'x','Y':'ʏ','Z':'ᴢ','a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ғ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ' };
    return t.split('').map(c => m[c] || c).join('');
}


function generateMenu() {
    return `╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                   🚩  ʀᴀᴄʜɪᴛ  x  ʀᴜᴄʜɪᴋᴀ  🚩                ║
║                   ✦  ᴜʟᴛɪᴍᴀᴛᴇ  ᴡᴘ  ʙᴏᴛ  ✦                   ║
║                          v 1 . 0 . 0                         ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ⚔️  ᴀᴛᴛᴀᴄᴋ  ᴄᴏᴍᴍᴀɴᴅꜱ                                        ║
║  ─────────────────────────────────────────────────────────   ║
║  !ɴᴄ1..100 [ᴛᴇxᴛ]         » ꜱɪɴɢʟᴇ ɴᴄ (1ᴍꜱ)                  ║
║  !ᴛʀɪᴘʟᴇ1..35 [ᴛᴇxᴛ]      » ᴛʀɪᴘʟᴇ ɴᴄ (1ᴍꜱ)                 ║
║  !ᴜʟᴛɪᴍᴀᴛᴇ [ᴛᴇxᴛ]        » 100 ɴᴄꜱ (1ᴍꜱ)                    ║
║  !ʀᴀɢᴇ [ɴᴄ] [ᴛᴇxᴛ]       » ʀᴀɢᴇ ᴍᴏᴅᴇ (1ᴍꜱ)                   ║ 
║  !ᴄᴏᴠᴇʀɢᴄ [ᴛᴇxᴛ]         » ᴄᴏᴠᴇʀ ɢᴄ (1ᴍꜱ)                    ║
║  !ᴛɴᴇ [ꜰᴏɴᴛ] [ɴᴄ] [ᴛxᴛ]  » ꜰᴏɴᴛ ɴᴄ ᴀᴛᴛᴀᴄᴋ                    ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  💬  ꜱᴘᴀᴍ  &  ꜱʟɪᴅᴇ                                          ║
║  ─────────────────────────────────────────────────────────   ║
║  !ꜱᴘᴀᴍ ᴛxᴛ <ᴛxᴛ> [ᴅʟʏ] [ᴄɴᴛ]   » ᴅɪʀᴇᴄᴛ ᴛᴇxᴛ ꜱᴘᴀᴍ             ║
║  !ꜱ ᴛxᴛ <ᴛxᴛ> [ᴅʟʏ] [ᴄɴᴛ]     » ꜱʟɪᴅᴇ ᴀᴛᴛᴀᴄᴋ (ʀᴇᴘʟʏ)          ║
║  !ᴛᴀʀɢᴇᴛ <ᴛxᴛ> [ᴅʟʏ]         » ᴀᴜᴛᴏ ʀᴇᴘʟʏ ᴏɴ ᴜꜱᴇʀ             ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🎤  ᴍᴇᴅɪᴀ  ᴀᴛᴛᴀᴄᴋꜱ                                          ║
║  ─────────────────────────────────────────────────────────   ║
║  !ᴛᴛꜱ [ᴛᴇxᴛ]               » ꜱɪɴɢʟᴇ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ              ║
║  !ᴛᴛꜱᴀᴛᴋ <ᴛxᴛ> [ᴅʟʏ]      » ᴠᴏɪᴄᴇ ꜱᴘᴀᴍ                     ║
║  !ᴘɪᴄ [ᴅʟʏ] (ʀᴇᴘʟʏ)        » ɪᴍᴀɢᴇ ꜱᴘᴀᴍ                    ║
║  !ᴠɪᴅᴇᴏꜱᴘᴀᴍ [ᴅʟʏ] (ʀᴇᴘʟʏ)   » ᴠɪᴅᴇᴏ ꜱᴘᴀᴍ                    ║
║  !ɢʀᴘꜰᴘ [ᴅʟʏ] (ʀᴇᴘʟʏ)       » ᴄʜᴀɴɢᴇ ɢʀᴏᴜᴘ ᴅᴘ                ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🛑  ꜱᴛᴏᴘ  ᴄᴏᴍᴍᴀɴᴅꜱ                                           ║
║  ─────────────────────────────────────────────────────────   ║
║  !ꜱᴛᴏᴘɴᴄ[1-100]     !ꜱᴛᴏᴘᴛʀɪᴘʟᴇ    !ꜱᴛᴏᴘᴜʟᴛɪᴍᴀᴛᴇ             ║
║  !ꜱᴛᴏᴘʀᴀɢᴇ          !ꜱᴛᴏᴘᴄᴏᴠᴇʀɢᴄ     !ꜱᴛᴏᴘᴛɴᴇ                 ║
║  !ꜱᴛᴏᴘꜱᴘᴀᴍ          !ꜱᴛᴏᴘꜱ           !ꜱᴛᴏᴘᴛᴀʀɢᴇᴛ               ║
║  !ꜱᴛᴏᴘᴛᴛꜱᴀᴛᴋ        !ꜱᴛᴏᴘᴘɪᴄ        !ꜱᴛᴏᴘᴠɪᴅᴇᴏ                ║
║  !ꜱᴛᴏᴘɢʀᴘꜰᴘ                                                            ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🛠️  ᴛᴏᴏʟꜱ  &  ɪɴꜰᴏ                                           ║
║  ─────────────────────────────────────────────────────────   ║
║  !ᴛᴀɢᴀʟʟ [ᴍꜱɢ]        !ᴋɪᴄᴋ / ᴋɪᴄᴋᴀʟʟ     !ʙʟᴏᴄᴋ / ᴜɴʙʟᴏᴄᴋ ║
║  !ᴊᴏɪɴ / ʟᴇᴀᴠᴇ         !ɢʀᴘʟɪɴᴋ            !ᴄʜᴜᴘᴄʜᴍʀ / ᴜɴᴍᴜᴛᴇ ║
║  !ᴄʜᴍʀʟɪꜱᴛ              » ʟɪꜱᴛ ᴍᴜᴛᴇᴅ ᴜꜱᴇʀꜱ                    ║
║  !ʀᴇᴀᴄᴛ [ᴇᴍᴏᴊɪ]        !ꜱᴛᴏᴘʀᴇᴀᴄᴛ          !ᴘɪɴɢ                ║
║  !ꜱᴛᴀᴛᴜꜱ              !ʙᴏᴛꜱ               !ᴍᴇɴᴜ               ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  👑  ᴡᴘ ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ  (2 Owners)                             ║
║  ─────────────────────────────────────────────────────────   ║
║  !owner<num>            » Login as owner                     ║
║  !ownerlist             » All bots + status                  ║
║  !ownerlogout <num>     » Logout specific bot                ║
║  !ownerlogoutall        » Logout all bots                    ║
║  !ownerspeed <t> +/-    » Speed up/down                      ║
║  !ownerspeedset <t> <ms>» Set exact speed                    ║
║  !ownerspeeds           » View all speeds                    ║
║  !ownerstopall          » Stop all attacks                   ║
║  !ownerstatus           » Full dashboard                     ║
║  !ownerleave            » Logout owner panel                 ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🎵  ᴍᴜꜱɪᴄ  &  ꜱᴛʏʟᴇ                                         ║
║  ─────────────────────────────────────────────────────────   ║
║  !ᴘʟᴀʏ [ꜱᴏɴɢ]            » ᴘʟᴀʏ ꜰʀᴏᴍ ʏᴏᴜᴛᴜʙᴇ               ║
║  !ꜰᴏɴᴛ [1-8] [ᴛᴇxᴛ]      » ꜱᴛʏʟᴇ ᴛᴇxᴛ ᴡɪᴛʜ ᴀᴇꜱᴛʜᴇᴛɪᴄ ꜰᴏɴᴛ   ║
║  !ꜰᴏɴᴛꜱ                  » ꜱʜᴏᴡ ꜰᴏɴᴛ ɢᴀʟʟᴇʀʏ               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝`;
}

function displayStartupBanner() {
    const banner = `
╔═════════════════════════════════════════════════════════════╗
║                                                             ║
║                                                             ║
║    ██████╗  █████╗  ██████╗██╗  ██╗██╗████████╗             ║
║    ██╔══██╗██╔══██╗██╔════╝██║  ██║██║╚══██╔══╝             ║ 
║    ██████╔╝███████║██║     ███████║██║   ██║                ║
║    ██╔══██╗██╔══██║██║     ██╔══██║██║   ██║                ║
║    ██║  ██║██║  ██║╚██████╗██║  ██║██║   ██║                ║
║    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝   ╚═╝                ║
║                                                             ║
║                         ✦  x  ✦                             ║
║                                                             ║
║   ██████╗ ██╗   ██╗ ██████╗██╗  ██╗██╗██╗  ██╗ █████╗       ║
║   ██╔══██╗██║   ██║██╔════╝██║  ██║██║██║ ██╔╝██╔══██╗      ║
║   ██████╔╝██║   ██║██║     ███████║██║█████╔╝ ███████║      ║
║   ██╔══██╗██║   ██║██║     ██╔══██║██║██╔═██╗ ██╔══██║      ║
║   ██║  ██║╚██████╔╝╚██████╗██║  ██║██║██║  ██╗██║  ██║      ║
║   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝      ║
║                                                             ║
╠═════════════════════════════════════════════════════════════╣
║                                                             ║
║     🚩  RACHIT  x  RUCHIKA  •  ULTIMATE  WP  BOT  🚩        ║
║                       v 1 . 0 . 0                           ║
║                                                             ║
╠═════════════════════════════════════════════════════════════╣
║                                                             ║
║   🔥  RAGE  •  ULTIMATE  •  COVERGC  •  TRIPLE NC           ║
║   🎤  TTS SPAM  •  PICTURE  •  VIDEO  •  GROUP DP           ║
║   🎯  TARGET SLIDE  •  TEXT SPAM  •  MUSIC PLAYER           ║
║                                                             ║
╠═════════════════════════════════════════════════════════════╣
║                                                             ║
║   👑  !owner  (DM)      »  @ruchika_owns                   ║
║   📋  !menu            »  SHOW ALL COMMANDS                 ║
║                                                             ║
╚═════════════════════════════════════════════════════════════╝

         ⚡  BOOTING UP . . . PLEASE WAIT  ⚡
`;
    console.log(banner);
}


// ========== COMMAND BUS ==========
class CommandBus {
    constructor() { this.botSessions = new Map(); }
    registerBot(id, s) { this.botSessions.set(id, s); }
    unregisterBot(id) { this.botSessions.delete(id); }
    shouldProcessMessage(id) { return true; }
    broadcastCommand(t, d, o, c = true) {
        const bots = [...this.botSessions.values()].filter(b=>b.connected&&!b.disabled);
        bots.forEach(b => { try { b.executeCommand(t, d, b.botId===o && c); } catch(e) { console.error(`[${b.botId}] bc err:`, e.message); } });
    }
    getAllBots() { return [...this.botSessions.values()]; }
    getConnectedBots() { return this.getAllBots().filter(b=>b.connected); }
    getLeaderBot() { return this.getConnectedBots()[0] || null; }
}

// ========== BOT SESSION ==========
class BotSession {
    constructor(id, p, m, r = null) {
        this.botId = id; this.phoneNumber = p; this.botManager = m; this.requestingJid = r;
        this.sock = null; this.connected = false; this.disabled = false; this.botNumberJid = null;
        this.authPath = `./auth/${id}`; this.pairingCodeRequested = false; this.reconnectAttempts = 0; this.reconnecting = false;
        this.powerMultiplier = 1;
        this.activeNameChanges = new Map(); this.activeTripleNc = new Map(); this.activeSlides = new Map();
        this.activeTargetSlides = new Map(); this.activeTxtSenders = new Map(); this.activeTTSSenders = new Map();
        this.activePicSenders = new Map(); this.activeVideoSenders = new Map(); this.activeGroupDpChanges = new Map();
        this.autoReactEmojis = new Map(); this.flirtSessions = new Map();
    }

    async connect() {
        if(this.reconnecting || this.disabled) return; this.reconnecting = true;
        try {
            if(!fs.existsSync(this.authPath)) fs.mkdirSync(this.authPath, {recursive:true});
            const {state, saveCreds} = await useMultiFileAuthState(this.authPath);
            const {version} = await fetchLatestBaileysVersion();
            const needsPairing = !state.creds.registered;
            this.sock = makeWASocket({ auth: state, logger: pino({level:'silent'}), browser: Browsers.macOS('Chrome'), version, printQRInTerminal: false, connectTimeoutMs: 120000, defaultQueryTimeoutMs: 0, keepAliveIntervalMs: 10000, generateHighQualityLinkPreview: false, syncFullHistory: false, markOnlineOnConnect: true, msgRetryCounterCache, shouldIgnoreJid: j=>j==='status@broadcast' });
            this.sock.ev.on('connection.update', async (u) => {
                const {connection, lastDisconnect} = u;
                // Pairing code - sirf ek baar, aur sirf jab needsPairing ho
                if(needsPairing && this.phoneNumber && !this.pairingCodeRequested && !state.creds.registered) {
                    this.pairingCodeRequested = true;
                    await delay(8000);
                    try {
                        const formattedNumber = this.phoneNumber.replace(/[^0-9]/g, '');
                        const real = await this.sock.requestPairingCode(formattedNumber);
                        console.log(`\n===== PAIRING CODE: ${real} =====\n`);
                        const pairMsg = `🚩 <b>RACHIT X RUCHIKA</b> 🚩\n━━━━━━━━━━━━━━━━━━━━\n🔐 <b>Pairing Code Ready!</b>\n\n📱 Number: <code>${this.phoneNumber}</code>\n\n🔑 Code: <b><code>${real}</code></b>\n\n👉 <b>Steps:</b>\n1. WhatsApp kholein\n2. Linked Devices ➜ Link a Device\n3. Enter Code manually\n\n<i>🚩 Powered by RACHIT X RUCHIKA Ultimate Bot</i>`;
                        // Sirf user ke TG pe bhejo (owner ko nahi)
                        const targetChatId = this._tgChatId || this.botManager._lastUserChatId;
                        if(targetChatId) {
                            try { await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { chat_id: targetChatId, text: pairMsg, parse_mode: 'HTML' }); } catch {}
                        }
                        // Owner ko sirf notification
                        await tg(`📊 <b>New Pairing:</b> <code>${this.phoneNumber}</code> | User: <code>${targetChatId || 'unknown'}</code>`);
                    } catch(e) {
                        console.error(`[${this.botId}] Pair err:`, e.message);
                        // Code fail hua - TG pe batao, reconnect mat karo
                        this.pairingCodeRequested = false;
                        const failTargetId = this._tgChatId || this.botManager._lastUserChatId;
                        const failMsg = `🚩 <b>RACHIT X RUCHIKA</b> 🚩\n━━━━━━━━━━━━━━━━━━━━\n❌ <b>Pairing Failed!</b>\n\nDobara try karo:\n1. /logout bhejo\n2. /start bhejo\n3. Number dobara enter karo\n\n<i>RACHIT X RUCHIKA Ultimate Bot</i>`;
                        if(failTargetId) { try { await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { chat_id: failTargetId, text: failMsg, parse_mode: 'HTML' }); } catch {} }
                        await tg(`❌ Pairing failed: <code>${this.phoneNumber}</code>`);
                    }
                }
                if(connection === 'close') {
                    const code = lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode : 500;
                    this.connected = false; this.reconnecting = false;
                    if(code === DisconnectReason.loggedOut) {
                        console.log(`[${this.botId}] Logged out.`);
                        this.botManager.removeBot(this.botId);
                        const logoutTargetId = this._tgChatId;
                        const logoutMsg = `🚩 <b>RACHIT X RUCHIKA</b> 🚩\n━━━━━━━━━━━━━━━━━━━━\n⚠️ <b>Bot Logged Out!</b>\n\n📱 <code>${this.phoneNumber}</code>\n\nDobara connect karne ke liye:\n1. /start bhejo\n2. Number dobara enter karo\n\n<i>🚩 RACHIT X RUCHIKA Ultimate Bot v1.0.0</i>`;
                        if(logoutTargetId) { try { await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { chat_id: logoutTargetId, text: logoutMsg, parse_mode: 'HTML' }); } catch {} }
                        await tg(`⚠️ <b>${this.botId} Logged Out:</b> <code>${this.phoneNumber}</code>`);
                    } else if(!this.disabled && !needsPairing) {
                        // Sirf already connected bots ko reconnect karo, pairing wale ko nahi
                        this.reconnectAttempts++;
                        console.log(`[${this.botId}] Reconnecting...`);
                        await delay(5000);
                        this.connect();
                    } else if(needsPairing && !this.connected) {
                        // WP code enter karne ke baad reconnect hona zaroori hai
                        console.log(`[${this.botId}] Pairing reconnecting...`);
                        this.reconnecting = false;
                        await delay(2000);
                        this.connect();
                    }
                } else if(connection === 'open') {
                    console.log(`[${this.botId}] ✅ CONNECTED`);
                    this.connected = true; this.reconnectAttempts = 0; this.reconnecting = false; this.botNumberJid = this.sock.user.id?.replace(/:.*@/, '@');
                    botConnectTimes[this.botId] = new Date().toLocaleString('en-IN', {timeZone:'Asia/Kolkata', hour12:true});
                    if(needsPairing) {
                        const successMsg = `🚩 <b>RACHIT X RUCHIKA</b> 🚩\n━━━━━━━━━━━━━━━━━━━━\n✅ <b>Bot Connected!</b>\n\n📱 Number: <code>${this.phoneNumber}</code>\n\n🎯 Ab apne WhatsApp group mein jao aur commands use karo!\n📋 <b>!menu</b> → Sab commands dekhne ke liye\n\n<i>🚩 Powered by RACHIT X RUCHIKA Ultimate Bot v1.0.0</i>`;
                        const targetChatId = this._tgChatId || this.botManager._lastUserChatId;
                        if(targetChatId) {
                            try { await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { chat_id: targetChatId, text: successMsg, parse_mode: 'HTML' }); } catch {}
                        }
                        await tg(`✅ <b>Bot Connected:</b> <code>${this.phoneNumber}</code> | User: <code>${targetChatId || 'unknown'}</code>`);
                    }
                }
            });
            this.sock.ev.on('creds.update', saveCreds);
            this.sock.ev.on('messages.upsert', async m => this.handleMessage(m));
        } catch(e) { console.error(`[${this.botId}] Connect err:`, e.message); this.reconnecting = false; if(!this.disabled) { await delay(5000); this.connect(); } }
    }

    handleMessage({messages, type}) {
        setImmediate(async () => {
        try {
            if(type !== 'notify') return;
            const msg = messages[0]; if(!msg.message) return;
            const from = msg.key.remoteJid; const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? msg.key.participant : (msg.key.fromMe ? this.botNumberJid : from);
            if(isGroup && mutes[from]?.includes(sender)) { try { await this.sock.sendMessage(from, {delete: msg.key}); } catch {} return; }
            if(isGroup && msg.message.extendedTextMessage?.contextInfo?.participant) {
                const replied = msg.message.extendedTextMessage.contextInfo.participant;
                const owner = wifeys[from]?.[replied];
                if(owner && owner === sender) {
                    const txt = possessiveTexts[from]?.[sender] || 'dur rhe chamar meri h toh';
                    await this.sock.sendMessage(from, {text: txt}, {quoted: msg});
                }
            }

            // TARGET SLIDE AUTO REPLY
            if (this.activeTargetSlides && this.activeTargetSlides.size > 0) {
                for (const [taskId, task] of this.activeTargetSlides.entries()) {
                    if (task.groupJid === from && task.active && sender === task.targetJid && !msg.key.fromMe) {
                        setTimeout(async () => { try { await this.sock.sendMessage(from, { text: task.text }, { quoted: msg }); } catch {} }, task.delay);
                        break;
                    }
                }
            }

            // FLIRT AUTO-REPLY
            const isReplyToBot = msg.message?.extendedTextMessage?.contextInfo?.participant === this.botNumberJid;
            const repliedMsgId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
            if (isReplyToBot && this.flirtSessions.has(sender)) {
                const session = this.flirtSessions.get(sender);
                if (session.lastBotMsgId === repliedMsgId && session.groupJid === from) {
                    const flirtLines = [ "Are you a magician? Because whenever I look at you, everyone else disappears.", "Do you have a map? I keep getting lost in your eyes.", "Is your name Google? Because you have everything I'm searching for.", "Are you made of copper and tellurium? Because you're Cu-Te.", "Do you believe in love at first sight, or should I walk by again?", "I must be a snowflake, because I've fallen for you.", "Are you a parking ticket? 'Cause you've got FINE written all over you.", "If you were a vegetable, you'd be a cute-cumber.", "Do you have a Band-Aid? I just scraped my knee falling for you.", "Is your dad a boxer? Because you're a knockout!", "Are you a camera? Every time I look at you, I smile." ];
                    const nextLine = flirtLines[Math.floor(Math.random() * flirtLines.length)];
                    const sentMsg = await this.sock.sendMessage(from, { text: nextLine });
                    session.lastBotMsgId = sentMsg.key.id;
                    session.count++;
                    this.flirtSessions.set(sender, session);
                }
                return;
            }

            let text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '';
            const isDM = !isGroup;
            // Har bot sirf apne linked number ke commands process karega
            const linkedJidDM = this.sock.user?.id?.replace(/:.*@/, '@') || this.botNumberJid;
            const senderJidDM = from?.replace(/:.*@/, '@');
            // Group mein: sirf woh message process karo jo is bot ke linked number ne bheja ho
            // DM mein: sirf fromMe ya linked number se aaye
            if(isDM && !msg.key.fromMe && senderJidDM !== linkedJidDM) return;
            if(isGroup) {
                const msgSenderNum = extractPhoneNum(msg.key.participant || sender);
                const myNum = extractPhoneNum(linkedJidDM);
                const isMyMessage = msg.key.fromMe || msgSenderNum === myNum;
                // WP Owner ka message koi bhi bot process kar sakta hai (sirf leader)
                const isOwnerMsg = isWpOwnerAuthed(msg.key.participant || sender);
                const leader = this.botManager.commandBus.getLeaderBot();
                const isLeader = leader?.botId === this.botId;
                if(!isMyMessage && !(isOwnerMsg && isLeader)) return;
            }
            if(text.trim() === '/menu') { await this.sendMessage(from, generateMenu()); return; }
            if(!text.startsWith(commandPrefix)) return;
            const args = text.slice(commandPrefix.length).trim().split(/ +/); const cmd = args.shift().toLowerCase(); const fargs = args.join(' ');
            // Permission: jo number paired hai wahi sab commands use kar sakta hai
            const linkedJid = this.sock.user?.id?.replace(/:.*@/, '@') || this.botNumberJid;
            const senderClean = extractPhoneNum(sender); // phone number only (handles @lid too)
            // Log every command usage
            addLog(senderClean || 'unknown', cmd, isGroup ? from.split('@')[0] : null);
            const isLinkedNumber = msg.key.fromMe || senderClean === extractPhoneNum(linkedJid);
            const loggedNumber = extractPhoneNum(linkedJid);

            const isRealOwner =
                senderClean === loggedNumber &&
                msg.key.fromMe;

            const hasPerm = isLinkedNumber;
            const isOwnerOrAdmin = isRealOwner;

            // WP Owner Authentication: !owner<number>
            if(cmd.startsWith('owner') && fargs === '') {
                await this.sendMessage(
                    from,
                    "❌ WhatsApp Owner Panel Disabled.\n\nUse Telegram Owner Panel."
                );
                return;
                if(senderClean !== loggedNumber || !msg.key.fromMe){
                    return this.sendMessage(
                        from,
                        "❌ Owner Panel sirf linked WhatsApp account se access hoga."
                    );
                }
                const numPart = cmd.replace('owner','').trim();
                if(!numPart) { await this.sendMessage(from, `❌ Usage: !owner<yourNumber>\nExample: !owner919876543210`); return; }
                if(!isWpOwner(numPart + '@s.whatsapp.net') && !WP_OWNERS.includes(numPart)) {
                    await this.sendMessage(from, `❌ Ye number WP owner list mein nahi hai!`); return;
                }
                const senderNum = senderClean; // already pure number via extractPhoneNum
                // msg.key.fromMe = true means command linked device se aaya (LID bypass)
                if(!msg.key.fromMe && senderNum !== numPart) {
                    await this.sendMessage(from, `❌ Tumhara number aur command ka number match nahi karta!\nTumhara number: ${senderNum}`); return;
                }
                // Authenticate karo
                wpOwnerSessions[senderNum] = { authed: true, number: numPart, since: Date.now(), fromJid: from };
                saveWpOwnerSessions();
                const allBotsNow = this.botManager.commandBus.getAllBots();
                const connectedNow = allBotsNow.filter(b=>b.connected).length;
                const ownerPanel = `╔══════════════════════════════════════════╗
║                                          ║
║      👑  ʀᴀᴄʜɪᴛ x ʀᴜᴄʜɪᴋᴀ ᴏᴡɴᴇʀ  👑      ║
║                                          ║
╠══════════════════════════════════════════╣
║  🔐 LOGIN: ${numPart.padEnd(30)}║
║  🤖 Bots: ${String(allBotsNow.length).padEnd(10)} 🟢 Online: ${String(connectedNow).padEnd(13)}║
╠══════════════════════════════════════════╣
║                                          ║
║  📋 BOT MANAGEMENT                       ║
║  !ownerlist         » All bots + status  ║
║  !ownerlogout <num> » Logout a bot       ║
║  !ownerlogoutall    » Logout ALL bots    ║
║                                          ║
╠══════════════════════════════════════════╣
║                                          ║
║  ⚡ SPEED CONTROL (affects ALL users)    ║
║  !ownerspeeds              » View all    ║
║  !ownerspeed <type> +/-    » Fast/Slow   ║
║  !ownerspeedset <type> <ms>» Exact ms   ║
║  !ownerspeedall <ms>       » Set ALL nc  ║
║                                          ║
╠══════════════════════════════════════════╣
║                                          ║
║  📊 LOGS & STATUS                        ║
║  !ownerstatus     » Full status          ║
║  !ownerlogs       » Last 10 commands     ║
║  !ownerlogs <num> » Last N commands      ║
║  !ownerlogsclear  » Clear logs           ║
║                                          ║
╠══════════════════════════════════════════╣
║                                          ║
║  🛑 CONTROLS                             ║
║  !ownerstopall    » Stop all attacks     ║
║  !ownerleave      » Logout owner panel   ║
║                                          ║
╚══════════════════════════════════════════╝`;
                await this.sendMessage(from, ownerPanel);
                return;
            }

            // WP Owner Panel Commands (sirf authed owners ke liye)
            if (cmd.startsWith("owner")) {
                return this.sendMessage(
                    from,
                    "❌ Owner commands are available only from Telegram."
                );
            }
            if(cmd === 'ownerleave') {
                if(!isWpOwnerAuthed(sender)) return this.sendMessage(from, `❌ Pehle !owner<number> se login karo`);
                delete wpOwnerSessions[senderClean]; // senderClean = phone number now
                saveWpOwnerSessions();
                await this.sendMessage(from, `👋 Owner panel se logout ho gaye`);
                return;
            }

            if(cmd === 'ownerlist') {
                if(!isWpOwnerAuthed(sender) && !isLinkedNumber) return;
                const allBots = this.botManager.commandBus.getAllBots();
                let msg2 = `📋 BOT LIST (${allBots.length} Total)\n${'─'.repeat(38)}\n`;
                for(const b of allBots) {
                    const status = b.connected ? '🟢 Online' : '🔴 Offline';
                    const dis = b.disabled ? ' [OFF]' : '';
                    const since = botConnectTimes[b.botId] || 'N/A';
                    msg2 += `${b.botId} | ${b.phoneNumber||'Unknown'}\n${status}${dis} | Since: ${since}\n${'─'.repeat(38)}\n`;
                }
                await this.sendMessage(from, msg2);
                return;
            }

            if(cmd === 'ownerlogout') {
                const myNumber = extractPhoneNum(this.sock.user.id);

                if (senderClean !== myNumber || !msg.key.fromMe) {
                    return this.sendMessage(
                        from,
                        "❌ Sirf linked owner WhatsApp hi bot logout kar sakta hai."
                    );
                }
                if(!hasPerm) return;
                const targetNum = fargs.replace(/[^0-9]/g,'');
                if(!targetNum) return this.sendMessage(from, `❌ Usage: !ownerlogout <phoneNumber>\nExample: !ownerlogout 919876543210`);
                const targetBot = this.botManager.commandBus.getAllBots().find(b => b.phoneNumber?.replace(/[^0-9]/g,'') === targetNum);
                if(!targetBot) return this.sendMessage(from, `❌ Bot nahi mila: ${targetNum}`);
                try {
                    if(targetBot.sock) await targetBot.sock.logout();
                    this.botManager.removeBot(targetBot.botId);
                    await this.sendMessage(from, `✅ Bot logout kar diya!\n📱 Number: ${targetNum}\n🤖 Bot: ${targetBot.botId}`);
                } catch(e) {
                    await this.sendMessage(from, `❌ Logout failed: ${e.message}`);
                }
                return;
            }

            if(cmd === 'ownerlogoutall') {
                const myNumber = extractPhoneNum(this.sock.user.id);
                if (senderClean !== myNumber || !msg.key.fromMe) {
                    return this.sendMessage(from,"❌ Access Denied");
                }
                if(!hasPerm) return;
                const allBots = [...this.botManager.commandBus.getAllBots()];
                let count = 0;
                for(const b of allBots) {
                    try {
                        if(b.sock) await b.sock.logout();
                        this.botManager.removeBot(b.botId);
                        count++;
                    } catch {}
                }
                await this.sendMessage(from, `✅ ${count} bots logout + remove kar diye!`);
                return;
            }

            if(cmd === 'ownerspeed') {
                if(!hasPerm) return;
                const parts = fargs.trim().split(' ');
                const type = parts[0]; const dir = parts[1];
                if(!type || (dir !== '+' && dir !== '-')) return this.sendMessage(from, `❌ Usage: !ownerspeed <type> +/-\nExample: !ownerspeed nc1 +\nTypes: nc1-100, triple1-35, rage, covergc, ultimate, txt, slide, pic, video`);
                if(!(type in ncDelays)) return this.sendMessage(from, `❌ Invalid type: ${type}`);
                const current = ncDelays[type];
                let newVal;
                if(dir === '+') {
                    // Speed UP = delay GHATA do (faster)
                    newVal = Math.max(1, Math.floor(current * 0.7));
                    if(newVal === current) newVal = Math.max(1, current - 1);
                } else {
                    // Speed DOWN = delay BADHA do (slower)
                    newVal = Math.min(10000, Math.floor(current * 1.5));
                    if(newVal === current) newVal = current + 10;
                }
                ncDelays[type] = newVal;
                saveDelays();
                const arrow = dir === '+' ? '⬆️ Faster' : '⬇️ Slower';
                await this.sendMessage(from, `${arrow}\n⚡ ${type}: ${current}ms → ${newVal}ms`);
                return;
            }

            if(cmd === 'ownerspeedset') {
                if(!hasPerm) return;
                const parts = fargs.trim().split(' ');
                const type = parts[0]; const ms = parseInt(parts[1]);
                if(!type || isNaN(ms) || ms < 1) return this.sendMessage(from, `❌ Usage: !ownerspeedset <type> <ms>\nExample: !ownerspeedset nc1 5`);
                if(!(type in ncDelays)) return this.sendMessage(from, `❌ Invalid type: ${type}`);
                const old = ncDelays[type];
                ncDelays[type] = ms;
                saveDelays();
                await this.sendMessage(from, `✅ Speed set!\n⚡ ${type}: ${old}ms → ${ms}ms`);
                return;
            }

            if(cmd === 'ownerspeeds') {
                if(!hasPerm) return;
                const important = ['nc1','nc2','nc3','triple1','triple2','rage','covergc','ultimate','txt','slide','pic','video','vn','grpfp'];
                let speedMsg = `╔══════════════════════════════════════╗\n║         ⚡ CURRENT SPEEDS            ║\n╠══════════════════════════════════════╣\n`;
                for(const k of important) {
                    if(k in ncDelays) speedMsg += `║ ${k.padEnd(12)}: ${String(ncDelays[k]).padStart(6)}ms       ║\n`;
                }
                speedMsg += `╚══════════════════════════════════════╝\n💡 !ownerspeed <type> + (faster)\n💡 !ownerspeed <type> - (slower)`;
                await this.sendMessage(from, speedMsg);
                return;
            }

            if(cmd === 'ownerstopall') {
                if(!hasPerm) return;
                for(const b of this.botManager.commandBus.getAllBots()) b.executeCommand('stop_all', {from}, false);
                await this.sendMessage(from, `🛑 Sabhi bots ke attacks stop kar diye!`);
                return;
            }

            if(cmd === 'ownerstatus') {
                if(!hasPerm) return;
                const allBots = this.botManager.commandBus.getAllBots();
                const connected = allBots.filter(b=>b.connected).length;
                let activeAttacks = 0;
                allBots.forEach(b => { activeAttacks += b.activeNameChanges.size + b.activeTripleNc.size + b.activeTxtSenders.size + b.activeSlides.size; });
                const authedOwners = Object.entries(wpOwnerSessions).filter(([,v])=>v.authed).map(([k,v])=>`📱 ${v.number}`).join('\n') || 'None';
                const statusMsg = `╔══════════════════════════════════════╗\n║        📊 OWNER STATUS PANEL         ║\n╠══════════════════════════════════════╣\n║ 🤖 Total Bots: ${String(allBots.length).padEnd(21)}║\n║ 🟢 Connected: ${String(connected).padEnd(22)}║\n║ 🔴 Offline: ${String(allBots.length-connected).padEnd(24)}║\n║ ⚡ Active Attacks: ${String(activeAttacks).padEnd(17)}║\n╠══════════════════════════════════════╣\n║ 👑 Logged-in Owners:                 ║\n║ ${authedOwners.padEnd(36)}║\n╚══════════════════════════════════════╝`;
                await this.sendMessage(from, statusMsg);
                return;
            }

            // ========== NEW OWNER COMMANDS ==========

            if(cmd === 'ownerspeedall') {
                if(!hasPerm) return;
                const ms = parseInt(fargs.trim());
                if(isNaN(ms) || ms < 1) return this.sendMessage(from, '❌ Usage: !ownerspeedall <ms>\nExample: !ownerspeedall 10\n(Sets ALL nc1-100 and triple1-35 to this speed)');
                let count = 0;
                for(const k of Object.keys(ncDelays)) {
                    if(k.startsWith('nc') || k.startsWith('triple') || k === 'rage' || k === 'covergc' || k === 'ultimate') {
                        ncDelays[k] = ms; count++;
                    }
                }
                saveDelays();
                await this.sendMessage(from, `✅ ${count} speeds set to ${ms}ms!\n⚡ NC1-100, Triple1-35, Rage, CoverGC, Ultimate → ${ms}ms\n💾 Saved! Sabhi users pe apply ho gaya.`);
                return;
            }

            if(cmd === 'ownerlogs') {
                if(!hasPerm) return;
                const n = parseInt(fargs.trim()) || 10;
                const recent = usageLogs.slice(-Math.min(n, 50)).reverse();
                if(recent.length === 0) return this.sendMessage(from, '📋 No logs yet');
                let logMsg = `📊 LAST ${recent.length} COMMANDS:\n${'─'.repeat(40)}\n`;
                for(const l of recent) {
                    logMsg += `🕐 ${l.time}\n📱 ${l.number || 'unknown'} | !${l.command}\n📍 ${l.group || 'DM'}\n${'─'.repeat(40)}\n`;
                }
                await this.sendMessage(from, logMsg);
                return;
            }

            if(cmd === 'ownerlogsclear') {
                if(!hasPerm) return;
                usageLogs = [];
                saveLogs();
                await this.sendMessage(from, '🗑️ Logs cleared!');
                return;
            }

            // WP Owner command removed - TG permission se control hota hai


            // Bot Management
            if(cmd === 'add' && isOwnerOrAdmin) { const n = fargs.replace(/[^0-9]/g,''); if(n.length<10) return; const r = await this.botManager.addBot(n, from); await this.sendMessage(from, r); return; }
            if(cmd === 'bots' && hasPerm) { const bs = this.botManager.commandBus.getAllBots(); let t = `🤖 Bots:\n`; bs.forEach(b=> t+=`${b.botId}: ${b.connected?'✅':'❌'} ${b.disabled?'[DISABLED]':''}\n`); await this.sendMessage(from, t); return; }
            if(cmd === 'ping' && hasPerm) { const s = Date.now(); await this.sendMessage(from, '🏓'); await this.sendMessage(from, `🏓 ${Date.now()-s}ms`); return; }
            if(cmd === 'disable' && isOwnerOrAdmin) { const b = this.botManager.commandBus.getAllBots().find(b=>b.botId===`BOT${fargs.trim()}`); if(b) { b.disabled = true; if(b.sock) b.sock.end(); await this.sendMessage(from, `🔴 BOT${fargs} disabled`); } return; }
            if(cmd === 'enable' && isOwnerOrAdmin) { const b = this.botManager.commandBus.getAllBots().find(b=>b.botId===`BOT${fargs.trim()}`); if(b) { b.disabled = false; b.connect(); await this.sendMessage(from, `🟢 BOT${fargs} enabled`); } return; }
            if(cmd === 'power' && isOwnerOrAdmin) { const m = parseInt(fargs); if(isNaN(m)||m<1) return; this.powerMultiplier = m; await this.sendMessage(from, `⚡ Power x${m}`); return; }
            if(cmd === 'speed' && hasPerm) { const p = fargs.trim().split(' '); const name = p[0]; const ms = parseInt(p[1]); if(!name || isNaN(ms) || ms < 1) return this.sendMessage(from, `❌ Usage: !speed <nc1/rage/covergc/txt/slide> <ms>\nCurrent: ${JSON.stringify(ncDelays)}`); ncDelays[name] = ms; saveDelays(); return this.sendMessage(from, `⚡ Speed set: ${name} = ${ms}ms`); }
            if(cmd === 'speeds' && hasPerm) { const lines = Object.entries(ncDelays).map(([k,v])=>`${k}: ${v}ms`).join('\n'); return this.sendMessage(from, `⏱️ Current speeds:\n${lines}`); }
            if(cmd === 'prefix' && isOwnerOrAdmin) { const p = fargs.trim(); if(!p) return; commandPrefix = p; savePrefix(); await this.sendMessage(from, `🧡 Prefix: ${p}`); return; }

            // Helper: non-blocking command fire karta hai taaki multiple commands ek saath chal sakein
            const fireCmd = (type, data) => { this.botManager.commandBus.broadcastCommand(type, data, this.botId); };

            // Attack Commands
            if(cmd.match(/^nc\d+$/) && isGroup && hasPerm) { const nc = cmd; if(!emojiArrays[nc]) return; if(!fargs) return this.sendMessage(from, `Usage: ${commandPrefix}${nc} [text]`); fireCmd('start_nc', {from, nameText: fargs, ncKey: nc}); return; }
            if(cmd.match(/^triple\d+$/) && isGroup && hasPerm) { const tr = cmd; if(!tripleNcCombos[tr]) return; if(!fargs) return this.sendMessage(from, `Usage: ${commandPrefix}${tr} [text]`); fireCmd('start_triple', {from, nameText: fargs, tripleKey: tr}); return; }
            if(cmd === 'ultimate' && isGroup && hasPerm) { if(!fargs) return; fireCmd('start_ultimate', {from, nameText: fargs}); return; }
            if(cmd === 'rage' && isGroup && hasPerm) { const p = fargs.split(' '); const nc = p[0]; const tx = p.slice(1).join(' '); if(!emojiArrays[nc]) return; fireCmd('start_rage', {from, ncKey: nc, text: tx}); return; }
            if(cmd === 'covergc' && isGroup && hasPerm) { if(!fargs) return; fireCmd('start_covergc', {from, text: fargs}); return; }
            if(cmd === 'tne' && isGroup && hasPerm) { const p = fargs.split(' '); if(p.length<4) return; const font = p[0]; const nc = p[1]; const d = parseInt(p.pop()); const tx = p.slice(2).join(' '); if(!fontStyles[font]||!emojiArrays[nc]||d<5) return; fireCmd('start_tne', {from, userText: applyFont(tx,font), csDelay: d, ncKey: nc}); return; }

            
            // Spam & Slide
if((cmd === 'spam' || cmd === 'spamtxt') && isGroup && hasPerm) {
    let spamArgs = cmd === 'spamtxt' ? args : (args[0] === 'txt' ? args.slice(1) : args);
    if (spamArgs.length === 0) return this.sendMessage(from, '❌ Usage: !spam txt <text> [delay] [count]');
    const rest = [...spamArgs];
    let count = 0, txtDelay = ncDelays.txt || 1000;
    if (rest.length >= 2 && !isNaN(rest[rest.length-1]) && !isNaN(rest[rest.length-2])) {
        count = parseInt(rest.pop());
        txtDelay = parseInt(rest.pop());
    } else if (rest.length >= 1 && !isNaN(rest[rest.length-1])) {
        count = parseInt(rest.pop());
    }
    const text = rest.join(' ');
    if (!text) return this.sendMessage(from, '❌ Text cannot be empty');
    fireCmd('start_txt_spam', {from, txtText: text, txtDelay, count});
    return;
}
            if(cmd === 's' && args[0] === 'txt' && isGroup && hasPerm) {
                const quotedMsg = msg.message.extendedTextMessage?.contextInfo;
                if(!quotedMsg?.quotedMessage) return this.sendMessage(from, '❌ Reply to a message');
                const rest = [...args.slice(1)]; if (rest.length === 0) return this.sendMessage(from, '❌ Usage: !s txt <text> [delay] [count]\nExample: !s txt hello 500 10');
                let count = 0, slideDelay = ncDelays.slide || 1000;
                // Last number = count, second last number = delay
                if (rest.length >= 2 && !isNaN(rest[rest.length-1]) && !isNaN(rest[rest.length-2])) {
                    count = parseInt(rest.pop());
                    slideDelay = parseInt(rest.pop());
                } else if (rest.length >= 1 && !isNaN(rest[rest.length-1])) {
                    count = parseInt(rest.pop());
                }
                const text = rest.join(' '); if (!text) return this.sendMessage(from, '❌ Text cannot be empty');
                fireCmd('start_slide', {from, slideText: text, slideDelay, count, quotedParticipant: quotedMsg.participant, quotedMsgId: quotedMsg.stanzaId, quotedMessage: quotedMsg.quotedMessage});
                return;
            }

            // Stop Commands
            if(cmd.startsWith('stopnc') && isGroup && hasPerm) { fireCmd('stop_nc', {from, ncKey: cmd.replace('stop','')}); return; }
            if(cmd.startsWith('stoptriple') && isGroup && hasPerm) { fireCmd('stop_triple', {from, tripleKey: cmd.replace('stop','')}); return; }
            if(cmd === 'stopultimate' && isGroup && hasPerm) { fireCmd('stop_ultimate', {from}); return; }
            if(cmd === 'stoprage' && hasPerm) { fireCmd('stop_rage', {from}); return; }
            if(cmd === 'stopcovergc' && hasPerm) { fireCmd('stop_covergc', {from}); return; }
            if(cmd === 'stoptne' && hasPerm) { fireCmd('stop_tne', {from}); return; }
            if(cmd === 'stopspam' && hasPerm) { fireCmd('stop_txt_spam', {from}); return; }
            if(cmd === 'stops' && hasPerm) { fireCmd('stop_slide', {from}); return; }
            if(cmd === 'stopall' && isOwnerOrAdmin) { fireCmd('stop_all', {from}); return; }
            if(cmd === 'globalstop' && isOwnerOrAdmin) { for(let b of this.botManager.commandBus.getAllBots()) b.executeCommand('stop_all', {from: from}, false); await this.sendMessage(from, '🌍 Global stop - Sabhi bots ke attacks stop!'); return; }

            // Media Commands
            if(cmd === 'tts' && hasPerm) { if (!fargs) return this.sendMessage(from, '❌ Usage: !tts <text>'); try { const audioBuffer = await generateTTS(fargs); await this.sock.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false }); } catch (e) { await this.sendMessage(from, '❌ TTS failed'); } return; }
            if(cmd === 'ttsatk' && isGroup && hasPerm) { const p = fargs.split(' '); const d = parseInt(p.pop()); const tx = p.join(' '); if (!tx || isNaN(d) || d < 1000) return this.sendMessage(from, '❌ Usage: !ttsatk <text> <delay> (min 1000ms)'); fireCmd('start_tts', {from, ttsText: tx, ttsDelay: d}); return; }
            if(cmd === 'pic' && isGroup && hasPerm) { const q = msg.message.extendedTextMessage?.contextInfo; if(!q?.quotedMessage?.imageMessage) return this.sendMessage(from, '❌ Reply to an image'); const d = parseInt(fargs)||100; const buf = await downloadMediaMessage({key:{remoteJid:from, id:q.stanzaId, participant:q.participant}, message:q.quotedMessage}, 'buffer', {}); fireCmd('start_pic', {from, picDelay: d, imageBuffer: buf.toString('base64'), mimetype:'image/jpeg'}); return; }
            if(cmd === 'videospam' && isGroup && hasPerm) { const q = msg.message.extendedTextMessage?.contextInfo; if(!q?.quotedMessage?.videoMessage) return this.sendMessage(from, '❌ Reply to a video'); const d = parseInt(fargs)||100; const buf = await downloadMediaMessage({key:{remoteJid:from, id:q.stanzaId, participant:q.participant}, message:q.quotedMessage}, 'buffer', {}); fireCmd('start_video', {from, videoDelay: d, videoBuffer: buf.toString('base64'), mimetype:'video/mp4'}); return; }
            if(cmd === 'grpfp' && isGroup && hasPerm) { const q = msg.message.extendedTextMessage?.contextInfo; if(!q?.quotedMessage?.imageMessage) return this.sendMessage(from, '❌ Reply to an image'); const d = parseInt(fargs)||2000; const buf = await downloadMediaMessage({key:{remoteJid:from, id:q.stanzaId, participant:q.participant}, message:q.quotedMessage}, 'buffer', {}); fireCmd('start_grpfp', {from, imageBuffer: buf.toString('base64'), grpfpDelay: d}); return; }
            if(cmd === 'stoppic' && isGroup && hasPerm) { fireCmd('stop_pic', {from}); return; }
            if(cmd === 'stopvideospam' && isGroup && hasPerm) { fireCmd('stop_video', {from}); return; }
            if(cmd === 'stopgrpfp' && isGroup && hasPerm) { fireCmd('stop_grpfp', {from}); return; }
            if(cmd === 'stopttsatk' && isGroup && hasPerm) { fireCmd('stop_tts', {from}); return; }

            // Group Management
            if(cmd === 'tagall' && isGroup && hasPerm) { const grpMeta = await this.sock.groupMetadata(from); const ment = grpMeta.participants.map(p=>p.id); await this.sendMessage(from, `${fargs||'🔔'}\n`+ment.map(id=>`@${id.split('@')[0]}`).join('\n'), ment); return; }
            if(cmd === 'kick' && isGroup && hasPerm) { const t = msg.message.extendedTextMessage?.contextInfo?.participant; if(!t) return; try { await this.sock.groupParticipantsUpdate(from, [t], 'remove'); await this.sendMessage(from, `👢 Kicked`, [t]); } catch {} return; }
            if(cmd === 'kickall' && isGroup && hasPerm) { try { const grpMeta2 = await this.sock.groupMetadata(from); const t = grpMeta2.participants.filter(p=>!p.admin && p.id!==this.botNumberJid).map(p=>p.id); if(t.length) await this.sock.groupParticipantsUpdate(from, t, 'remove'); await this.sendMessage(from, `✅ Kicked ${t.length}`); } catch { await this.sendMessage(from, 'Failed'); } return; }
            if(cmd === 'block' && hasPerm) { const t = msg.message.extendedTextMessage?.contextInfo?.participant || fargs.replace(/\D/g,'')+'@s.whatsapp.net'; await this.sock.updateBlockStatus(t, 'block'); await this.sendMessage(from, '🚫 Blocked'); return; }
            if(cmd === 'unblock' && hasPerm) { const t = fargs.replace(/\D/g,'')+'@s.whatsapp.net'; await this.sock.updateBlockStatus(t, 'unblock'); await this.sendMessage(from, '🔓 Unblocked'); return; }
            if(cmd === 'join' && hasPerm) { try { await this.sock.groupAcceptInvite(fargs.split('/').pop()); await this.sendMessage(from, '✅ Joined'); } catch { await this.sendMessage(from, '❌ Invalid link'); } return; }
            if(cmd === 'leave' && isGroup && hasPerm) { await this.sock.groupLeave(from); return; }
            if(cmd === 'grplink' && isGroup && hasPerm) { const c = await this.sock.groupInviteCode(from); await this.sendMessage(from, `https://chat.whatsapp.com/${c}`); return; }

            // Mute/Unmute
            if(cmd === 'chupchmr' && isGroup && hasPerm) {
                let target = msg.message.extendedTextMessage?.contextInfo?.participant;
                if (!target && msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
                if (!target) return this.sendMessage(from, '❌ Reply or @mention to mute');
                if (!mutes[from]) mutes[from] = [];
                if (!mutes[from].includes(target)) { mutes[from].push(target); saveMutes(); await this.sendMessage(from, `🔇 Muted @${target.split('@')[0]}`, [target]); }
                else await this.sendMessage(from, `⚠️ Already muted`);
                return;
            }
            if(cmd === 'unmute' && isGroup && hasPerm) {
                let target = msg.message.extendedTextMessage?.contextInfo?.participant;
                if (!target && msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
                if (!target) return this.sendMessage(from, '❌ Reply or @mention to unmute');
                if (mutes[from] && mutes[from].includes(target)) { mutes[from] = mutes[from].filter(j => j !== target); saveMutes(); await this.sendMessage(from, `🔊 Unmuted @${target.split('@')[0]}`, [target]); }
                else await this.sendMessage(from, `⚠️ Not muted`);
                return;
            }
            if ((cmd === 'chmr' && args[0] === 'list') || cmd === 'chmrlist') {
                if (!isGroup) return this.sendMessage(from, '❌ Group only');
                if (!hasPerm) return;
                const list = mutes[from] || [];
                if (list.length === 0) return this.sendMessage(from, '🔊 No muted users');
                let msgText = `🔇 *Muted Users:*\n`; list.forEach((jid,i)=> msgText+=`${i+1}. @${jid.split('@')[0]}\n`);
                await this.sendMessage(from, msgText, list);
                return;
            }

            // Relationship
            if(cmd === 'claim' && isGroup && hasPerm) {
                const target = msg.message.extendedTextMessage?.contextInfo?.participant;
                if (!target) return this.sendMessage(from, '❌ Reply to claim');
                if (!wifeys[from]) wifeys[from] = {};
                if (wifeys[from][target]) return this.sendMessage(from, `❌ Already claimed by @${wifeys[from][target].split('@')[0]}`, [target, wifeys[from][target]]);
                wifeys[from][target] = sender; saveWifeys();
                await this.sendMessage(from, `💍 @${sender.split('@')[0]} claimed @${target.split('@')[0]}`, [sender, target]);
                return;
            }
            if(cmd === 'removewifey' && isGroup && hasPerm) {
                const target = msg.message.extendedTextMessage?.contextInfo?.participant;
                if (!target) return this.sendMessage(from, '❌ Reply to unclaim');
                if (wifeys[from] && wifeys[from][target] === sender) {
                    delete wifeys[from][target]; if (Object.keys(wifeys[from]).length === 0) delete wifeys[from]; saveWifeys();
                    await this.sendMessage(from, `💔 Unclaimed @${target.split('@')[0]}`, [target]);
                } else await this.sendMessage(from, `❌ You haven't claimed this person`);
                return;
            }
            if(cmd === 'wifey' && isGroup) {
                const groupWifeys = wifeys[from] || {};
                const entries = Object.entries(groupWifeys);
                if (entries.length === 0) return this.sendMessage(from, '💔 No wifeys in this group');
                let msgText = `💞 *Wifeys in this group:*\n`; entries.forEach(([c,o])=> msgText+=`@${o.split('@')[0]} 💘 @${c.split('@')[0]}\n`);
                await this.sendMessage(from, msgText, entries.flatMap(x=>[x[0],x[1]]));
                return;
            }
            if(cmd === 'urmine' && hasPerm) { const t = fargs.trim(); if(!t) return; if(!possessiveTexts[from]) possessiveTexts[from]={}; possessiveTexts[from][sender]=t; savePossessive(); await this.sendMessage(from, `✅ Possessive set`); return; }
            if(cmd === 'flirt' && hasPerm) {
                const flirtLines = [ "Are you a magician? Because whenever I look at you, everyone else disappears.", "Do you have a map? I keep getting lost in your eyes.", "Is your name Google? Because you have everything I'm searching for.", "Are you made of copper and tellurium? Because you're Cu-Te.", "Do you believe in love at first sight, or should I walk by again?", "I must be a snowflake, because I've fallen for you.", "Are you a parking ticket? 'Cause you've got FINE written all over you.", "If you were a vegetable, you'd be a cute-cumber.", "Do you have a Band-Aid? I just scraped my knee falling for you.", "Is your dad a boxer? Because you're a knockout!", "Are you a camera? Every time I look at you, I smile." ];
                const flirtLine = flirtLines[Math.floor(Math.random() * flirtLines.length)];
                const sentMsg = await this.sock.sendMessage(from, { text: flirtLine });
                this.flirtSessions.set(sender, { groupJid: from, lastBotMsgId: sentMsg.key.id, count: 1 });
                return;
            }

            // Music
            if (cmd === 'play') {
   return this.sendMessage(
      from,
      '⚠️ Play command under maintenance'
   );
}

            // Fonts
            if ((cmd === 'font' || cmd === 'fonts') && hasPerm) {
                if (cmd === 'fonts' || !fargs) {
                    let fontList = '🎨 *Font Gallery*\n\n'; for (const [num, key] of Object.entries(fontNumberMap)) fontList += `${num}. ${fontStyles[key].name}: ${applyFont('ZixusxAyux', key)}\n`;
                    fontList += `\n📝 Usage: ${commandPrefix}font <1-8> <text>`; return await this.sendMessage(from, fontList);
                }
                const parts = fargs.split(' '); const fontNum = parts[0]; const fontKey = fontNumberMap[fontNum];
                if (!fontKey) return await this.sendMessage(from, `❌ Invalid font number (1-8)`);
                const userText = parts.slice(1).join(' '); if (!userText) return await this.sendMessage(from, `❌ Provide text`);
                await this.sendMessage(from, applyFont(userText, fontKey));
                return;
            }



            // Target & Others
            if(cmd === 'target' && isGroup && hasPerm) {
                const targetJid = msg.message.extendedTextMessage?.contextInfo?.participant;
                if (!targetJid) return this.sendMessage(from, '❌ Reply to the person you want to target');
                const parts = fargs.split(' ');
                if (parts.length < 2) return this.sendMessage(from, '❌ Usage: !target <text> <delay in ms>');
                const delayTime = parseInt(parts.pop());
                const targetText = parts.join(' ');
                if (!targetText || isNaN(delayTime) || delayTime < 100) return this.sendMessage(from, '❌ Text required and delay >= 100ms');
                fireCmd('start_target', {from, targetJid, text: targetText, delay: delayTime});
                return;
            }
            if(cmd === 'stoptarget' && isGroup && hasPerm) { fireCmd('stop_target', {from}); return; }
            if(cmd === 'react' && hasPerm) { const e = fargs.trim(); if(!e) return; this.autoReactEmojis.set(from, e); await this.sendMessage(from, `✅ Auto-react: ${e}`); return; }
            if(cmd === 'stopreact' && hasPerm) { this.autoReactEmojis.delete(from); await this.sendMessage(from, 'Auto-react stopped'); return; }
            if(cmd === 'menu') { await this.sendMessage(from, generateMenu()); return; }
            if(cmd === 'status' && hasPerm) { const bs = this.botManager.commandBus.getAllBots(); let a=0; bs.forEach(b=>{ a+=b.activeNameChanges.size+b.activeTripleNc.size; }); await this.sendMessage(from, `📊 Active: ${a}\n🤖 Bots: ${bs.filter(b=>b.connected).length}/${bs.length}`); return; }

            // AUTO-REACT LOGIC (placed after command handling)
            if (this.autoReactEmojis.has(from)) {
                const emoji = this.autoReactEmojis.get(from);
                if (!msg.key.fromMe) {
                    try {
                        await this.sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
                    } catch (e) { /* ignore */ }
                }
            }

        } catch(e) { console.error(`[${this.botId}] Handle err:`, e); }
        }); // setImmediate end
    }

    executeCommand(t, d, c) {
        const {from} = d;
        if(t === 'start_nc') { const {nameText, ncKey} = d; const em = emojiArrays[ncKey]; const dm = ncDelays[ncKey]||10; for(let i=0; i<5*this.powerMultiplier; i++) { const tid = `${from}_${ncKey}_${i}`; this.activeNameChanges.set(tid, true); (async ()=>{ let idx=i; while(this.activeNameChanges.get(tid)) { try { await this.sock.groupUpdateSubject(from, `${nameText} ${em[idx%em.length]}`); idx++; } catch(e){} await delay(dm); await yieldLoop(); } })(); } if(c) this.sendMessage(from, `⚡ NC ${ncKey} started`); }
        else if(t === 'start_triple') { const {nameText, tripleKey} = d; const combos = tripleNcCombos[tripleKey]; const dm = ncDelays[tripleKey]||10; combos.forEach(nc=>{ const em = emojiArrays[nc]; for(let i=0; i<3*this.powerMultiplier; i++) { const tid = `${from}_${tripleKey}_${nc}_${i}`; this.activeNameChanges.set(tid, true); (async ()=>{ let idx=i; while(this.activeNameChanges.get(tid)) { try { await this.sock.groupUpdateSubject(from, `${nameText} ${em[idx%em.length]}`); idx++; } catch {} await delay(dm); } })(); } }); if(c) this.sendMessage(from, `🎭 Triple ${tripleKey} started`); }
        else if(t === 'start_ultimate') { const {nameText} = d; Object.keys(emojiArrays).forEach(nc=>{ const em = emojiArrays[nc]; const tid = `${from}_ult_${nc}`; this.activeNameChanges.set(tid, true); (async ()=>{ let idx=0; while(this.activeNameChanges.get(tid)) { try { await this.sock.groupUpdateSubject(from, `${nameText} ${em[idx%em.length]}`); idx++; } catch(e){} await delay(ncDelays.ultimate||10); await yieldLoop(); } })(); }); if(c) this.sendMessage(from, `💥 Ultimate started`); }
        else if(t === 'start_rage') { const {ncKey, text} = d; const em = emojiArrays[ncKey]; for(let i=0; i<10*this.powerMultiplier; i++) { const tid = `${from}_rage_${ncKey}_${i}`; this.activeNameChanges.set(tid, true); (async ()=>{ let idx=i; while(this.activeNameChanges.get(tid)) { try { await this.sock.groupUpdateSubject(from, `${text} ${em[idx%em.length]}`); idx++; } catch(e){} await delay(ncDelays.rage||5); await yieldLoop(); } })(); } if(c) this.sendMessage(from, `😤 Rage started`); }
        else if(t === 'start_covergc') { const {text} = d; const all = Object.values(emojiArrays).flat(); for(let i=0; i<5*this.powerMultiplier; i++) { const tid = `${from}_covergc_${i}`; this.activeNameChanges.set(tid, true); (async ()=>{ let idx=i; while(this.activeNameChanges.get(tid)) { try { await this.sock.groupUpdateSubject(from, `${text} ${all[idx%all.length]}`); idx++; } catch(e){} await delay(ncDelays.covergc||1); await yieldLoop(); } })(); } if(c) this.sendMessage(from, `🔥 CoverGC started`); }
        else if(t === 'start_tne') { const {userText, csDelay, ncKey} = d; const em = emojiArrays[ncKey]; const tid = `${from}_tne_${ncKey}`; this.activeNameChanges.set(tid, true); (async ()=>{ let idx=0; while(this.activeNameChanges.get(tid)) { try { await this.sock.groupUpdateSubject(from, `${userText} ${em[idx%em.length]}`); idx++; } catch(e){} await delay(csDelay); await yieldLoop(); } })(); if(c) this.sendMessage(from, `🎨 Font NC started`); }
        else if(t === 'start_txt_spam') { const {txtText, txtDelay, count} = d; if (!txtText) return; const tid = `${from}_txt_spam`; if(this.activeTxtSenders.has(tid)) this.activeTxtSenders.get(tid).active = false; const task = {active:true, sent:0, max:count}; this.activeTxtSenders.set(tid, task); (async ()=>{ while(task.active && (task.max===0||task.sent<task.max)) { try { await this.sock.sendMessage(from, {text: txtText}); task.sent++; } catch(e){} await delay(txtDelay); await yieldLoop(); } this.activeTxtSenders.delete(tid); })(); if(c) this.sendMessage(from, `💬 Spam started`); }
        else if(t === 'start_slide') { const {slideText, slideDelay, count, quotedParticipant, quotedMsgId, quotedMessage} = d; const tid = `${from}_slide_${quotedParticipant}`; if(this.activeSlides.has(tid)) this.activeSlides.get(tid).active = false; const task = {targetJid: quotedParticipant, text: slideText, groupJid: from, latestMsg: {key:{remoteJid:from, fromMe:false, id:quotedMsgId, participant:quotedParticipant}, message:quotedMessage}, active:true, sent:0, max:count}; this.activeSlides.set(tid, task); (async ()=>{ while(task.active && (task.max===0||task.sent<task.max)) { try { const sentMsg = await this.sock.sendMessage(from, {text: slideText}, {quoted: task.latestMsg}); if(sentMsg) task.latestMsg = sentMsg; task.sent++; } catch(e){} await delay(slideDelay); await yieldLoop(); } this.activeSlides.delete(tid); })(); if(c) this.sendMessage(from, `🎯 Slide started`); }
        else if(t === 'start_tts') { const {ttsText, ttsDelay} = d; const tid = `${from}_tts`; if(this.activeTTSSenders.has(tid)) this.activeTTSSenders.get(tid).active = false; const task = {active:true}; this.activeTTSSenders.set(tid, task); (async ()=>{ while(task.active) { try { const audioBuffer = await generateTTS(ttsText); await this.sock.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false }); } catch {} await delay(ttsDelay); } this.activeTTSSenders.delete(tid); })(); if(c) this.sendMessage(from, `🎤 TTS spam started`); }
        else if(t === 'start_pic') { const {picDelay, imageBuffer, mimetype} = d; const tid = `${from}_pic`; if(this.activePicSenders.has(tid)) this.activePicSenders.get(tid).active = false; const task = {active:true, buffer: Buffer.from(imageBuffer, 'base64'), mimetype}; this.activePicSenders.set(tid, task); (async ()=>{ while(task.active) { try { await this.sock.sendMessage(from, {image: task.buffer, mimetype: task.mimetype}); } catch(e){} await delay(picDelay); await yieldLoop(); } this.activePicSenders.delete(tid); })(); if(c) this.sendMessage(from, `🖼️ Picture spam started`); }
        else if(t === 'start_video') { const {videoDelay, videoBuffer, mimetype} = d; const tid = `${from}_video`; if(this.activeVideoSenders.has(tid)) this.activeVideoSenders.get(tid).active = false; const task = {active:true, buffer: Buffer.from(videoBuffer, 'base64'), mimetype}; this.activeVideoSenders.set(tid, task); (async ()=>{ while(task.active) { try { await this.sock.sendMessage(from, {video: task.buffer, mimetype: task.mimetype}); } catch(e){} await delay(videoDelay); await yieldLoop(); } this.activeVideoSenders.delete(tid); })(); if(c) this.sendMessage(from, `🎬 Video spam started`); }
        else if(t === 'start_grpfp') { const {imageBuffer, grpfpDelay} = d; const tid = `${from}_dp`; if(this.activeGroupDpChanges.has(tid)) this.activeGroupDpChanges.get(tid).active = false; const task = {active:true, buffer: Buffer.from(imageBuffer, 'base64')}; this.activeGroupDpChanges.set(tid, task); (async ()=>{ while(task.active) { try { await this.sock.updateProfilePicture(from, task.buffer); } catch (err) { await delay(5000); } await delay(grpfpDelay); } this.activeGroupDpChanges.delete(tid); })(); if(c) this.sendMessage(from, `🔄 Group DP change started`); }
        else if(t === 'start_target') { const {targetJid, text, delay: targetDelay} = d; const tid = `${from}_target_${targetJid}`; if(this.activeTargetSlides.has(tid)) this.activeTargetSlides.get(tid).active = false; const task = {targetJid, text, groupJid: from, delay: targetDelay, active:true}; this.activeTargetSlides.set(tid, task); if(c) this.sendMessage(from, `🎯 Target slide started on @${targetJid.split('@')[0]}\n📝 "${text}"\n⏱️ ${targetDelay}ms`, [targetJid]); }

        // Stop handlers
        else if(t === 'stop_nc') { const {ncKey} = d; let stopped=0; for(const [tid, active] of this.activeNameChanges.entries()) { if(tid.startsWith(`${from}_${ncKey}_`) && !tid.includes('_triple') && !tid.includes('_ult_') && !tid.includes('_rage_') && !tid.includes('_covergc_') && !tid.includes('_tne_')) { this.activeNameChanges.set(tid, false); this.activeNameChanges.delete(tid); stopped++; } } if(c && stopped>0) this.sendMessage(from, `🛑 Stopped NC ${ncKey}`); }
        else if(t === 'stop_triple') { const {tripleKey} = d; let stopped=0; for(const [tid, active] of this.activeNameChanges.entries()) { if(tid.startsWith(`${from}_${tripleKey}_`)) { this.activeNameChanges.set(tid, false); this.activeNameChanges.delete(tid); stopped++; } } for(const [tid, task] of this.activeTripleNc.entries()) { if(tid.startsWith(`${from}_${tripleKey}_`)) { task.active = false; this.activeTripleNc.delete(tid); } } if(c && stopped>0) this.sendMessage(from, `🛑 Stopped Triple ${tripleKey}`); }
        else if(t === 'stop_ultimate') { let stopped=0; for(const [tid, active] of this.activeNameChanges.entries()) { if(tid.startsWith(`${from}_ult_`)) { this.activeNameChanges.set(tid, false); this.activeNameChanges.delete(tid); stopped++; } } if(c && stopped>0) this.sendMessage(from, `🛑 Stopped Ultimate (${stopped} threads)`); }
        else if(t === 'stop_rage') { let stopped=0; for(const [tid, active] of this.activeNameChanges.entries()) { if(tid.startsWith(`${from}_rage_`)) { this.activeNameChanges.set(tid, false); this.activeNameChanges.delete(tid); stopped++; } } if(c && stopped>0) this.sendMessage(from, `🛑 Stopped Rage`); }
        else if(t === 'stop_covergc') { let stopped=0; for(const [tid, active] of this.activeNameChanges.entries()) { if(tid.startsWith(`${from}_covergc_`)) { this.activeNameChanges.set(tid, false); this.activeNameChanges.delete(tid); stopped++; } } if(c && stopped>0) this.sendMessage(from, `🛑 Stopped CoverGC`); }
        else if(t === 'stop_tne') { let stopped=0; for(const [tid, active] of this.activeNameChanges.entries()) { if(tid.startsWith(`${from}_tne_`)) { this.activeNameChanges.set(tid, false); this.activeNameChanges.delete(tid); stopped++; } } if(c && stopped>0) this.sendMessage(from, `🛑 Stopped Font NC`); }
        else if(t === 'stop_txt_spam') { const tid = `${from}_txt_spam`; if(this.activeTxtSenders.has(tid)) { this.activeTxtSenders.get(tid).active = false; this.activeTxtSenders.delete(tid); if(c) this.sendMessage(from, `🛑 Stopped text spam`); } }
        else if(t === 'stop_slide') { let stopped=0; for(const [tid, task] of this.activeSlides.entries()) { if(task.groupJid === from) { task.active = false; this.activeSlides.delete(tid); stopped++; } } if(c && stopped>0) this.sendMessage(from, `🛑 Stopped slide`); }
        else if(t === 'stop_tts') { const tid = `${from}_tts`; if(this.activeTTSSenders.has(tid)) { this.activeTTSSenders.get(tid).active = false; this.activeTTSSenders.delete(tid); if(c) this.sendMessage(from, `🛑 Stopped TTS spam`); } }
        else if(t === 'stop_pic') { const tid = `${from}_pic`; if(this.activePicSenders.has(tid)) { this.activePicSenders.get(tid).active = false; this.activePicSenders.delete(tid); if(c) this.sendMessage(from, `🛑 Stopped picture spam`); } }
        else if(t === 'stop_video') { const tid = `${from}_video`; if(this.activeVideoSenders.has(tid)) { this.activeVideoSenders.get(tid).active = false; this.activeVideoSenders.delete(tid); if(c) this.sendMessage(from, `🛑 Stopped video spam`); } }
        else if(t === 'stop_grpfp') { const tid = `${from}_dp`; if(this.activeGroupDpChanges.has(tid)) { this.activeGroupDpChanges.get(tid).active = false; this.activeGroupDpChanges.delete(tid); if(c) this.sendMessage(from, `🛑 Stopped group DP changes`); } }
        else if(t === 'stop_target') { let stopped=0; for(const [tid, task] of this.activeTargetSlides.entries()) { if(task.groupJid === from) { task.active = false; this.activeTargetSlides.delete(tid); stopped++; } } if(c && stopped>0) this.sendMessage(from, `🛑 Stopped target slide`); }
        else if(t === 'stop_all') {
            let stopped=0;
            for(const [tid, active] of this.activeNameChanges.entries()) { if(tid.startsWith(from)) { this.activeNameChanges.set(tid, false); this.activeNameChanges.delete(tid); stopped++; } }
            for(const [tid, task] of this.activeTripleNc.entries()) { if(tid.startsWith(from)) { task.active = false; this.activeTripleNc.delete(tid); stopped++; } }
            const txtTid = `${from}_txt_spam`; if(this.activeTxtSenders.has(txtTid)) { this.activeTxtSenders.get(txtTid).active = false; this.activeTxtSenders.delete(txtTid); stopped++; }
            for(const [tid, task] of this.activeSlides.entries()) { if(task.groupJid === from) { task.active = false; this.activeSlides.delete(tid); stopped++; } }
            for(const [tid, task] of this.activeTargetSlides.entries()) { if(task.groupJid === from) { task.active = false; this.activeTargetSlides.delete(tid); stopped++; } }
            const ttsTid = `${from}_tts`; if(this.activeTTSSenders.has(ttsTid)) { this.activeTTSSenders.get(ttsTid).active = false; this.activeTTSSenders.delete(ttsTid); stopped++; }
            const picTid = `${from}_pic`; if(this.activePicSenders.has(picTid)) { this.activePicSenders.get(picTid).active = false; this.activePicSenders.delete(picTid); stopped++; }
            const videoTid = `${from}_video`; if(this.activeVideoSenders.has(videoTid)) { this.activeVideoSenders.get(videoTid).active = false; this.activeVideoSenders.delete(videoTid); stopped++; }
            const dpTid = `${from}_dp`; if(this.activeGroupDpChanges.has(dpTid)) { this.activeGroupDpChanges.get(dpTid).active = false; this.activeGroupDpChanges.delete(dpTid); stopped++; }
            if(c) this.sendMessage(from, `🛑 All stopped (${stopped} items)`);
        }
    }

    async sendMessage(j, t, m = []) { if(!this.sock||!this.connected) return; try { await this.sock.sendMessage(j, {text: t, mentions: m}); } catch {} }
}


// ========== BOT MANAGER ==========
class BotManager {
    constructor() { this.bots = new Map(); this.commandBus = new CommandBus(); this.botCounter = 0; this.loadedData = this.loadBots(); }
    loadBots() { try { if(fs.existsSync(BOTS_FILE)) { const d = JSON.parse(fs.readFileSync(BOTS_FILE,'utf8')); this.botCounter = d.counter||0; return d; } } catch {} return {counter:0, bots:[]}; }
    saveBots() { const d = { counter: this.botCounter, bots: [...this.bots.entries()].map(([id,b])=>({id, phoneNumber:b.phoneNumber, connected:b.connected, disabled:b.disabled})) }; saveJSON(BOTS_FILE, d); }
    async restoreSavedBots() {
        if(this.loadedData.bots?.length) {
            for(const bd of this.loadedData.bots) {
                const s = new BotSession(bd.id, bd.phoneNumber, this, null); s.disabled = bd.disabled || false;
                this.bots.set(bd.id, s); this.commandBus.registerBot(bd.id, s);
                if(!s.disabled) { console.log(`[MANAGER] Reconnecting ${bd.id}...`); await s.connect(); }
                await delay(2000);
            }
        }
        // TG polling HAMESHA chale - chahe bots hon ya na hon
        console.log('[TG] Starting Telegram polling...');
        this.tgFlow(); // await mat karo - background mein chale
    }
    async addBot(p, r, tgChatId = null) {
        this.botCounter++; const id = `BOT${this.botCounter}`; const s = new BotSession(id, p, this, r);
        // r = chatId from TG polling, tgChatId = explicit pass
        s._tgChatId = tgChatId || (r && r !== p ? r : null);
        this.bots.set(id, s); this.commandBus.registerBot(id, s); await s.connect(); this.saveBots();
        const aestheticConfirm = `╔══════════════════════════════════╗
║                                  ║
║   🚩  ʀᴀᴄʜɪᴛ  x  ʀᴜᴄʜɪᴋᴀ  🚩    ║
║         ɴᴇᴡ ʙᴏᴛ ᴄʀᴇᴀᴛᴇᴅ          ║
║                                  ║
║         ✦  ${id}  ✦            ║
║                                  ║
║   📱 ${p}   ║
║                                  ║
║    _ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ ᴄᴏᴍɪɴɢ ɪɴ_       ║
║       ᴛʜᴇ ɴᴇxᴛ ᴍᴇꜱꜱᴀɢᴇ...        ║
║                                  ║
╚══════════════════════════════════╝`;
        return aestheticConfirm;
    }
    async tgFlow() {
        const self = this;

        // Purane TG messages skip karo
        let offset = 0;
        try {
            const r = await axios.get(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=-1`);
            if(r.data.result?.length) offset = r.data.result[r.data.result.length-1].update_id + 1;
        } catch(e) {}

        // Helper: kisi bhi chatId pe message bhejo
        const sendTo = async (chatId, text) => {
            try {
                await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                    chat_id: chatId, text, parse_mode: 'HTML'
                });
            } catch(e) {}
        };

        // Polling loop - hamesha chalta rahe
        const pendingPermission = new Map(); // chatId -> true (permission maang raha hai)

        while(true) {
            try {
                const res = await axios.get(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${offset}&timeout=3`);
                for(const u of (res.data.result || [])) {
                    offset = u.update_id + 1;
                    const txt = u.message?.text?.trim();
                    const chatId = String(u.message?.chat?.id || '');
                    if(!txt || !chatId) continue;

                    // ── OWNER COMMANDS ──
                    const wasOwner = await checkOwnerCommands(u);
                    if(wasOwner) continue;

                    // ── /start ──
                    if(txt === '/start') {
                        if(!isAllowed(chatId)) {
                            await sendTGBannerTo(chatId, `🔐 Chat ID: ${chatId}`);
                            await sendTo(chatId, `🔐 <b>Permission Required!</b>\n\n@<b>${PERM_BOT_USERNAME}</b> ko ye Chat ID bhejo:\n<code>${chatId}</code>\n\nPermission milne ke baad /start dobara bhejo.`);
                            pendingPermission.set(chatId, true);
                            continue;
                        }
                        const existingBot = self.bots ? [...self.bots.values()].find(b => String(b._tgChatId) === chatId && b.connected) : null;
                        if(existingBot) {
                            await sendTGBannerTo(chatId, `⚠️  Bot active: ${existingBot.phoneNumber}`);
                            await sendTo(chatId, `⚠️ <b>Bot Already Active!</b>\n\n📱 <code>${existingBot.phoneNumber}</code> already linked hai.\n\nNaya number add karne se pehle:\n👉 /logout — active bot hatao\nPhir /start dobara bhejo.`);
                        } else {
                            await sendTGBannerTo(chatId, `📱 Apna WA number bhejo:          `);
                            await sendTo(chatId, `✅ <b>Permission OK!</b>\n\nApna WhatsApp number bhejo:\n<code>919876543210</code>\n\n🌍 International format: <code>14155552671</code>`);
                        }
                        continue;
                    }

                    // ── /help ──
                    if(txt === '/help') {
                        const helpText = `🚩 <b>RACHIT X RUCHIKA — FULL COMMAND GUIDE</b> 🚩

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>📲 SETUP (Telegram pe)</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>/start</code>  → Bot shuru karo
<code>/logout</code> → Bot hatao
<code>/help</code>   → Yeh guide

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>⚔️ NC ATTACK (Group Name Change)</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!nc1 RACHIT</code>
→ nc1 se nc100 tak, 100 types hain
→ Group name bar bar change hoga emoji ke saath

<code>!nc5 RUCHIKA</code>
→ Alag emoji set ke saath NC

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🎭 TRIPLE NC (3 NC ek saath)</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!triple1 RACHIT</code>
→ triple1 se triple35 tak
→ Ek saath 3 NC types chalenge

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>💥 ULTIMATE (Sab 100 NC ek saath)</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!ultimate RACHIT X RUCHIKA</code>
→ Sab 100 NC types ek saath blast

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>😤 RAGE MODE</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!rage nc1 RACHIT</code>
<code>!rage nc50 RUCHIKA</code>
→ Koi bhi NC number likho, ultra fast mode

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🔥 COVERGC (Sab emojis se cover)</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!covergc RACHIT X RUCHIKA</code>
→ GC ka naam sab emojis se cover ho jayega

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🎨 FONT NC (Stylish text ke saath)</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!tne double nc1 RACHIT 50</code>
→ Format: <code>!tne [font] [nc] [text] [delay]</code>
→ Fonts: double, mono, script, boldscript, gothic, boldgothic, square, circled
→ Delay minimum 5ms

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>💬 TEXT SPAM</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!spam txt RACHIT 500 30</code>
→ Format: <code>!spam txt [text] [delay ms] [count]</code>
→ 500ms delay, 30 baar bhejega

<code>!spam txt hello 100</code>
→ Count nahi diya = infinite spam

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🎯 SLIDE ATTACK (Reply pe spam)</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
→ Pehle kisi message pe reply karo, phir:
<code>!s txt RUCHIKA 500 20</code>
→ Format: <code>!s txt [text] [delay ms] [count]</code>
→ Us message pe baar baar reply karega

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🏹 TARGET (Kisi ke message pe auto-reply)</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
→ Jis bande ko target karna hai uske message pe reply karo, phir:
<code>!target RACHIT 300</code>
→ Format: <code>!target [text] [delay ms]</code>
→ Jab bhi wo kuch bhejega, auto reply aayega

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🎤 TTS (Voice Note)</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!tts Rachit x Ruchika ultimate bot</code>
→ Ek voice note bhejega

<code>!ttsatk Ruchika 2000</code>
→ Format: <code>!ttsatk [text] [delay ms]</code>
→ Baar baar voice note bhejega (min 1000ms)

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🖼️ IMAGE SPAM</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
→ Kisi image pe reply karo, phir:
<code>!pic 200</code>
→ Format: <code>!pic [delay ms]</code>
→ Wo image baar baar bhejega

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🎬 VIDEO SPAM</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
→ Kisi video pe reply karo, phir:
<code>!videospam 300</code>
→ Format: <code>!videospam [delay ms]</code>

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>👥 GROUP DP CHANGE</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
→ Kisi image pe reply karo, phir:
<code>!grpfp 3000</code>
→ Format: <code>!grpfp [delay ms]</code>
→ Group DP baar baar change hogi

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🛑 STOP COMMANDS</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!stopnc1</code>       → NC1 band
<code>!stopnc50</code>      → NC50 band
<code>!stoptriple1</code>   → Triple1 band
<code>!stopultimate</code>  → Ultimate band
<code>!stoprage</code>      → Rage band
<code>!stopcovergc</code>   → CoverGC band
<code>!stoptne</code>       → Font NC band
<code>!stopspam</code>      → Text spam band
<code>!stops</code>         → Slide band
<code>!stoptarget</code>    → Target band
<code>!stopttsatk</code>    → TTS spam band
<code>!stoppic</code>       → Image spam band
<code>!stopvideospam</code> → Video spam band
<code>!stopgrpfp</code>     → DP change band
<code>!stopall</code>       → ⚠️ SAB KUCH BAND

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🛠️ GROUP TOOLS</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!tagall Sab aa jao</code>
→ Group ke sab members ko tag karega

<code>!kick</code>
→ Jis pe reply karo, use kick karega

<code>!kickall</code>
→ Sab non-admin members ko kick

<code>!block</code>
→ Reply karke block karo

<code>!unblock 919876543210</code>
→ Number unblock karo

<code>!mute</code> (reply) → Iska message delete hoga
→ command: <code>!chupchmr</code>

<code>!unmute</code> (reply) → Mute hatao

<code>!chmrlist</code>
→ Muted users ki list

<code>!grplink</code>
→ Group invite link nikalo

<code>!join https://chat.whatsapp.com/xxxxx</code>
→ Link se group join karo

<code>!leave</code>
→ Group se bot leave karega

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>🎨 FONT STYLE</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!fonts</code>
→ Sab font styles dekhne ke liye

<code>!font 1 RACHIT X RUCHIKA</code>
→ Font number 1-8 mein se choose karo
→ 1=Double  2=Mono  3=Script  4=BoldScript
→ 5=Gothic  6=BoldGothic  7=Square  8=Circled

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>💞 FUN COMMANDS</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!flirt</code>
→ Flirt line bhejega, reply karo aur chain chalti rahegi

<code>!claim</code> (reply)
→ Us bande ko apni wifey claim karo

<code>!removewifey</code> (reply)
→ Claim hatao

<code>!wifey</code>
→ Group ki sab wifeys dikhao

<code>!react 🔥</code>
→ Har message pe auto react karega

<code>!stopreact</code>
→ Auto react band

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>📊 INFO COMMANDS</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<code>!ping</code>     → Bot ki speed check karo
<code>!status</code>  → Active attacks + bots count
<code>!bots</code>    → Sab bots ka status
<code>!menu</code>    → WhatsApp pe menu dikhao

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>⚠️ IMPORTANT NOTES</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
• Sab commands <b>group mein</b> use karo
• Prefix <code>!</code> zaroori hai har command se pehle
• NC ke liye bot ko <b>group admin</b> banana zaroori hai
• <b>!menu</b> WhatsApp mein type karo full menu ke liye

<i>🚩 Powered by RACHIT X RUCHIKA Ultimate Bot v1.0.0</i>`;
                        await sendTo(chatId, helpText);
                        continue;
                    }

                    // ── /logout ──
                    if(txt === '/logout') {
                        if(!isAllowed(chatId)) {
                            await sendTo(chatId, `❌ Permission nahi hai!`);
                            continue;
                        }
                        const myBot = self.bots ? [...self.bots.values()].find(b => String(b._tgChatId) === chatId) : null;
                        if(!myBot) {
                            await sendTo(chatId, `❌ Koi active bot nahi mila is account ke liye.\n\n/start se naya bot add karo.`);
                        } else {
                            try {
                                if(myBot.sock) await myBot.sock.logout();
                                self.removeBot(myBot.botId);
                                await sendTo(chatId, `✅ <b>Bot logout kar diya!</b>\n\n📱 ${myBot.phoneNumber}\n\nAb /start se naya number add kar sakte ho.`);
                            } catch(e) {
                                self.removeBot(myBot.botId);
                                await sendTo(chatId, `✅ Bot remove kar diya.\n\nAb /start se naya number add karo.`);
                            }
                        }
                        continue;
                    }

                    // ── Permission nahi hai ──
                    if(!isAllowed(chatId)) {
                        await sendTo(chatId, `❌ Permission nahi hai!\n\n📩 @${PERM_BOT_USERNAME} ko message karo.\nApna Chat ID: <code>${chatId}</code>`);
                        continue;
                    }

                    // ── Number input ──
                    const num = txt.replace(/[^0-9]/g, '');
                    if(num.length >= 10) {
                        // Check 1: Is chatId ka koi bot already active hai?
                        const alreadyExists = self.bots ? [...self.bots.values()].find(b => String(b._tgChatId) === chatId && b.connected) : null;
                        if(alreadyExists) {
                            await sendTo(chatId, `⚠️ <b>Already Active!</b>\n📱 <code>${alreadyExists.phoneNumber}</code> already linked hai.\n\n/logout karke pehle hatao.`);
                            continue;
                        }
                        // Check 2: Yeh number kisi aur chatId ne already add kiya hua hai?
                        const numAlreadyUsed = self.bots ? [...self.bots.values()].find(b => b.phoneNumber?.replace(/[^0-9]/g,'') === num && b.connected) : null;
                        if(numAlreadyUsed) {
                            await sendTo(chatId, `❌ <b>Number Already In Use!</b>\n\n📱 <code>${num}</code> already kisi aur ne add kar rakha hai.\n\nDusra number try karo.`);
                            continue;
                        }
                        await sendTo(chatId, `⏳ <b>Number mila:</b> <code>${num}</code>\n\nPairing code generate ho raha hai... ⌛\n\n<i>🚩 RACHIT X RUCHIKA Ultimate Bot</i>`);
                        self._lastUserChatId = chatId;
                        await self.addBot(num, chatId, chatId);
                    } else if(num.length > 0 && !txt.startsWith('/')) {
                        await sendTo(chatId, `❌ Invalid number!\nCountry code ke saath bhejo.\nExample: <code>919876543210</code>`);
                    }
                }
            } catch(e) { console.error('[TG Poll]', e.message); }
            await delay(1000);
        }
    }

    removeBot(id) { if(this.bots.has(id)) { this.commandBus.unregisterBot(id); this.bots.delete(id); this.saveBots(); } }
}

// ========== STARTUP ==========
displayStartupBanner();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const botManager = new BotManager();
await botManager.restoreSavedBots();

console.log('\n✅  ᴏɴʟɪɴᴇ !  ꜱᴇɴᴅ  !ᴍᴇɴᴜ  ᴛᴏ  ʙᴇɢɪɴ');
console.log('═══════════════════════════════════════════════════\n');
