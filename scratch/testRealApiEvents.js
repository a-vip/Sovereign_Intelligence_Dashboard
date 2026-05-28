require('dotenv').config({ path: '.env.local' });
const { initDb, getEvents, getArchivedInfo, isEventArchived } = require('../lib/db');
const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc?query=(%22artificial%20intelligence%22%20OR%20%22autonomous%20weapons%22%20OR%20%22military%20ai%22%20OR%20%22facial%20recognition%22%20OR%20biometric%20OR%20%22killer%20robot%22%20OR%20%22killer%20robots%22)%20sourcelang:english&mode=artlist&maxrecords=150&format=json";

function generateHashId(url, title) {
  const seed = url || title || Math.random().toString();
  return crypto.createHash('md5').update(seed).digest('hex');
}

function getCategory(text) {
  return 'Humanitarian';
}
function getSeverity(text) {
  return 1;
}
function getQuality(text) {
  return 3;
}

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
  
  let baseCoords = null;
  let resolvedLocation = '';
  let specificity = 0;

  if (t.includes('beirut') || t.includes('sidon') || t.includes('tyre')) { 
    baseCoords = { lat: 33.8938, lon: 35.5018 }; 
    resolvedLocation = 'Beirut, Lebanon'; 
  }
  else if (t.includes('sudan')) { 
    baseCoords = { lat: 12.8628, lon: 30.2176 }; 
    resolvedLocation = 'Sudan'; 
  }

  if (baseCoords) specificity = 3;

  const jitter = getDeterministicJitter(title || country || 'signal', 0.6);
  return {
    lat: (baseCoords ? baseCoords.lat : 38.9072) + jitter.lat,
    lon: (baseCoords ? baseCoords.lon : -77.0369) + jitter.lon,
    resolvedLocation: resolvedLocation || country || 'Global',
    specificity
  };
}

function getTitleKeywords(title) {
  const stopWords = new Set(['a', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of']);
  return new Set(
    (title || '').toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  );
}

function calculateTitleFuzzySimilarity(title1, title2) {
  const words1 = getTitleKeywords(title1);
  const words2 = getTitleKeywords(title2);
  if (words1.size === 0 || words2.size === 0) return 0;
  let intersection = 0;
  words1.forEach(word => { if (words2.has(word)) intersection++; });
  const union = words1.size + words2.size - intersection;
  return intersection / union;
}

function getRegionGroup(location, title = '') {
  return 'Other';
}

async function run() {
  await initDb();
  console.log("Fetching GDELT...");
  
  let evs = [];
  try {
    const docRes = await fetch(GDELT_DOC_API);
    if (docRes.ok) {
      const doc = await docRes.json();
      evs = (doc.articles || []).map(a => {
        let ts = a.seendate || new Date().toISOString();
        if (typeof ts === 'string' && /^\d{14}$/.test(ts)) {
          ts = ts.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z');
        }
        const locationName = a.sourcecountry || 'Global';
        const coords = getCountryCoords(locationName, a.title, a.title);
        return {
          id: generateHashId(a.url, a.title),
          title: a.title || 'Untitled Signal',
          url: a.url,
          source: a.domain || 'OSINT',
          timestamp: ts,
          category: getCategory(a.title),
          severity: getSeverity(a.title),
          quality: getQuality(a.title),
          location: coords?.resolvedLocation || locationName,
          lat: coords ? coords.lat : null,
          lon: coords ? coords.lon : null,
          specificity: coords ? coords.specificity : 0,
          details: { ...a }
        };
      }).filter(e => e.quality > 1);
    }
  } catch (err) {
    console.error("GDELT fetch error:", err);
  }

  const dbEventsList = (await getEvents('today')).map(e => ({ ...e, fromDb: true }));
  console.log("DB Events loaded:", dbEventsList.length);
  
  const staticPath = path.join(process.cwd(), 'public', 'data', 'events.json');
  let staticEvents = [];
  if (fs.existsSync(staticPath)) {
    staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf-8'));
  }

  const archivedInfo = await getArchivedInfo();
  
  const filteredDbEventsList = dbEventsList.filter(e => !isEventArchived(e, archivedInfo));
  const filteredStaticEvents = staticEvents.filter(e => !isEventArchived(e, archivedInfo));
  const filteredEvs = evs.filter(e => !isEventArchived(e, archivedInfo));

  const sortedEvents = [...filteredStaticEvents, ...filteredDbEventsList, ...filteredEvs].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  // Assign high-fidelity coordinates
  sortedEvents.forEach(e => {
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

  const allEvents = [];
  sortedEvents.forEach(e => {
    const urlNorm = (e.url || '').split('?')[0];
    const titleNorm = (e.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 45);

    let duplicateIndex = -1;
    for (let i = 0; i < allEvents.length; i++) {
      const accepted = allEvents[i];
      const acceptedUrlNorm = (accepted.url || '').split('?')[0];
      if (urlNorm && acceptedUrlNorm && urlNorm === acceptedUrlNorm) {
        duplicateIndex = i;
        break;
      }
      const acceptedTitleNorm = (accepted.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 45);
      if (titleNorm && acceptedTitleNorm && titleNorm === acceptedTitleNorm) {
        duplicateIndex = i;
        break;
      }
      const similarity = calculateTitleFuzzySimilarity(e.title, accepted.title);
      if (similarity >= 0.6) {
        duplicateIndex = i;
        break;
      }
    }

    if (duplicateIndex !== -1) {
      const accepted = allEvents[duplicateIndex];
      const acceptedEdited = accepted.edited === true || accepted.edited === 'true';
      const currentEdited = e.edited === true || e.edited === 'true';

      if (acceptedEdited && !currentEdited) {
        return;
      }
      if (currentEdited && !acceptedEdited) {
        allEvents[duplicateIndex] = e;
        return;
      }
      if (accepted.fromDb && !e.fromDb) {
        return;
      }
      if (e.fromDb && !accepted.fromDb) {
        allEvents[duplicateIndex] = e;
        return;
      }
    } else {
      allEvents.push(e);
    }
  });

  const colombians = allEvents.filter(e => e.title.includes('Colombian'));
  console.log("=== FINAL processed Colombian events in route ===");
  console.log(colombians);

  process.exit(0);
}

run();
