import fs from 'node:fs';
import vm from 'node:vm';

const APP_ID = '3427bd6a-c26d-4012-aeb6-da914976847c';
const SITE_URL = 'https://comunidadedefe.github.io/cronograma-biblico-2027/';
const apiKey = process.env.ONESIGNAL_APP_API_KEY;

if (!apiKey) {
  console.error('Missing ONESIGNAL_APP_API_KEY secret.');
  process.exit(1);
}

function saoPauloDateISO(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

const requestedDate = process.argv[2]?.trim();
const dateISO = requestedDate || saoPauloDateISO();

if (!dateISO.startsWith('2027-')) {
  console.log(`Skipping ${dateISO}: reading plan is for 2027.`);
  process.exit(0);
}

const source = fs.readFileSync('calendar-data-2027.js', 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const plan = sandbox.window.READING_PLAN;

if (!Array.isArray(plan)) {
  throw new Error('Could not load READING_PLAN from calendar-data-2027.js');
}

const item = plan.find(entry => entry.date === dateISO);
if (!item) {
  console.log(`No reading found for ${dateISO}.`);
  process.exit(0);
}

const payload = {
  app_id: APP_ID,
  target_channel: 'push',
  included_segments: ['Subscribed Users'],
  headings: { en: 'Leitura bíblica de hoje' },
  contents: { en: item.reading },
  name: `Leitura bíblica ${dateISO}`,
  url: SITE_URL
};

const response = await fetch('https://api.onesignal.com/notifications?c=push', {
  method: 'POST',
  headers: {
    'Authorization': `Key ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});

const text = await response.text();
if (!response.ok) {
  console.error(`OneSignal error ${response.status}: ${text}`);
  process.exit(1);
}

console.log(`Notification sent for ${dateISO}: ${item.reading}`);
console.log(text);
