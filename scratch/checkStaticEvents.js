const fs = require('fs');
const path = require('path');

function check() {
  console.log("=== Checking public/data/events.json ===");
  const filePath = path.resolve('public/data/events.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log("Total static events:", data.length);
    const matches = data.filter(e => 
      (e.title || '').includes('Colombian') || 
      (e.title || '').includes('Sudan')
    );
    console.log("Matches:", matches);
  } else {
    console.log("File does not exist");
  }
}

check();
