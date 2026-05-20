import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Path for local database files (used only in local dev environment when POSTGRES_URL is missing)
const LOCAL_USERS_FILE = path.resolve('users-local.json');
const LOCAL_EVENTS_FILE = path.resolve('events-local.json');
const LOCAL_VAULT_FILE = path.resolve('vault-local.json');
const LOCAL_PENDING_REGISTRATIONS_FILE = path.resolve('pending-registrations-local.json');
const LOCAL_SUGGESTIONS_FILE = path.resolve('suggestions-local.json');
const LOCAL_RSS_FILE = path.resolve('rss-local.json');
const LOCAL_DATACENTERS_FILE = path.resolve('datacenters-local.json');

function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`Failed to read local file: ${filePath}`, e);
  }
  return [];
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Failed to write local file: ${filePath}`, e);
  }
}

export function sanitizeEventTimestamp(event) {
  if (!event) return event;
  
  let targetTimestamp = event.timestamp;
  const url = event.url || '';
  const details = event.details || {};
  
  // 1. Try to extract date from the URL path (highly robust for news articles!)
  const urlDateRegexes = [
    /\/(\d{4})[/-](\d{2})[/-](\d{2})\b/, // /2026/05/14/ or /2026-05-14/
    /\/(\d{4})\/(\d{1,2})\/(\d{1,2})\b/, // /2026/5/14/
    /[_-](\d{4})(\d{2})(\d{2})[_-]/,      // _20260514_ or -20260514-
    /\/(\d{4})(\d{2})(\d{2})\b/          // /20260514
  ];
  
  let extractedDate = null;
  for (const regex of urlDateRegexes) {
    const match = url.match(regex);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = parseInt(match[3]);
      
      if (year >= 2000 && year <= new Date().getFullYear() + 1 && month >= 0 && month < 12 && day >= 1 && day <= 31) {
        extractedDate = new Date(Date.UTC(year, month, day, 12, 0, 0)); // default to noon UTC
        break;
      }
    }
  }
  
  // 2. Try to scan details or nested metadata for publication date
  if (!extractedDate && details) {
    const dateFields = ['publishdate', 'publish_date', 'pubdate', 'published_at', 'pub_date', 'date'];
    for (const field of dateFields) {
      const val = details[field];
      if (val) {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          extractedDate = parsed;
          break;
        }
      }
    }
  }
  
  // 3. Fallback to standard parsing of current timestamp
  let parsedTimestamp = null;
  if (targetTimestamp) {
    const cleanTs = String(targetTimestamp).trim();
    if (/^\d{14}$/.test(cleanTs)) {
      parsedTimestamp = new Date(cleanTs.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z'));
    } else if (/^\d{8}T\d{6}Z$/.test(cleanTs)) {
      parsedTimestamp = new Date(cleanTs.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
    } else {
      parsedTimestamp = new Date(cleanTs);
    }
  }
  
  // 4. Resolve the best timestamp
  let finalDate = extractedDate || parsedTimestamp;
  if (!finalDate || isNaN(finalDate.getTime())) {
    finalDate = new Date();
  }
  
  // 5. Future date clamp (prevent clock drift / future indexing issues)
  const now = new Date();
  if (finalDate.getTime() > now.getTime() + 7200000) {
    finalDate = now;
  }
  
  event.timestamp = finalDate.toISOString();
  return event;
}

export async function initDb() {
  if (!process.env.POSTGRES_URL) {
    console.warn('Database environment variable POSTGRES_URL is missing. Using local JSON files for persistent state.');
    // Ensure files exist
    if (!fs.existsSync(LOCAL_USERS_FILE)) writeJsonFile(LOCAL_USERS_FILE, []);
    if (!fs.existsSync(LOCAL_EVENTS_FILE)) writeJsonFile(LOCAL_EVENTS_FILE, []);
    if (!fs.existsSync(LOCAL_VAULT_FILE)) writeJsonFile(LOCAL_VAULT_FILE, []);
    if (!fs.existsSync(LOCAL_PENDING_REGISTRATIONS_FILE)) writeJsonFile(LOCAL_PENDING_REGISTRATIONS_FILE, []);
    if (!fs.existsSync(LOCAL_SUGGESTIONS_FILE)) writeJsonFile(LOCAL_SUGGESTIONS_FILE, []);
    if (!fs.existsSync(LOCAL_RSS_FILE)) writeJsonFile(LOCAL_RSS_FILE, []);
    if (!fs.existsSync(LOCAL_DATACENTERS_FILE)) writeJsonFile(LOCAL_DATACENTERS_FILE, []);
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

    await sql`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'analyst',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP WITH TIME ZONE
    )`;

    await sql`CREATE TABLE IF NOT EXISTS pending_registrations (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'analyst',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL
    )`;

    await sql`CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      details TEXT NOT NULL,
      target_id TEXT,
      operator_email TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      screenshot TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS rss_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL,
      sid TEXT NOT NULL,
      location TEXT,
      latitude FLOAT,
      longitude FLOAT,
      category TEXT,
      severity INTEGER DEFAULT 1,
      summary TEXT,
      published_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    // Self-healing migration for existing databases
    try {
      await sql`ALTER TABLE rss_items ADD COLUMN IF NOT EXISTS location TEXT`;
      await sql`ALTER TABLE rss_items ADD COLUMN IF NOT EXISTS latitude FLOAT`;
      await sql`ALTER TABLE rss_items ADD COLUMN IF NOT EXISTS longitude FLOAT`;
      await sql`ALTER TABLE rss_items ADD COLUMN IF NOT EXISTS category TEXT`;
      await sql`ALTER TABLE rss_items ADD COLUMN IF NOT EXISTS severity INTEGER DEFAULT 1`;
      await sql`ALTER TABLE rss_items ADD COLUMN IF NOT EXISTS summary TEXT`;
      await sql`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS screenshot TEXT`;
    } catch (migError) {
      console.warn('Database schema migration warnings:', migError.message);
    }

    await sql`CREATE TABLE IF NOT EXISTS data_centers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT,
      country TEXT,
      lat FLOAT,
      lon FLOAT,
      operator TEXT,
      status TEXT DEFAULT 'active',
      website TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS archived_events (
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
      source_table TEXT DEFAULT 'sigint_events',
      archived_by TEXT,
      archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      original_created_at TIMESTAMP WITH TIME ZONE
    )`;

    await sql`CREATE INDEX IF NOT EXISTS idx_datacenters_geo ON data_centers (lat, lon)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sigint_timestamp ON sigint_events (timestamp DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vault_modified ON vault_docs (last_modified DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pending_email ON pending_registrations (email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_suggestions_created ON suggestions (created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rss_published ON rss_items (published_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_archived_at ON archived_events (archived_at DESC)`;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

