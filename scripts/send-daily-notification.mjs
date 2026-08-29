import fs from 'node:fs';
import vm from 'node:vm';

const APP_ID = '3427bd6a-c26d-4012-aeb6-da914976847c';
const SITE_URL = 'https://comunidadedefe.github.io/cronograma-biblico-2027/';
const apiKey = process.env.ONESIGNAL_APP_API_KEY;

if (!apiKey) {
  console.error('Missing ONESIGNAL_APP_API_KEY secret.');
  process.exit(1);
}

const headers = {
  'Authorization': `Key ${apiKey}`,
  'Content-Type': 'application/json'
};

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

async function getSubscribedSegmentCount() {
  try {
    const listResponse = await fetch(`https://api.onesignal.com/apps/${APP_ID}/segments`, {
      headers: { 'Authorization': `Key ${apiKey}` }
    });
    const listText = await listResponse.text();
    let list = null;
    try { list = JSON.parse(listText); } catch {}

    if (!listResponse.ok) {
      console.log(`Could not inspect OneSignal segments (${listResponse.status}).`);
      return null;
    }

    const segment = list?.segments?.find(s => s.name === 'Subscribed Users');
    if (!segment?.id) {
      console.log('OneSignal diagnostic: segment "Subscribed Users" was not found for this App ID.');
      return null;
    }

    const countResponse = await fetch(`https://api.onesignal.com/apps/${APP_ID}/segments/${segment.id}`, {
      headers: { 'Authorization': `Key ${apiKey}` }
    });
    const countText = await countResponse.text();
    let count = null;
    try { count = JSON.parse(countText); } catch {}

    if (countResponse.ok && Number.isFinite(count?.subscriber_count)) {
      console.log(`OneSignal diagnostic: Subscribed Users = ${count.subscriber_count}`);
      return count.subscriber_count;
    }
  } catch (error) {
    console.log(`OneSignal diagnostic failed: ${error.message}`);
  }
  return null;
}

async function sendNotification(targeting) {
  const payload = {
    app_id: APP_ID,
    target_channel: 'push',
    headings: { en: 'Leitura bíblica de hoje' },
    contents: { en: item.reading },
    name: `Leitura bíblica ${dateISO}`,
    url: SITE_URL,
    ...targeting
  };

  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let result = null;
  try { result = JSON.parse(text); } catch {}
  return { response, text, result };
}

const subscriberCount = await getSubscribedSegmentCount();

let attempt = await sendNotification({ included_segments: ['Subscribed Users'] });

if (!attempt.response.ok) {
  console.error(`OneSignal error ${attempt.response.status}: ${attempt.text}`);
  process.exit(1);
}

if (!attempt.result?.id) {
  const details = Array.isArray(attempt.result?.errors) ? attempt.result.errors.join('; ') : attempt.text;
  console.log(`Segment targeting did not create a notification: ${details}`);
  console.log('Retrying with an activity filter to bypass the default segment...');

  attempt = await sendNotification({
    filters: [
      { field: 'session_count', relation: '>', value: '0' }
    ]
  });
}

if (!attempt.response.ok) {
  console.error(`OneSignal retry error ${attempt.response.status}: ${attempt.text}`);
  process.exit(1);
}

if (!attempt.result?.id) {
  const details = Array.isArray(attempt.result?.errors) ? attempt.result.errors.join('; ') : attempt.text;
  console.error(`OneSignal did not create the notification after both targeting methods: ${details}`);
  console.error(`Diagnostic subscriber count for App ID ${APP_ID}: ${subscriberCount ?? 'unknown'}`);
  console.error('If the OneSignal dashboard shows subscribed devices but this count is 0, compare the dashboard App ID in Settings > Keys & IDs with the App ID printed above.');
  process.exit(1);
}

console.log(`Notification sent for ${dateISO}: ${item.reading}`);
console.log(`OneSignal notification id: ${attempt.result.id}`);
console.log(`Recipients reported by OneSignal: ${attempt.result.recipients ?? 'not reported'}`);
