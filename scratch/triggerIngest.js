async function run() {
  console.log('Sending request to local cron ingest endpoint (this might take 15-30 seconds to fetch from all APIs and process/enrich)...');
  try {
    const res = await fetch('http://localhost:3000/api/cron/ingest', {
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log('Ingest Ingestion Summary:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Trigger error:', err.message);
  }
}

run();