export async function saveEvents(events) {
  if (!events || events.length === 0) return;
  const sanitized = events.map(e => sanitizeEventTimestamp(e));
  
  if (!process.env.POSTGRES_URL) {
    const localEvents = readJsonFile(LOCAL_EVENTS_FILE);
    const eventMap = new Map(localEvents.map(e => [e.id, e]));
    
    sanitized.forEach(e => {
      const existing = eventMap.get(e.id) || {};
      eventMap.set(e.id, {
        ...existing,
        ...e,
        location: e.location || 'Global',
        details: { ...(existing.details || {}), ...(e.details || {}) },
        created_at: existing.created_at || new Date().toISOString()
      });
    });
    
    writeJsonFile(LOCAL_EVENTS_FILE, Array.from(eventMap.values()));
    return;
  }
  try {
    const BATCH_SIZE = 25;
    for (let i = 0; i < sanitized.length; i += BATCH_SIZE) {
      const batch = sanitized.slice(i, i + BATCH_SIZE);
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
            timestamp = EXCLUDED.timestamp,
            details = sigint_events.details || EXCLUDED.details;
        `
      ));
    }
  } catch (error) {
    console.error('Database save error:', error);
  }
}

export async function getEvents(timespan = '24h') {
  if (!process.env.POSTGRES_URL) {
    const localEvents = readJsonFile(LOCAL_EVENTS_FILE);
    let hasChanges = false;
    const sanitizedLocal = localEvents.map(e => {
      const originalTs = e.timestamp;
      const sanitized = sanitizeEventTimestamp(e);
      if (originalTs !== sanitized.timestamp) {
        hasChanges = true;
      }
      return sanitized;
    });
    if (hasChanges) {
      writeJsonFile(LOCAL_EVENTS_FILE, sanitizedLocal);
    }
    // Sort local events by timestamp descending
    return sanitizedLocal
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 500);
  }
  try {
    let interval = '24 hours';
    if (timespan === '6h') interval = '6 hours';
    let rows = [];
    if (timespan === 'today') {
      const res = await sql`SELECT * FROM sigint_events WHERE timestamp >= CURRENT_DATE ORDER BY timestamp DESC`;
      rows = res.rows;
    } else {
      const res = await sql`SELECT * FROM sigint_events WHERE timestamp >= NOW() - CAST(${interval} AS INTERVAL) ORDER BY timestamp DESC LIMIT 500`;
      rows = res.rows;
    }
    
    // Perform self-healing date corrections in the background
    const sanitizedRows = rows.map(r => {
      const originalTs = r.timestamp;
      const sanitized = sanitizeEventTimestamp(r);
      
      // If the true publication date was extracted and corrected, perform a background update!
      if (originalTs && sanitized.timestamp && new Date(originalTs).getTime() !== new Date(sanitized.timestamp).getTime()) {
        sql`UPDATE sigint_events SET timestamp = ${sanitized.timestamp} WHERE id = ${sanitized.id}`.catch(err => {
          console.error('Background timestamp correction error:', err);
        });
      }
      return sanitized;
    });
    
    return sanitizedRows;
  } catch (error) {
    console.error('Database fetch error:', error);
    return [];
  }
}

export async function getAggregatedStats() {
  if (!process.env.POSTGRES_URL) {
    const localEvents = readJsonFile(LOCAL_EVENTS_FILE);
    const categoriesMap = {};
    const severitiesMap = {};
    let total = localEvents.length;
    let critical = 0;
    
    localEvents.forEach(e => {
      categoriesMap[e.category] = (categoriesMap[e.category] || 0) + 1;
      severitiesMap[e.severity] = (severitiesMap[e.severity] || 0) + 1;
      if (e.severity >= 4) critical++;
    });
    
    return {
      categories: Object.keys(categoriesMap).map(k => ({ category: k, count: categoriesMap[k] })),
      severities: Object.keys(severitiesMap).map(k => ({ severity: parseInt(k), count: severitiesMap[k] })),
      total,
      critical
    };
  }
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
  if (!docs || docs.length === 0) return;
  if (!process.env.POSTGRES_URL) {
    const localVault = readJsonFile(LOCAL_VAULT_FILE);
    const vaultMap = new Map(localVault.map(d => [d.id, d]));
    
    docs.forEach(d => {
      vaultMap.set(d.id, {
        ...d,
        last_modified: d.lastModified,
        threat_level: d.threatLevel,
        relative_path: d.relativePath
      });
    });
    
    writeJsonFile(LOCAL_VAULT_FILE, Array.from(vaultMap.values()));
    return;
  }
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
  if (!process.env.POSTGRES_URL) {
    const localVault = readJsonFile(LOCAL_VAULT_FILE);
    return localVault.map(r => ({
      ...r,
      relativePath: r.relative_path,
      threatLevel: r.threat_level,
      lastModified: r.last_modified
    }));
  }
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

export async function createUser(email, passwordHash, fullName, role = 'analyst') {
  if (!process.env.POSTGRES_URL) {
    const localUsers = readJsonFile(LOCAL_USERS_FILE);
    const existing = localUsers.find(u => u.email === email.toLowerCase().trim());
    if (existing) {
      throw new Error('User already exists');
    }
    const newUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      full_name: fullName.trim(),
      role: role,
      created_at: new Date().toISOString()
    };
    localUsers.push(newUser);
    writeJsonFile(LOCAL_USERS_FILE, localUsers);
    return newUser;
  }
  
  try {
    const userId = crypto.randomUUID();
    const { rows } = await sql`
      INSERT INTO users (id, email, password_hash, full_name, role)
      VALUES (${userId}, ${email.toLowerCase().trim()}, ${passwordHash}, ${fullName.trim()}, ${role})
      RETURNING id, email, full_name, role, created_at
    `;
    return rows[0];
  } catch (error) {
    console.error('createUser error:', error);
    throw error;
  }
}

export async function getUserByEmail(email) {
  if (!process.env.POSTGRES_URL) {
    const localUsers = readJsonFile(LOCAL_USERS_FILE);
    const found = localUsers.find(u => u.email === email.toLowerCase().trim());
    return found || null;
  }
  try {
    const { rows } = await sql`
      SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('getUserByEmail error:', error);
    return null;
  }
}

export async function updateUser(userId, { fullName, email, passwordHash }) {
  if (!process.env.POSTGRES_URL) {
    const localUsers = readJsonFile(LOCAL_USERS_FILE);
    const index = localUsers.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    
    if (email) {
      const emailLower = email.toLowerCase().trim();
      const duplicate = localUsers.find(u => u.email === emailLower && u.id !== userId);
      if (duplicate) throw new Error('Email already registered by another operator');
      localUsers[index].email = emailLower;
    }
    
    if (fullName) localUsers[index].full_name = fullName.trim();
    if (passwordHash) localUsers[index].password_hash = passwordHash;
    
    writeJsonFile(LOCAL_USERS_FILE, localUsers);
    return {
      id: localUsers[index].id,
      email: localUsers[index].email,
      fullName: localUsers[index].full_name,
      role: localUsers[index].role,
      createdAt: localUsers[index].created_at
    };
  }
  
  try {
    if (fullName !== undefined) {
      await sql`UPDATE users SET full_name = ${fullName.trim()} WHERE id = ${userId}`;
    }
    if (email !== undefined) {
      const emailLower = email.toLowerCase().trim();
      const { rows: duplicates } = await sql`SELECT id FROM users WHERE email = ${emailLower} AND id != ${userId}`;
      if (duplicates.length > 0) throw new Error('Email already registered by another operator');
      await sql`UPDATE users SET email = ${emailLower} WHERE id = ${userId}`;
    }
    if (passwordHash !== undefined) {
      await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
    }
    
    const { rows } = await sql`
      SELECT id, email, full_name as "fullName", role, created_at as "createdAt" FROM users WHERE id = ${userId}
    `;
    return rows[0];
  } catch (error) {
    console.error('updateUser error:', error);
    throw error;
  }
}

export async function createPendingRegistration(token, email, passwordHash, fullName, role, expiresAt) {
  if (!process.env.POSTGRES_URL) {
    const localPending = readJsonFile(LOCAL_PENDING_REGISTRATIONS_FILE);
    // Remove any existing pending registration for this email to avoid duplicates
    const filtered = localPending.filter(p => p.email !== email.toLowerCase().trim());
    const newPending = {
      token,
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      full_name: fullName.trim(),
      role: role,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };
    filtered.push(newPending);
    writeJsonFile(LOCAL_PENDING_REGISTRATIONS_FILE, filtered);
    return newPending;
  }

  try {
    // Remove any existing pending registration for this email
    await sql`DELETE FROM pending_registrations WHERE email = ${email.toLowerCase().trim()}`;
    const { rows } = await sql`
      INSERT INTO pending_registrations (token, email, password_hash, full_name, role, expires_at)
      VALUES (${token}, ${email.toLowerCase().trim()}, ${passwordHash}, ${fullName.trim()}, ${role}, ${expiresAt})
      RETURNING token, email, full_name, role, expires_at
    `;
    return rows[0];
  } catch (error) {
    console.error('createPendingRegistration error:', error);
    throw error;
  }
}

export async function getPendingRegistration(token) {
  if (!process.env.POSTGRES_URL) {
    const localPending = readJsonFile(LOCAL_PENDING_REGISTRATIONS_FILE);
    const found = localPending.find(p => p.token === token);
    return found || null;
  }

  try {
    const { rows } = await sql`
      SELECT * FROM pending_registrations WHERE token = ${token}
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('getPendingRegistration error:', error);
    return null;
  }
}

export async function deletePendingRegistration(token) {
  if (!process.env.POSTGRES_URL) {
    const localPending = readJsonFile(LOCAL_PENDING_REGISTRATIONS_FILE);
    const filtered = localPending.filter(p => p.token !== token);
    writeJsonFile(LOCAL_PENDING_REGISTRATIONS_FILE, filtered);
    return;
  }

  try {
    await sql`
      DELETE FROM pending_registrations WHERE token = ${token}
    `;
  } catch (error) {
    console.error('deletePendingRegistration error:', error);
  }
}

export async function saveSuggestion({ type, subject, details, targetId, operatorEmail, operatorName, screenshot }) {
  const id = crypto.randomUUID();
  if (!process.env.POSTGRES_URL) {
    const localSuggestions = readJsonFile(LOCAL_SUGGESTIONS_FILE);
    const newSuggestion = {
      id,
      type,
      subject,
      details,
      target_id: targetId || null,
      operator_email: operatorEmail,
      operator_name: operatorName,
      screenshot: screenshot || null,
      created_at: new Date().toISOString()
    };
    localSuggestions.push(newSuggestion);
    writeJsonFile(LOCAL_SUGGESTIONS_FILE, localSuggestions);
    return newSuggestion;
  }

  try {
    const { rows } = await sql`
      INSERT INTO suggestions (id, type, subject, details, target_id, operator_email, operator_name, screenshot)
      VALUES (${id}, ${type}, ${subject}, ${details}, ${targetId || null}, ${operatorEmail}, ${operatorName}, ${screenshot || null})
      RETURNING id, type, subject, details, target_id as "targetId", operator_email as "operatorEmail", operator_name as "operatorName", screenshot, created_at as "createdAt"
    `;
    return rows[0];
  } catch (error) {
    console.error('saveSuggestion error:', error);
    throw error;
  }
}

export async function saveRssItems(items) {
  if (!items || items.length === 0) return;
  
  if (!process.env.POSTGRES_URL) {
    const localRss = readJsonFile(LOCAL_RSS_FILE);
    const rssMap = new Map(localRss.map(i => [i.url, i]));
    
    items.forEach(item => {
      const existing = rssMap.get(item.url);
      if (!existing) {
        rssMap.set(item.url, {
          id: item.id || crypto.createHash('md5').update(item.url).digest('hex'),
          title: item.title,
          url: item.url,
          source: item.source,
          sid: item.sid,
          location: item.location || null,
          latitude: item.latitude !== undefined ? item.latitude : null,
          longitude: item.longitude !== undefined ? item.longitude : null,
          category: item.category || 'Political',
          severity: item.severity || 1,
          summary: item.summary || null,
          published_at: item.published_at || new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      } else {
        // Backfill missing fields for existing feeds
        existing.location = item.location || existing.location;
        existing.latitude = item.latitude !== undefined && item.latitude !== null ? item.latitude : existing.latitude;
        existing.longitude = item.longitude !== undefined && item.longitude !== null ? item.longitude : existing.longitude;
        existing.category = item.category || existing.category;
        existing.severity = item.severity || existing.severity;
        existing.summary = item.summary || existing.summary;
        rssMap.set(item.url, existing);
      }
    });
    
    writeJsonFile(LOCAL_RSS_FILE, Array.from(rssMap.values()));
    return;
  }
  
  try {
    const BATCH_SIZE = 25;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(item => {
        const id = item.id || crypto.createHash('md5').update(item.url).digest('hex');
        const latVal = (item.latitude !== undefined && item.latitude !== null) ? parseFloat(item.latitude) : null;
        const lonVal = (item.longitude !== undefined && item.longitude !== null) ? parseFloat(item.longitude) : null;
        
        return sql`
          INSERT INTO rss_items (id, title, url, source, sid, location, latitude, longitude, category, severity, summary, published_at)
          VALUES (
            ${id}, 
            ${item.title}, 
            ${item.url}, 
            ${item.source}, 
            ${item.sid}, 
            ${item.location || null}, 
            ${latVal}, 
            ${lonVal}, 
            ${item.category || 'Political'}, 
            ${item.severity || 1}, 
            ${item.summary || null}, 
            ${item.published_at}
          )
          ON CONFLICT (url) DO UPDATE SET
            location = EXCLUDED.location,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            category = EXCLUDED.category,
            severity = EXCLUDED.severity,
            summary = EXCLUDED.summary;
        `;
      }));
    }
  } catch (error) {
    console.error('saveRssItems database error:', error);
  }
}

export async function getRssItems(limit = 100) {
  if (!process.env.POSTGRES_URL) {
    const localRss = readJsonFile(LOCAL_RSS_FILE);
    return localRss
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .slice(0, limit);
  }
  
  try {
    const { rows } = await sql`
      SELECT 
        id, 
        title, 
        url, 
        source, 
        sid, 
        location, 
        latitude as "latitude", 
        longitude as "longitude", 
        category, 
        severity, 
        summary, 
        published_at as "published_at", 
        created_at as "created_at"
      FROM rss_items
      ORDER BY published_at DESC
      LIMIT ${limit}
    `;
    return rows.map(r => ({
      ...r,
      latitude: (r.latitude !== null && r.latitude !== undefined) ? parseFloat(r.latitude) : null,
      longitude: (r.longitude !== null && r.longitude !== undefined) ? parseFloat(r.longitude) : null,
      summary: r.summary || null
    }));
  } catch (error) {
    console.error('getRssItems database error:', error);
    return [];
  }
}

export async function saveDataCenters(facilities) {
  if (!facilities || facilities.length === 0) return;

  if (!process.env.POSTGRES_URL) {
    const localDcs = readJsonFile(LOCAL_DATACENTERS_FILE);
    const dcMap = new Map(localDcs.map(d => [d.id, d]));

    facilities.forEach(item => {
      dcMap.set(String(item.id), {
        id: String(item.id),
        name: item.name,
        city: item.city || null,
        country: item.country || null,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        operator: item.operator || null,
        status: item.status || 'active',
        website: item.website || null,
        created_at: new Date().toISOString()
      });
    });

    writeJsonFile(LOCAL_DATACENTERS_FILE, Array.from(dcMap.values()));
    return;
  }

  try {
    const BATCH_SIZE = 25;
    for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
      const batch = facilities.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(dc => {
        return sql`
          INSERT INTO data_centers (id, name, city, country, lat, lon, operator, status, website)
          VALUES (
            ${String(dc.id)}, 
            ${dc.name}, 
            ${dc.city || null}, 
            ${dc.country || null}, 
            ${parseFloat(dc.lat)}, 
            ${parseFloat(dc.lon)}, 
            ${dc.operator || null}, 
            ${dc.status || 'active'}, 
            ${dc.website || null}
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            city = EXCLUDED.city,
            country = EXCLUDED.country,
            lat = EXCLUDED.lat,
            lon = EXCLUDED.lon,
            operator = EXCLUDED.operator,
            status = EXCLUDED.status,
            website = EXCLUDED.website;
        `;
      }));
    }
  } catch (error) {
    console.error('saveDataCenters database error:', error);
  }
}

export async function getDataCenters() {
  if (!process.env.POSTGRES_URL) {
    return readJsonFile(LOCAL_DATACENTERS_FILE);
  }

  try {
    const { rows } = await sql`
      SELECT id, name, city, country, lat, lon, operator, status, website
      FROM data_centers
      ORDER BY name ASC
    `;
    return rows.map(r => ({
      ...r,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon)
    }));
  } catch (error) {
    console.error('getDataCenters database error:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════
// CMS ADMIN HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════

export async function getUserById(userId) {
  if (!process.env.POSTGRES_URL) {
    const localUsers = readJsonFile(LOCAL_USERS_FILE);
    return localUsers.find(u => u.id === userId) || null;
  }
  try {
    const { rows } = await sql`SELECT * FROM users WHERE id = ${userId}`;
    return rows[0] || null;
  } catch (error) {
    console.error('getUserById error:', error);
    return null;
  }
}

export async function promoteUserToAdmin(email) {
  const cleanEmail = email.toLowerCase().trim();
  if (!process.env.POSTGRES_URL) {
    const localUsers = readJsonFile(LOCAL_USERS_FILE);
    const idx = localUsers.findIndex(u => u.email === cleanEmail);
    if (idx === -1) throw new Error('User not found');
    localUsers[idx].role = 'admin';
    writeJsonFile(LOCAL_USERS_FILE, localUsers);
    return localUsers[idx];
  }
  try {
    const { rows } = await sql`
      UPDATE users SET role = 'admin' WHERE email = ${cleanEmail}
      RETURNING id, email, full_name, role
    `;
    if (rows.length === 0) throw new Error('User not found');
    return rows[0];
  } catch (error) {
    console.error('promoteUserToAdmin error:', error);
    throw error;
  }
}

export async function getAllEvents(page = 1, limit = 50, search = '') {
  if (!process.env.POSTGRES_URL) {
    let events = readJsonFile(LOCAL_EVENTS_FILE);
    if (search) {
      const s = search.toLowerCase();
      events = events.filter(e => (e.title || '').toLowerCase().includes(s));
    }
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const total = events.length;
    const offset = (page - 1) * limit;
    return { events: events.slice(offset, offset + limit), total, page, limit };
  }
  try {
    const offset = (page - 1) * limit;
    let countResult, dataResult;
    if (search) {
      const searchPattern = `%${search}%`;
      countResult = await sql`SELECT count(*) as total FROM sigint_events WHERE title ILIKE ${searchPattern}`;
      dataResult = await sql`SELECT * FROM sigint_events WHERE title ILIKE ${searchPattern} ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      countResult = await sql`SELECT count(*) as total FROM sigint_events`;
      dataResult = await sql`SELECT * FROM sigint_events ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;
    }
    return {
      events: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    };
  } catch (error) {
    console.error('getAllEvents error:', error);
    return { events: [], total: 0, page, limit };
  }
}

export async function getAllRssItems(page = 1, limit = 50, search = '') {
  if (!process.env.POSTGRES_URL) {
    let items = readJsonFile(LOCAL_RSS_FILE);
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(i => (i.title || '').toLowerCase().includes(s));
    }
    items.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    const total = items.length;
    const offset = (page - 1) * limit;
    return { items: items.slice(offset, offset + limit), total, page, limit };
  }
  try {
    const offset = (page - 1) * limit;
    let countResult, dataResult;
    if (search) {
      const searchPattern = `%${search}%`;
      countResult = await sql`SELECT count(*) as total FROM rss_items WHERE title ILIKE ${searchPattern}`;
      dataResult = await sql`SELECT * FROM rss_items WHERE title ILIKE ${searchPattern} ORDER BY published_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      countResult = await sql`SELECT count(*) as total FROM rss_items`;
      dataResult = await sql`SELECT * FROM rss_items ORDER BY published_at DESC LIMIT ${limit} OFFSET ${offset}`;
    }
    return {
      items: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    };
  } catch (error) {
    console.error('getAllRssItems error:', error);
    return { items: [], total: 0, page, limit };
  }
}

export async function updateEvent(eventId, fields) {
  if (!process.env.POSTGRES_URL) {
    const events = readJsonFile(LOCAL_EVENTS_FILE);
    const idx = events.findIndex(e => e.id === eventId);
    if (idx === -1) throw new Error('Event not found');
    Object.assign(events[idx], fields);
    if (fields.summary !== undefined && events[idx].details) {
      events[idx].details.summary = fields.summary;
    }
    writeJsonFile(LOCAL_EVENTS_FILE, events);
    return events[idx];
  }
  try {
    // Build dynamic update
    const updates = [];
    if (fields.title !== undefined) updates.push(sql`title = ${fields.title}`);
    if (fields.category !== undefined) updates.push(sql`category = ${fields.category}`);
    if (fields.severity !== undefined) updates.push(sql`severity = ${parseInt(fields.severity)}`);
    if (fields.location !== undefined) updates.push(sql`location = ${fields.location}`);
    if (fields.lat !== undefined) updates.push(sql`lat = ${parseFloat(fields.lat)}`);
    if (fields.lon !== undefined) updates.push(sql`lon = ${parseFloat(fields.lon)}`);
    if (fields.url !== undefined) updates.push(sql`url = ${fields.url}`);

    // Update main fields one by one (vercel/postgres doesn't support dynamic SET clauses)
    if (fields.title !== undefined) await sql`UPDATE sigint_events SET title = ${fields.title} WHERE id = ${eventId}`;
    if (fields.category !== undefined) await sql`UPDATE sigint_events SET category = ${fields.category} WHERE id = ${eventId}`;
    if (fields.severity !== undefined) await sql`UPDATE sigint_events SET severity = ${parseInt(fields.severity)} WHERE id = ${eventId}`;
    if (fields.location !== undefined) await sql`UPDATE sigint_events SET location = ${fields.location} WHERE id = ${eventId}`;
    if (fields.lat !== undefined) await sql`UPDATE sigint_events SET lat = ${parseFloat(fields.lat)} WHERE id = ${eventId}`;
    if (fields.lon !== undefined) await sql`UPDATE sigint_events SET lon = ${parseFloat(fields.lon)} WHERE id = ${eventId}`;
    if (fields.url !== undefined) await sql`UPDATE sigint_events SET url = ${fields.url} WHERE id = ${eventId}`;
    if (fields.summary !== undefined) {
      await sql`UPDATE sigint_events SET details = jsonb_set(COALESCE(details, '{}'), '{summary}', ${JSON.stringify(fields.summary)}::jsonb) WHERE id = ${eventId}`;
    }

    const { rows } = await sql`SELECT * FROM sigint_events WHERE id = ${eventId}`;
    return rows[0] || null;
  } catch (error) {
    console.error('updateEvent error:', error);
    throw error;
  }
}

export async function updateRssItem(itemId, fields) {
  if (!process.env.POSTGRES_URL) {
    const items = readJsonFile(LOCAL_RSS_FILE);
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) throw new Error('RSS item not found');
    Object.assign(items[idx], fields);
    writeJsonFile(LOCAL_RSS_FILE, items);
    return items[idx];
  }
  try {
    if (fields.title !== undefined) await sql`UPDATE rss_items SET title = ${fields.title} WHERE id = ${itemId}`;
    if (fields.category !== undefined) await sql`UPDATE rss_items SET category = ${fields.category} WHERE id = ${itemId}`;
    if (fields.severity !== undefined) await sql`UPDATE rss_items SET severity = ${parseInt(fields.severity)} WHERE id = ${itemId}`;
    if (fields.location !== undefined) await sql`UPDATE rss_items SET location = ${fields.location} WHERE id = ${itemId}`;
    if (fields.latitude !== undefined) await sql`UPDATE rss_items SET latitude = ${parseFloat(fields.latitude)} WHERE id = ${itemId}`;
    if (fields.longitude !== undefined) await sql`UPDATE rss_items SET longitude = ${parseFloat(fields.longitude)} WHERE id = ${itemId}`;
    if (fields.source !== undefined) await sql`UPDATE rss_items SET source = ${fields.source} WHERE id = ${itemId}`;
    if (fields.summary !== undefined) await sql`UPDATE rss_items SET summary = ${fields.summary} WHERE id = ${itemId}`;

    const { rows } = await sql`SELECT * FROM rss_items WHERE id = ${itemId}`;
    return rows[0] || null;
  } catch (error) {
    console.error('updateRssItem error:', error);
    throw error;
  }
}

