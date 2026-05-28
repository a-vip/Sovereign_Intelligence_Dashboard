const fs = require('fs');
const path = require('path');

function check() {
  console.log("=== Checking Local JSON Files ===");
  const localEventsFile = path.resolve('events-local.json');
  if (fs.existsSync(localEventsFile)) {
    const events = JSON.parse(fs.readFileSync(localEventsFile, 'utf8'));
    console.log("Local events count:", events.length);
    const matches = events.filter(e => (e.title || '').includes('Colombian'));
    console.log("Matches in events-local.json:", matches);
  } else {
    console.log("events-local.json does not exist");
  }

  const localRssFile = path.resolve('rss-local.json');
  if (fs.existsSync(localRssFile)) {
    const rss = JSON.parse(fs.readFileSync(localRssFile, 'utf8'));
    console.log("Local RSS count:", rss.length);
    const matches = rss.filter(e => (e.title || '').includes('Colombian'));
    console.log("Matches in rss-local.json:", matches);
  } else {
    console.log("rss-local.json does not exist");
  }
}

check();
