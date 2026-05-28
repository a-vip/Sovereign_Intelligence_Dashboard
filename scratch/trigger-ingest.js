async function triggerIngest() {
  console.log("=== Triggering Ingest Cron Job ===");
  try {
    const res = await fetch('http://localhost:3000/api/cron/ingest');
    if (!res.ok) {
      throw new Error(`Ingest returned status ${res.status}`);
    }
    const data = await res.json();
    console.log("Ingest completed successfully:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Ingest trigger failed:", err.message);
  }
}

triggerIngest();