export async function archiveEvent(eventId, archivedBy) {
  if (!process.env.POSTGRES_URL) {
    const events = readJsonFile(LOCAL_EVENTS_FILE);
    const idx = events.findIndex(e => e.id === eventId);
    if (idx === -1) throw new Error('Event not found');
    const event = events.splice(idx, 1)[0];
    writeJsonFile(LOCAL_EVENTS_FILE, events);
    // Save to a local archive file
    const archivePath = path.resolve('archived-events-local.json');
    const archive = readJsonFile(archivePath);
    archive.push({ ...event, source_table: 'sigint_events', archived_by: archivedBy, archived_at: new Date().toISOString(), original_created_at: event.created_at });
    writeJsonFile(archivePath, archive);
    return event;
  }
  try {
    // Copy to archive
    await sql`
      INSERT INTO archived_events (id, title, category, severity, location, lat, lon, timestamp, url, details, source_table, archived_by, original_created_at)
      SELECT id, title, category, severity, location, lat, lon, timestamp, url, details, 'sigint_events', ${archivedBy}, created_at
      FROM sigint_events WHERE id = ${eventId}
    `;
    // Remove from live
    await sql`DELETE FROM sigint_events WHERE id = ${eventId}`;
    return { id: eventId, archived: true };
  } catch (error) {
    console.error('archiveEvent error:', error);
    throw error;
  }
}

