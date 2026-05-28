const fs = require('fs');
const path = require('path');

const staticPath = path.join(process.cwd(), 'public', 'data', 'events.json');
const staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf-8'));
const match = staticEvents.find(e => e.title.includes('Colombian'));
const title = match.title;
const summary = match.details?.summary || match.description || '';
const t = ((title || '') + ' ' + (summary || '')).toLowerCase();

const idx = t.indexOf('beirut');
console.log("Index of 'beirut':", idx);
if (idx !== -1) {
  console.log("Context around 'beirut':", t.substring(idx - 50, idx + 50));
}
