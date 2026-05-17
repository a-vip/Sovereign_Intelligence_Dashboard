import { sql } from '@vercel/postgres';

export async function initDb() {
  if (!process.env.POSTGRES_URL) {
    console.warn('Database environment variable POSTGRES_URL is missing. Skipping initialization.');
    return;
  }
  try {
    // Split into individual queries to improve reliability and debuggability
    await sql`CREATE TABLE IF NOT EXISTS sigint_events (
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
    )`;

    await sql`CREATE TABLE IF NOT EXISTS vault_docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      filename TEXT,
      relative_path TEXT,
      category TEXT,
      content TEXT,
      preview TEXT,
      tags TEXT[],
      threat_level TEXT,
      last_modified TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE INDEX IF NOT EXISTS idx_sigint_timestamp ON sigint_events (timestamp DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vault_modified ON vault_docs (last_modified DESC)`;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

export async function saveEvents(events) {
  if (!process.env.POSTGRES_URL) return;
  if (!events || events.length === 0) return;
  try {
    const BATCH_SIZE = 25;
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(event => 
        sql`
          INSERT INTO sigint_events (id, title, category, severity, location, lat, lon, timestamp, url, details)
          VALUES (
            ${event.id}, 
            ${event.title}, 
            ${event.category}, 
            ${event.severity}, 
            ${event.location || 'Global'}, 
            ${event.lat}, 
            ${event.lon}, 
            ${event.timestamp}, 
            ${event.url || ''}, 
            ${JSON.stringify(event.details || {})}
          )
          ON CONFLICT (id) DO UPDATE SET
            severity = EXCLUDED.severity,
            location = EXCLUDED.location,
            lat = EXCLUDED.lat,
            lon = EXCLUDED.lon,
            details = sigint_events.details || EXCLUDED.details;
        `
      ));
    }
  } catch (error) {
    console.error('Database save error:', error);
  }
}

export async function getEvents(timespan = '24h') {
  if (!process.env.POSTGRES_URL) return [];
  try {
    let interval = '24 hours';
    if (timespan === '6h') interval = '6 hours';
    if (timespan === 'today') {
      const { rows } = await sql`SELECT * FROM sigint_events WHERE timestamp >= CURRENT_DATE ORDER BY timestamp DESC`;
      return rows;
    }
    const { rows } = await sql`SELECT * FROM sigint_events WHERE timestamp >= NOW() - CAST(${interval} AS INTERVAL) ORDER BY timestamp DESC LIMIT 500`;
    return rows;
  } catch (error) {
    console.error('Database fetch error:', error);
    return [];
  }
}

export async function getAggregatedStats() {
  if (!process.env.POSTGRES_URL) return null;
  try {
    const [categories, severities, total, critical] = await Promise.all([
      sql`SELECT category, count(*) as count FROM sigint_events GROUP BY category`,
      sql`SELECT severity, count(*) as count FROM sigint_events GROUP BY severity`,
      sql`SELECT count(*) as total FROM sigint_events`,
      sql`SELECT count(*) as count FROM sigint_events WHERE severity >= 4`
    ]);

    return {
      categories: categories.rows,
      severities: severities.rows,
      total: parseInt(total.rows[0].total || 0),
      critical: parseInt(critical.rows[0].count || 0)
    };
  } catch (error) {
    console.error('Stats error:', error);
    return null;
  }
}

export async function saveVaultDocs(docs) {
  if (!process.env.POSTGRES_URL) return;
  if (!docs || docs.length === 0) return;
  try {
    const BATCH_SIZE = 10;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(doc => 
        sql`
          INSERT INTO vault_docs (id, title, filename, relative_path, category, content, preview, tags, threat_level, last_modified)
          VALUES (
            ${doc.id}, 
            ${doc.title}, 
            ${doc.filename}, 
            ${doc.relativePath}, 
            ${doc.category}, 
            ${doc.content}, 
            ${doc.preview}, 
            ${doc.tags}, 
            ${doc.threatLevel}, 
            ${doc.lastModified}
          )
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            preview = EXCLUDED.preview,
            last_modified = EXCLUDED.last_modified,
            threat_level = EXCLUDED.threat_level;
        `
      ));
    }
  } catch (error) {
    console.error('Vault save error:', error);
  }
}

export async function getVaultDocs() {
  if (!process.env.POSTGRES_URL) return [];
  try {
    const { rows } = await sql`SELECT * FROM vault_docs ORDER BY last_modified DESC`;
    return rows.map(r => ({
      ...r,
      relativePath: r.relative_path,
      threatLevel: r.threat_level,
      lastModified: r.last_modified
    }));
  } catch (error) {
    console.error('Vault fetch error:', error);
    return [];
  }
}