export async function archiveRssItem(itemId, archivedBy) {
  if (!process.env.POSTGRES_URL) {
    const items = readJsonFile(LOCAL_RSS_FILE);
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) throw new Error('RSS item not found');
    const item = items.splice(idx, 1)[0];
    writeJsonFile(LOCAL_RSS_FILE, items);
    const archivePath = path.resolve('archived-events-local.json');
    const archive = readJsonFile(archivePath);
    archive.push({
      id: item.id, title: item.title, category: item.category, severity: item.severity,
      location: item.location, lat: item.latitude, lon: item.longitude,
      timestamp: item.published_at, url: item.url, details: { summary: item.summary, source: item.source },
      source_table: 'rss_items', archived_by: archivedBy, archived_at: new Date().toISOString(),
      original_created_at: item.created_at
    });
    writeJsonFile(archivePath, archive);
    return item;
  }
  try {
    await sql`
      INSERT INTO archived_events (id, title, category, severity, location, lat, lon, timestamp, url, details, source_table, archived_by, original_created_at)
      SELECT id, title, category, severity, location, latitude, longitude, published_at, url,
        jsonb_build_object('summary', COALESCE(summary, ''), 'source', COALESCE(source, '')),
        'rss_items', ${archivedBy}, created_at
      FROM rss_items WHERE id = ${itemId}
    `;
    await sql`DELETE FROM rss_items WHERE id = ${itemId}`;
    return { id: itemId, archived: true };
  } catch (error) {
    console.error('archiveRssItem error:', error);
    throw error;
  }
}

