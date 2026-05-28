require('dotenv').config({ path: '.env.local' });
const { initDb, getEvents } = require('../lib/db');
const { sql } = require('@vercel/postgres');

// Copying helper functions from route.js to test them exactly
function getNormalizedTitle(title) {
  return (title || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 45);
}

function getNormalizedUrl(url) {
  if (!url) return '';
  return url.toLowerCase().split('?')[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function calculateTitleFuzzySimilarity(t1, t2) {
  const s1 = new Set((t1 || '').toLowerCase().split(/\s+/));
  const s2 = new Set((t2 || '').toLowerCase().split(/\s+/));
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  return intersection.size / union.size;
}

function getRegionGroup(location, title = '') {
  const loc = ((location || '') + ' ' + (title || '')).toLowerCase();
  if (loc.includes('ukraine') || loc.includes('kyiv')) return 'Ukraine';
  if (loc.includes('united states') || loc.includes('usa')) return 'USA';
  if (loc.includes('israel') || loc.includes('gaza') || loc.includes('palestine') || loc.includes('syria')) return 'West Asia';
  return 'Other';
}

async function run() {
  await initDb();
  console.log("=== Loading DB Events ===");
  const dbEventsList = (await getEvents('today')).map(e => ({ ...e, fromDb: true }));
  console.log(`Loaded ${dbEventsList.length} events from DB.`);

  // Let's mock a live GDELT article that has the "Canada v. Syria" title but the same URL
  const mockGdeltEvent = {
    id: "e30e12e2d09796035fdb18809ba8cfc0",
    title: "Canada v. Syria case at ICJ informs Chad Habré anniversary - HRW",
    url: "https://www.hrw.org/news/2026/05/25/chad-10-years-on-habre-conviction-inspires-global-justice",
    source: "hrw.org",
    timestamp: "2026-05-25T17:00:00.000Z",
    category: "Humanitarian",
    severity: 3,
    location: "Damascus, Syria",
    lat: 34.802075,
    lon: 38.996815,
    details: { summary: "Canada v. Syria case..." }
  };

  const filteredEvs = [mockGdeltEvent];

  // Merge and Deduplicate like route.js
  const eventMap = new Map();
  filteredEvs.forEach(e => eventMap.set(e.id, e));
  dbEventsList.forEach(e => eventMap.set(e.id, e));

  const sortedEvents = Array.from(eventMap.values()).sort((a, b) => {
    const isA = a.source?.includes('Vault') || a.source?.includes('OCHA') || a.source?.includes('HRW');
    const isB = b.source?.includes('Vault') || b.source?.includes('OCHA') || b.source?.includes('HRW');
    if (isA && !isB) return -1;
    if (!isA && isB) return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const allEvents = [];
  const groupCounts = { 'Ukraine': 0, 'USA': 0, 'West Asia': 0, 'Other': 0 };
  const GROUP_CAPS = { 'Ukraine': 10, 'USA': 10, 'West Asia': 10, 'Other': 150 };

  sortedEvents.forEach(e => {
    const region = getRegionGroup(e.location || 'Global', e.title);
    const isCritical = e.severity >= 4 || e.edited === true || (e.source && (e.source.includes('Vault') || e.source.includes('OCHA') || e.source.includes('HRW')));
    
    if (groupCounts[region] >= GROUP_CAPS[region] && !isCritical) {
      return;
    }

    const urlNorm = getNormalizedUrl(e.url);
    const titleNorm = getNormalizedTitle(e.title);

    let duplicateIndex = -1;
    for (let i = 0; i < allEvents.length; i++) {
      const accepted = allEvents[i];
      
      const acceptedUrlNorm = getNormalizedUrl(accepted.url);
      if (urlNorm && acceptedUrlNorm && urlNorm === acceptedUrlNorm) {
        duplicateIndex = i;
        break;
      }
      
      const acceptedTitleNorm = getNormalizedTitle(accepted.title);
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

      console.log(`Duplicate found between:`);
      console.log(`  Accepted: "${accepted.title}" (ID: ${accepted.id}, edited: ${accepted.edited}, location: ${accepted.location})`);
      console.log(`  Current:  "${e.title}" (ID: ${e.id}, edited: ${e.edited}, location: ${e.location})`);

      if (acceptedEdited && !currentEdited) {
        console.log(`  -> Keep Accepted because it is edited.`);
        return;
      }
      if (currentEdited && !acceptedEdited) {
        console.log(`  -> Replace with Current because it is edited.`);
        allEvents[duplicateIndex] = e;
        return;
      }

      if (accepted.fromDb && !e.fromDb) {
        console.log(`  -> Keep Accepted because it is from DB.`);
        return;
      }
      if (e.fromDb && !accepted.fromDb) {
        console.log(`  -> Replace with Current because it is from DB.`);
        allEvents[duplicateIndex] = e;
        return;
      }
      return;
    }

    allEvents.push(e);
    if (!isCritical) {
      groupCounts[region]++;
    }
  });

  console.log("\n=== Final Deduplicated Events ===");
  console.log(JSON.stringify(allEvents.map(e => ({ id: e.id, title: e.title, location: e.location, edited: e.edited })), null, 2));
}

run();
