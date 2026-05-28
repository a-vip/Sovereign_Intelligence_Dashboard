const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/events?timespan=today',
  method: 'GET',
  timeout: 2000
};

console.log("Checking if local server is active at http://localhost:3000...");
const req = http.request(options, (res) => {
  console.log(`Server responded with status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Server response sample:", data.substring(0, 200));
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error("Local server is not running or not responding at port 3000:", err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error("Request timed out.");
  req.destroy();
  process.exit(1);
});

req.end();
