require('dotenv').config({ path: '.env.local' });
const { initDb, getEvents, getArchivedInfo, isEventArchived } = require('../lib/db');
const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateHashId(url, title) {
  const seed = url || title || Math.random().toString();
  return crypto.createHash('md5').update(seed).digest('hex');
}

// Mimic the getCountryCoords in route.js
function getCountryCoords(country, title = '', summary = '') {
  const c = (country || '').toLowerCase().trim();
  const t = ((title || '') + ' ' + (summary || '')).toLowerCase();
  
  const hasWord = (text, word) => {
    return new RegExp(`\\b${word}\\b`, 'i').test(text);
  };
  
  let baseCoords = null;
  let resolvedLocation = '';
  let specificity = 0;

  if (t.includes('beirut') || t.includes('sidon') || t.includes('tyre')) { baseCoords = { lat: 33.8938, lon: 35.5018 }; resolvedLocation = 'Beirut, Lebanon'; }
  else if (t.includes('sudan')) { baseCoords = { lat: 12.8628, lon: 30.2176 }; resolvedLocation = 'Sudan'; }

  if (baseCoords) specificity = 3;

  return {
    lat: baseCoords ? baseCoords.lat : 38.9072,
    lon: baseCoords ? baseCoords.lon : -77.0369,
    resolvedLocation: resolvedLocation || country || 'Global',
    specificity
  };
}

function calculateTitleFuzzySimilarity(title1, title2) {
  return 0.5; // stub
}

async function run() {
  await initDb();
  const ts = 'today';
  
  // Simulated GDELT fetch result: let's see if we load static events
  const dbEventsList = (await getEvents(ts)).map(e => ({ ...e, fromDb: true }));
  const staticPath = path.join(process.cwd(), 'public', 'data', 'events.json');
  let staticEvents = [];
  if (fs.existsSync(staticPath)) {
    staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf-8'));
  }

  const archivedInfo = await getArchivedInfo();
  
  const filteredDbEventsList = dbEventsList.filter(e => {
    if (isEventArchived(e, archivedInfo)) return false;
    return true;
  });

  const filteredStaticEvents = staticEvents.filter(e => !isEventArchived(e, archivedInfo));

  let finalEventsList = [...filteredStaticEvents, ...filteredDbEventsList];
  
  // Assign coords
  finalEventsList.forEach(e => {
    if (e.edited === true || e.edited === 'true') {
      return; 
    }
    const coords = getCountryCoords(e.location || 'Global', e.title, e.details?.summary || e.description || '');
    if (coords) {
      if (e.lat === undefined || e.lat === null || e.lon === undefined || e.lon === null) {
        e.lat = coords.lat;
        e.lon = coords.lon;
      }
      if (coords.resolvedLocation && (!e.location || e.location === 'Global' || e.location.length <= 3)) {
        e.location = coords.resolvedLocation;
      }
      e.specificity = Math.max(e.specificity || 0, coords.specificity || 0);
    }
  });

  // Deduplicate
  const allEvents = [];
  finalEventsList.forEach(e => {
    let duplicateIndex = -1;
    for (let i = 0; i < allEvents.length; i++) {
      if (allEvents[i].title === e.title) {
        duplicateIndex = i;
        break;
      }
    }
    if (duplicateIndex !== -1) {
      const accepted = allEvents[duplicateIndex];
      const acceptedEdited = accepted.edited === true || accepted.edited === 'true';
      const currentEdited = e.edited === true || e.edited === 'true';
      if (currentEdited && !acceptedEdited) {
        allEvents[duplicateIndex] = e;
      }
    } else {
      allEvents.push(e);
    }
  });

  console.log("=== API Simulated Events List ===");
  const colombians = allEvents.filter(e => e.title.includes('Colombian'));
  console.log(colombians);
  
  process.exit(0);
}

run();