export async function getArchivedEvents(page = 1, limit = 50) {
  if (!process.env.POSTGRES_URL) {
    const archivePath = path.resolve('archived-events-local.json');
    const archive = readJsonFile(archivePath);
    archive.sort((a, b) => new Date(b.archived_at) - new Date(a.archived_at));
    const total = archive.length;
    const offset = (page - 1) * limit;
    return { events: archive.slice(offset, offset + limit), total, page, limit };
  }
  try {
    const offset = (page - 1) * limit;
    const countResult = await sql`SELECT count(*) as total FROM archived_events`;
    const dataResult = await sql`SELECT * FROM archived_events ORDER BY archived_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return {
      events: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    };
  } catch (error) {
    console.error('getArchivedEvents error:', error);
    return { events: [], total: 0, page, limit };
  }
}

export async function restoreArchivedEvent(archiveId) {
  if (!process.env.POSTGRES_URL) {
    const archivePath = path.resolve('archived-events-local.json');
    const archive = readJsonFile(archivePath);
    const idx = archive.findIndex(e => e.id === archiveId);
    if (idx === -1) throw new Error('Archived event not found');
    const event = archive.splice(idx, 1)[0];
    writeJsonFile(archivePath, archive);
    if (event.source_table === 'rss_items') {
      const items = readJsonFile(LOCAL_RSS_FILE);
      items.push({ id: event.id, title: event.title, category: event.category, severity: event.severity, location: event.location, latitude: event.lat, longitude: event.lon, published_at: event.timestamp, url: event.url, source: event.details?.source || 'OSINT', summary: event.details?.summary || '', created_at: event.original_created_at });
      writeJsonFile(LOCAL_RSS_FILE, items);
    } else {
      const events = readJsonFile(LOCAL_EVENTS_FILE);
      events.push({ id: event.id, title: event.title, category: event.category, severity: event.severity, location: event.location, lat: event.lat, lon: event.lon, timestamp: event.timestamp, url: event.url, details: event.details, created_at: event.original_created_at });
      writeJsonFile(LOCAL_EVENTS_FILE, events);
    }
    return event;
  }
  try {
    const { rows } = await sql`SELECT * FROM archived_events WHERE id = ${archiveId}`;
    if (rows.length === 0) throw new Error('Archived event not found');
    const event = rows[0];
    if (event.source_table === 'rss_items') {
      await sql`
        INSERT INTO rss_items (id, title, url, source, sid, location, latitude, longitude, category, severity, summary, published_at, created_at)
        VALUES (${event.id}, ${event.title}, ${event.url || ''}, ${event.details?.source || 'OSINT'}, ${event.details?.source || 'restored'},
          ${event.location}, ${event.lat}, ${event.lon}, ${event.category}, ${event.severity},
          ${event.details?.summary || ''}, ${event.timestamp}, ${event.original_created_at || new Date().toISOString()})
        ON CONFLICT (url) DO NOTHING
      `;
    } else {
      await sql`
        INSERT INTO sigint_events (id, title, category, severity, location, lat, lon, timestamp, url, details, created_at)
        VALUES (${event.id}, ${event.title}, ${event.category}, ${event.severity}, ${event.location},
          ${event.lat}, ${event.lon}, ${event.timestamp}, ${event.url}, ${JSON.stringify(event.details || {})},
          ${event.original_created_at || new Date().toISOString()})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    await sql`DELETE FROM archived_events WHERE id = ${archiveId}`;
    return { id: archiveId, restored: true };
  } catch (error) {
    console.error('restoreArchivedEvent error:', error);
    throw error;
  }
}

