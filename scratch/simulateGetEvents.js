require('dotenv').config({ path: '.env.local' });
const { initDb, getEvents } = require('../lib/db');
const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

// Mock route cache
const routeCache = new Map();

// Deterministic landmass selection
function getDeterministicJitter(seedText, maxDegrees = 0.6) {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = seedText.charCodeAt(i) + ((hash << 5) - hash);
  }
  const jitterLat = ((hash & 0xFF) / 255.0 - 0.5) * maxDegrees;
  const jitterLon = (((hash >> 8) & 0xFF) / 255.0 - 0.5) * maxDegrees;
  return { lat: jitterLat, lon: jitterLon };
}

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

  const jitter = getDeterministicJitter(title || country || 'signal', 0.6);
  return {
    lat: (baseCoords ? baseCoords.lat : 38.9072) + jitter.lat,
    lon: (baseCoords ? baseCoords.lon : -77.0369) + jitter.lon,
    resolvedLocation: resolvedLocation || country || 'Global',
    specificity
  };
}

async function simulate() {
  await initDb();
  console.log("Fetching events from db...");
  const dbEventsList = (await getEvents('24h')).map(e => ({ ...e, fromDb: true }));
  console.log("Total events in DB (24h):", dbEventsList.length);

  const colombianDbEvents = dbEventsList.filter(e => e.title.includes('Colombian'));
  console.log("Colombian events in DB:", colombianDbEvents);

  // Apply route.js mapping and coordinate assignment
  const sortedEvents = dbEventsList.sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  sortedEvents.forEach(e => {
    if (e.edited === true || e.edited === 'true') {
      return; // Preserve admin edits exactly in every location!
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

  const colombianProcessed = sortedEvents.filter(e => e.title.includes('Colombian'));
  console.log("After assigning coords, Colombian events:", colombianProcessed);
  process.exit(0);
}

simulate();
