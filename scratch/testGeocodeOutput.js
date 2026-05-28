const fs = require('fs');
const path = require('path');

// Let's load getCountryCoords directly from app/api/events/route.js by reading it and wrapping it in an executable function!
const routeContent = fs.readFileSync('app/api/events/route.js', 'utf8');

// We find the function getCountryCoords(country, title = '', summary = '')
const startIdx = routeContent.indexOf('function getCountryCoords(');
// Find the closing brace of getCountryCoords. Since it's a large function, we scan until the next function definition 'function parseLocalRadarDossiers'
const endIdx = routeContent.indexOf('function parseLocalRadarDossiers(');

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find getCountryCoords or parseLocalRadarDossiers in route.js");
  process.exit(1);
}

const getCountryCoordsCode = routeContent.substring(startIdx, endIdx);

// Also we need getDeterministicJitter
const jitterStart = routeContent.indexOf('function getDeterministicJitter(');
const jitterEnd = routeContent.indexOf('function getCountryCoords(');
const jitterCode = routeContent.substring(jitterStart, jitterEnd);

const staticPath = path.join(process.cwd(), 'public', 'data', 'events.json');
const staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf-8'));
const match = staticEvents.find(e => e.title.includes('Colombian'));
const title = match.title;
const summary = match.details?.summary || match.description || '';

const executableCode = `
${jitterCode}
${getCountryCoordsCode}

console.log("=== Testing getCountryCoords (route.js) ===");
const res = getCountryCoords("Global", ${JSON.stringify(title)}, ${JSON.stringify(summary)});
console.log("Result Location:", res.resolvedLocation);
console.log("Result Coords: (", res.lat, ",", res.lon, ")");
console.log("Result Specificity:", res.specificity);
`;

eval(executableCode);

console.log("\n=== Testing geocodeText (lib/geocoder.js) ===");
const { geocodeText } = require('../lib/geocoder');
const geoRes = geocodeText(title, summary, match.source);
console.log("Result Location:", geoRes.name);
console.log("Result Coords: (", geoRes.lat, ",", geoRes.lon, ")");
