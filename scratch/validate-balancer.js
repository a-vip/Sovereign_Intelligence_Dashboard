// Direct DB test for regional signal balancer logic
require('dotenv').config({ path: '.env.local' });
const { initDb, getEvents } = require('../lib/db');

function getRegionGroup(location, title = '') {
  const loc = ((location || '') + ' ' + (title || '')).toLowerCase();
  if (loc.includes('ukraine') || loc.includes('kyiv') || loc.includes('kharkiv') || loc.includes('odesa') || loc.includes('lviv') || loc.includes('crimea')) {
    return 'Ukraine';
  }
  if (loc.includes('united states') || loc.includes('usa') || loc.includes('texas') || loc.includes('california') || loc.includes('arizona') || loc.includes('georgia') || loc.includes('new york') || loc.includes('washington') || loc.includes('florida') || loc.includes('illinois') || loc.includes('pennsylvania') || loc.includes('silicon valley') || loc.includes('san francisco')) {
    return 'USA';
  }
  if (loc.includes('israel') || loc.includes('gaza') || loc.includes('palestine') || loc.includes('lebanon') || loc.includes('beirut') || loc.includes('syria') || loc.includes('damascus') || loc.includes('jerusalem') || loc.includes('west bank') || loc.includes('tel aviv')) {
    return 'West Asia';
  }
  return 'Other';
}

async function validateBalancer() {
  console.log("=== Validating Spatial & Regional Balancer Logic ===");
  try {
    await initDb();
    const events = await getEvents('today');
    console.log(`Total events fetched from DB: ${events.length}`);

    const groupCountsBefore = { 'Ukraine': 0, 'USA': 0, 'West Asia': 0, 'Other': 0 };
    let skippedDrones = 0;
    events.forEach(e => {
      const region = getRegionGroup(e.location || 'Global', e.title);
      if (region === 'Ukraine' && (
        /drone|fpv|uav|quadcopter|unmanned/i.test(e.title || '') ||
        /drone|fpv|uav|quadcopter|unmanned/i.test(e.details?.summary || e.description || '')
      )) {
        skippedDrones++;
        return;
      }
      groupCountsBefore[region]++;
    });

    console.log(`\nFiltered out ${skippedDrones} Ukraine drone signals from analysis.`);
    console.log('\n--- Before Regional Balancing Caps (Drone-purged) ---');
    console.log(JSON.stringify(groupCountsBefore, null, 2));

    const GROUP_CAPS = { 'Ukraine': 10, 'USA': 10, 'West Asia': 10, 'Other': 150 };
    const groupCountsAfter = { 'Ukraine': 0, 'USA': 0, 'West Asia': 0, 'Other': 0 };
    const processedEvents = [];

    events.forEach(e => {
      const region = getRegionGroup(e.location || 'Global', e.title);
      if (region === 'Ukraine' && (
        /drone|fpv|uav|quadcopter|unmanned/i.test(e.title || '') ||
        /drone|fpv|uav|quadcopter|unmanned/i.test(e.details?.summary || e.description || '')
      )) {
        return;
      }
      
      const isCritical = e.severity >= 4 || e.edited === true || (e.source && (e.source.includes('Vault') || e.source.includes('OCHA') || e.source.includes('HRW')));
      
      if (groupCountsAfter[region] >= GROUP_CAPS[region] && !isCritical) {
        return; // Capped!
      }
      
      processedEvents.push(e);
      if (!isCritical) {
        groupCountsAfter[region]++;
      }
    });

    console.log('\n--- After Regional Balancing Caps ---');
    console.log(JSON.stringify(groupCountsAfter, null, 2));
    console.log(`Total active events after cap: ${processedEvents.length}`);

    // Verify underrepresented countries are in 'Other'
    const otherSample = events.filter(e => getRegionGroup(e.location || 'Global', e.title) === 'Other').slice(0, 5);
    if (otherSample.length > 0) {
      console.log('\n--- Sample Balanced Global Regions (Other Group) ---');
      otherSample.forEach(e => {
        console.log(`- [${e.location || 'Global'}] ${e.title} (Severity: ${e.severity})`);
      });
    }

  } catch (err) {
    console.error("Validation error:", err.message);
  } finally {
    process.exit(0);
  }
}

validateBalancer();
