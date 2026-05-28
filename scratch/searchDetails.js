const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/EventDetailsWindow.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const keyword = process.argv[2] || 'edit';
console.log(`Searching for keyword: "${keyword}" in components/EventDetailsWindow.js`);

let matches = 0;
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes(keyword.toLowerCase())) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
    matches++;
  }
});

console.log(`Total matches: ${matches}`);
