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
        timestamp TIMESTAMP WITH TIME ZONE,
        url TEXT,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Database initialized');
  } catch (error) {
    console.error('Database init error:', error);
  }
}

export async function saveEvents(events) {
  if (!events || events.length === 0) return;
  try {
    // Bulk insert pattern using mapped values
    for (const event of events) {
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
    let interval = '24 hours';
    if (timespan === '6h') interval = '6 hours';
    if (timespan === 'today') {
      const { rows } = await sql`
        SELECT * FROM sigint_events 
        WHERE timestamp >= CURRENT_DATE
        ORDER BY timestamp DESC;
      `;
      return rows;
    }

    const { rows } = await sql`
      SELECT * FROM sigint_events 
      WHERE timestamp >= NOW() - CAST(${interval} AS INTERVAL)
      ORDER BY timestamp DESC
      LIMIT 500;
    `;
    return rows;
  } catch (error) {
    console.error('Database fetch error:', error);
    return [];
  }
}

export async function getAggregatedStats() {
  try {
    // Get counts per category and severity from all time
    const categoryQuery = sql`SELECT category, count(*) as count FROM sigint_events GROUP BY category`;
    const severityQuery = sql`SELECT severity, count(*) as count FROM sigint_events GROUP BY severity`;
    const totalQuery = sql`SELECT count(*) as total FROM sigint_events`;
    const criticalQuery = sql`SELECT count(*) as count FROM sigint_events WHERE severity >= 4`;
    
    const [categories, severities, total, critical] = await Promise.all([
      categoryQuery, severityQuery, totalQuery, criticalQuery
    ]);

    return {
      categories: categories.rows,
      severities: severities.rows,
      total: parseInt(total.rows[0].total),
      critical: parseInt(critical.rows[0].count)
    };
  } catch (error) {
    console.error('Stats aggregation error:', error);
    return null;
  }
}
