const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function run() {
  try {
    const totalRes = await sql`SELECT count(*) as count FROM sigint_events`;
    console.log('Total events in DB:', totalRes.rows[0].count);

    const geoRes = await sql`SELECT count(*) as count FROM sigint_events WHERE title ILIKE '%[GeoConfirmed]%' OR details->>'source' = 'GeoConfirmed'`;
    console.log('GeoConfirmed events in DB:', geoRes.rows[0].count);

    const nonAiGeoRes = await sql`
      SELECT count(*) as count FROM sigint_events 
      WHERE (title ILIKE '%[GeoConfirmed]%' OR details->>'source' = 'GeoConfirmed')
      AND NOT (
        title ~* '\\y(artificial intelligence|ai|autonomous weapon|autonomous weapons|drone|drones|military ai|surveillance|facial recognition|biometric|biometrics|cyber|killer robot|killer robots|robotics|robotic|algorithm|algorithmic|automated)\\y'
        OR (details::text) ~* '\\y(artificial intelligence|ai|autonomous weapon|autonomous weapons|drone|drones|military ai|surveillance|facial recognition|biometric|biometrics|cyber|killer robot|killer robots|robotics|robotic|algorithm|algorithmic|automated)\\y'
      )
    `;
    console.log('Non-AI GeoConfirmed events in DB:', nonAiGeoRes.rows[0].count);
    
    // Print 5 sample non-AI GeoConfirmed events
    const sampleRes = await sql`
      SELECT id, title, timestamp, location FROM sigint_events 
      WHERE (title ILIKE '%[GeoConfirmed]%' OR details->>'source' = 'GeoConfirmed')
      AND NOT (
        title ~* '\\y(artificial intelligence|ai|autonomous weapon|autonomous weapons|drone|drones|military ai|surveillance|facial recognition|biometric|biometrics|cyber|killer robot|killer robots|robotics|robotic|algorithm|algorithmic|automated)\\y'
        OR (details::text) ~* '\\y(artificial intelligence|ai|autonomous weapon|autonomous weapons|drone|drones|military ai|surveillance|facial recognition|biometric|biometrics|cyber|killer robot|killer robots|robotics|robotic|algorithm|algorithmic|automated)\\y'
      )
      LIMIT 5
    `;
    console.log('Sample Non-AI GeoConfirmed events:');
    sampleRes.rows.forEach(r => console.log(`- [${r.id}] ${r.title} (${r.timestamp}) at ${r.location}`));
  } catch (err) {
    console.error('Error querying db:', err);
  }
}

run();
