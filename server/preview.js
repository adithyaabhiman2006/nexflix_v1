'use strict';
/* Private preview: puts the website on a free Cloudflare link (https) while this computer is on.
   Start it with "Start Nexflix Preview.bat". The link changes every time; the password stays the same.
   The password is kept in data/preview-password.txt (never uploaded to GitHub). */

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.NEXFLIX_DATA || path.join(ROOT, 'data');
const PORT = Number(process.env.PORT) || 8080;

function findCloudflared() {
  const places = [
    'cloudflared',
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'cloudflared', 'cloudflared.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'cloudflared', 'cloudflared.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'cloudflared', 'cloudflared.exe'),
  ];
  for (const p of places) {
    try { if (spawnSync(p, ['--version'], { stdio: 'ignore' }).status === 0) return p; } catch (e) { /* try the next place */ }
  }
  return null;
}

/* The same password every time, made once at random. */
fs.mkdirSync(DATA_DIR, { recursive: true });
const pwFile = path.join(DATA_DIR, 'preview-password.txt');
if (!fs.existsSync(pwFile)) {
  const words = crypto.randomBytes(9).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 10);
  fs.writeFileSync(pwFile, `nx-${words}\n`);
}
const password = fs.readFileSync(pwFile, 'utf8').trim();

const cf = findCloudflared();
if (!cf) {
  console.log('\n  PROBLEM: the Cloudflare tool (cloudflared) is not installed. Ask Claude to help install it.\n');
  process.exit(1);
}

/* A permanent link (e.g. preview.nexflix.net) is used when data/preview-tunnel.json names one:
   {"name": "nexflix-preview", "hostname": "preview.nexflix.net"}. Otherwise a random free link is made. */
let fixed = null;
try { fixed = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'preview-tunnel.json'), 'utf8')); } catch (e) { /* no permanent link yet */ }
if (fixed && !(/^[a-z0-9-]+$/.test(fixed.name) && /^[a-z0-9.-]+$/.test(fixed.hostname))) { console.log('\n  PROBLEM: data/preview-tunnel.json is not right. Ask Claude to fix it.\n'); process.exit(1); }

console.log('\n  Making the private link. This takes about 10 seconds...\n');
const args = fixed
  ? ['tunnel', '--no-autoupdate', 'run', '--url', `http://127.0.0.1:${PORT}`, fixed.name]
  : ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${PORT}`];
const tunnel = spawn(cf, args, { stdio: ['ignore', 'pipe', 'pipe'] });
let site = null;
let started = false;

function onTunnelText(buf) {
  const text = String(buf);
  const m = fixed ? (/Registered tunnel connection/i.test(text) && [`https://${fixed.hostname}`]) : /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(text);
  if (!m || started) return;
  started = true;
  const url = m[0];
  site = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT), PUBLIC_URL: url, TRUST_PROXY: '1', PREVIEW_PASSWORD: password },
  });
  site.on('exit', code => { tunnel.kill(); process.exit(code || 0); });
  setTimeout(() => {
    console.log('  ================================================================');
    console.log('   PRIVATE PREVIEW IS ON');
    console.log(`   Link:      ${url}`);
    console.log(`   Password:  ${password}`);
    console.log('');
    console.log('   Send the link and the password to your customer in two');
    console.log('   separate messages. The link works only while this window is open.');
    if (!fixed) console.log('   (This free link changes every time you start the preview.)');
    console.log('  ================================================================\n');
  }, 1500);
}
tunnel.stdout.on('data', onTunnelText);
tunnel.stderr.on('data', onTunnelText);
tunnel.on('exit', code => {
  console.log(`\n  The Cloudflare link stopped (code ${code}). Check the internet connection, then start again.\n`);
  if (site) site.kill();
  process.exit(1);
});
setTimeout(() => {
  if (!started) { console.log('\n  PROBLEM: no link came from Cloudflare after 60 seconds. Check the internet connection and try again.\n'); tunnel.kill(); }
}, 60000);
process.on('SIGINT', () => { tunnel.kill(); if (site) site.kill(); process.exit(0); });