export async function deleteArchivedEvent(archiveId) {
  if (!process.env.POSTGRES_URL) {
    const archivePath = path.resolve('archived-events-local.json');
    const archive = readJsonFile(archivePath);
    const filtered = archive.filter(e => e.id !== archiveId);
    writeJsonFile(archivePath, filtered);
    return { id: archiveId, deleted: true };
  }
  try {
    await sql`DELETE FROM archived_events WHERE id = ${archiveId}`;
    return { id: archiveId, deleted: true };
  } catch (error) {
    console.error('deleteArchivedEvent error:', error);
    throw error;
  }
}

export async function getAllSuggestions(page = 1, limit = 50) {
  if (!process.env.POSTGRES_URL) {
    const suggestions = readJsonFile(LOCAL_SUGGESTIONS_FILE);
    suggestions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = suggestions.length;
    const offset = (page - 1) * limit;
    return { suggestions: suggestions.slice(offset, offset + limit), total, page, limit };
  }
  try {
    const offset = (page - 1) * limit;
    const countResult = await sql`SELECT count(*) as total FROM suggestions`;
    const dataResult = await sql`SELECT id, type, subject, details, target_id as "targetId", operator_email as "operatorEmail", operator_name as "operatorName", screenshot, created_at as "createdAt" FROM suggestions ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return {
      suggestions: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    };
  } catch (error) {
    console.error('getAllSuggestions error:', error);
    return { suggestions: [], total: 0, page, limit };
  }
}

export async function deleteSuggestion(suggestionId) {
  if (!process.env.POSTGRES_URL) {
    const suggestions = readJsonFile(LOCAL_SUGGESTIONS_FILE);
    const filtered = suggestions.filter(s => s.id !== suggestionId);
    writeJsonFile(LOCAL_SUGGESTIONS_FILE, filtered);
    return { id: suggestionId, deleted: true };
  }
  try {
    await sql`DELETE FROM suggestions WHERE id = ${suggestionId}`;
    return { id: suggestionId, deleted: true };
  } catch (error) {
    console.error('deleteSuggestion error:', error);
    throw error;
  }
}

