import { sql } from '@vercel/postgres';

export async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS sigint_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT,
        severity INTEGER,
        location TEXT,
        lat FLOAT,
        lon FLOAT,
        timestamp TIMESTAMP,
        url TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Database initialized');
  } catch (error) {
    console.error('Database init error:', error);
  }
}

export async function saveEvents(events) {
  try {
    for (const event of events) {
      // Use ON CONFLICT DO NOTHING to avoid duplicates
      await sql`
        INSERT INTO sigint_events (id, title, category, severity, location, lat, lon, timestamp, url, details)
        VALUES (
          ${event.id}, 
          ${event.title}, 
          ${event.category}, 
          ${event.severity}, 
          ${event.location || ''}, 
          ${event.lat}, 
          ${event.lon}, 
          ${event.timestamp}, 
          ${event.url || ''}, 
          ${JSON.stringify(event.details || {})}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  } catch (error) {
    console.error('Database save error:', error);
  }
}

export async function getEvents(timespan = '24h') {
  try {
    const hours = timespan === '6h' ? 6 : 24;
    const { rows } = await sql`
      SELECT * FROM sigint_events 
      WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
      ORDER BY timestamp DESC
      LIMIT 500;
    `;
    return rows;
  } catch (error) {
    console.error('Database fetch error:', error);
    return [];
  }
}
