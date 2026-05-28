const fs = require('fs');
const path = require('path');

const staticPath = path.join(process.cwd(), 'public', 'data', 'events.json');
const staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf-8'));
const match = staticEvents.find(e => e.title.includes('Colombian'));
console.log(JSON.stringify(match, null, 2));
