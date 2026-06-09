import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { geocodeText } from './geocoder.js';

// Path for local database files (used only in local dev environment when POSTGRES_URL is missing)
const LOCAL_USERS_FILE = path.resolve('users-local.json');
const LOCAL_EVENTS_FILE = path.resolve('events-local.json');
const LOCAL_VAULT_FILE = path.resolve('vault-local.json');
const LOCAL_PENDING_REGISTRATIONS_FILE = path.resolve('pending-registrations-local.json');
const LOCAL_SUGGESTIONS_FILE = path.resolve('suggestions-local.json');
const LOCAL_RSS_FILE = path.resolve('rss-local.json');
const LOCAL_DATACENTERS_FILE = path.resolve('datacenters-local.json');
const LOCAL_AI_REGULATIONS_FILE = path.resolve('ai-regulations-local.json');
const LOCAL_LOGS_FILE = path.resolve('logs-local.json');
const LOCAL_ACTIVE_USERS_FILE = path.resolve('active-users-local.json');
const LOCAL_PURGED_EVENTS_FILE = path.resolve('purged-events-local.json');

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

export function getNormalizedTitle(title) {
  return (title || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 45);
}

export function getNormalizedUrl(url) {
  if (!url) return '';
  return url.toLowerCase().split('?')[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
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

let dbInitPromise = null;

export async function initDb() {
  if (!process.env.POSTGRES_URL) {
    console.warn('Database environment variable POSTGRES_URL is missing. Using local JSON files for persistent state.');
    // Ensure files exist
    if (!fs.existsSync(LOCAL_USERS_FILE)) {
      writeJsonFile(LOCAL_USERS_FILE, []);
    } else {
      // Migrate existing local users to have is_verified, verification_token, and verification_expires_at
      const localUsers = readJsonFile(LOCAL_USERS_FILE);
      let updated = false;
      localUsers.forEach(u => {
        if (u.is_verified === undefined) {
          u.is_verified = true; // Pre-existing accounts are marked verified
          u.verification_token = null;
          u.verification_expires_at = null;
          updated = true;
        }
        if (u.email === 'workwithavip@gmail.com' && u.role !== 'admin') {
          u.role = 'admin';
          updated = true;
        }
      });
      if (updated) writeJsonFile(LOCAL_USERS_FILE, localUsers);
    }
    if (!fs.existsSync(LOCAL_EVENTS_FILE)) {
      writeJsonFile(LOCAL_EVENTS_FILE, []);
    } else {
      const localEvents = readJsonFile(LOCAL_EVENTS_FILE);
      let updated = false;
      localEvents.forEach(e => {
        if (e.edited === undefined) {
          e.edited = false;
          updated = true;
        }
        if (e.status === undefined) {
          e.status = 'published';
          updated = true;
        }
      });
      if (updated) writeJsonFile(LOCAL_EVENTS_FILE, localEvents);
    }
    if (!fs.existsSync(LOCAL_VAULT_FILE)) writeJsonFile(LOCAL_VAULT_FILE, []);
    if (!fs.existsSync(LOCAL_PENDING_REGISTRATIONS_FILE)) writeJsonFile(LOCAL_PENDING_REGISTRATIONS_FILE, []);
    if (!fs.existsSync(LOCAL_SUGGESTIONS_FILE)) writeJsonFile(LOCAL_SUGGESTIONS_FILE, []);
    if (!fs.existsSync(LOCAL_RSS_FILE)) {
      writeJsonFile(LOCAL_RSS_FILE, []);
    } else {
      const localRss = readJsonFile(LOCAL_RSS_FILE);
      let updated = false;
      localRss.forEach(item => {
        if (item.edited === undefined) {
          item.edited = false;
          updated = true;
        }
      });
      if (updated) writeJsonFile(LOCAL_RSS_FILE, localRss);
    }
    if (!fs.existsSync(LOCAL_DATACENTERS_FILE)) writeJsonFile(LOCAL_DATACENTERS_FILE, []);
    if (!fs.existsSync(LOCAL_AI_REGULATIONS_FILE)) writeJsonFile(LOCAL_AI_REGULATIONS_FILE, []);
    if (!fs.existsSync(LOCAL_LOGS_FILE)) writeJsonFile(LOCAL_LOGS_FILE, []);
    if (!fs.existsSync(LOCAL_ACTIVE_USERS_FILE)) writeJsonFile(LOCAL_ACTIVE_USERS_FILE, []);
    if (!fs.existsSync(LOCAL_PURGED_EVENTS_FILE)) writeJsonFile(LOCAL_PURGED_EVENTS_FILE, []);
    return;
  }

  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
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
        edited BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'published',
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
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token TEXT,
        verification_expires_at TIMESTAMP WITH TIME ZONE,
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
        edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`;

      // Migrations wrapping inside try/catch so they don't break subsequent setups
      try {
        await sql`ALTER TABLE sigint_events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published'`;
      } catch (e) { console.warn('Migration warning (sigint_events.status):', e.message); }
      try {
        await sql`ALTER TABLE sigint_events ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT FALSE`;
      } catch (e) { console.warn('Migration warning (sigint_events.edited):', e.message); }
      try {
        await sql`ALTER TABLE rss_items ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT FALSE`;
      } catch (e) { console.warn('Migration warning (rss_items.edited):', e.message); }
      try {
        await sql`ALTER TABLE archived_events ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT FALSE`;
      } catch (e) { console.warn('Migration warning (archived_events.edited):', e.message); }
      
      // Verification system migrations
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`;
      } catch (e) { console.warn('Migration warning (users.is_verified):', e.message); }
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`;
      } catch (e) { console.warn('Migration warning (users.verification_token):', e.message); }
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE`;
      } catch (e) { console.warn('Migration warning (users.verification_expires_at):', e.message); }
      try {
        await sql`UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL OR email = 'workwithavip@gmail.com'`;
      } catch (e) { console.warn('Migration warning (users auto-verify):', e.message); }
      try {
        await sql`UPDATE users SET role = 'admin' WHERE email = 'workwithavip@gmail.com'`;
      } catch (e) { console.warn('Migration warning (users auto-promote admin):', e.message); }

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

      await sql`CREATE TABLE IF NOT EXISTS ai_regulations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        jurisdiction TEXT,
        status TEXT,
        area TEXT,
        date TEXT,
        description TEXT,
        lat FLOAT,
        lon FLOAT,
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
        original_created_at TIMESTAMP WITH TIME ZONE,
        edited BOOLEAN DEFAULT FALSE
      )`;

      await sql`CREATE INDEX IF NOT EXISTS idx_datacenters_geo ON data_centers (lat, lon)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_regulations_geo ON ai_regulations (lat, lon)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_sigint_timestamp ON sigint_events (timestamp DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_vault_modified ON vault_docs (last_modified DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_pending_email ON pending_registrations (email)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_suggestions_created ON suggestions (created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_rss_published ON rss_items (published_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_archived_at ON archived_events (archived_at DESC)`;

      await sql`CREATE TABLE IF NOT EXISTS access_logs (
        id TEXT PRIMARY KEY,
        user_email TEXT,
        user_name TEXT,
        ip_address TEXT,
        location TEXT,
        user_agent TEXT,
        accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`;

      await sql`CREATE TABLE IF NOT EXISTS active_users (
        email TEXT PRIMARY KEY,
        name TEXT,
        ip_address TEXT,
        location TEXT,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`;

      await sql`CREATE TABLE IF NOT EXISTS purged_events (
        id TEXT PRIMARY KEY,
        title TEXT,
        url TEXT,
        purged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`;
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      dbInitPromise = null;
      throw error;
    }
  })();
  return dbInitPromise;
}

export async function saveEvents(events) {
  await initDb();
  if (!events || events.length === 0) return;
  const archivedIds = await getArchivedIds();
  const sanitized = events
    .map(e => sanitizeEventTimestamp(e))
    .filter(e => {
      // Block by ID
      if (archivedIds.has(e.id)) return false;
      // Block by normalized URL (catches GDELT re-fetches of same article with new hash ID)
      if (e.url) {
        const normUrl = getNormalizedUrl(e.url);
        if (normUrl && archivedIds.has(normUrl)) return false;
      }
      return true;
    });
  if (sanitized.length === 0) return;
  
  if (!process.env.POSTGRES_URL) {
    const localEvents = readJsonFile(LOCAL_EVENTS_FILE);
    const eventMap = new Map(localEvents.map(e => [e.id, e]));
    
    // Find all edited events in localEvents to match against incoming items
    const editedEvents = localEvents.filter(e => e.edited === true || e.edited === 'true');
    
    sanitized.forEach(e => {
      const existing = eventMap.get(e.id) || {};
      let isEdited = existing.edited === true || existing.edited === 'true';
      
      if (!isEdited) {
        const normTitle = getNormalizedTitle(e.title);
        const normUrl = getNormalizedUrl(e.url);
        const matched = editedEvents.find(ev => {
          const matchTitle = getNormalizedTitle(ev.title) === normTitle;
          const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
          return matchTitle || matchUrl;
        });
        if (matched) {
          isEdited = true;
          existing.location = matched.location;
          existing.lat = matched.lat;
          existing.lon = matched.lon;
          existing.category = matched.category;
          existing.severity = matched.severity;
          existing.details = { ...(existing.details || {}), ...(matched.details || {}) };
        }
      }
      
      eventMap.set(e.id, {
        ...existing,
        ...e,
        title: isEdited ? (existing.title || e.title) : e.title,
        category: isEdited ? (existing.category || e.category) : e.category,
        severity: isEdited ? (existing.severity || e.severity) : e.severity,
        location: isEdited ? (existing.location || 'Global') : (e.location || 'Global'),
        lat: isEdited ? existing.lat : e.lat,
        lon: isEdited ? existing.lon : e.lon,
        timestamp: isEdited ? existing.timestamp : e.timestamp,
        url: isEdited ? existing.url : e.url,
        edited: isEdited,
        details: isEdited 
          ? { ...(e.details || {}), ...(existing.details || {}) } 
          : { ...(existing.details || {}), ...(e.details || {}) },
        created_at: existing.created_at || new Date().toISOString()
      });
    });
    
    writeJsonFile(LOCAL_EVENTS_FILE, Array.from(eventMap.values()));
    return;
  }
  
  try {
    // 1. Fetch currently edited events to perform ingest-level self-healing
    const { rows: editedEvents } = await sql`
      SELECT title, url, location, lat, lon, category, severity, details, edited 
      FROM sigint_events 
      WHERE edited = TRUE
    `;
    
    // 2. Heal incoming GDELT/Tactical events if they represent duplicates of manually edited stories
    sanitized.forEach(event => {
      const normTitle = getNormalizedTitle(event.title);
      const normUrl = getNormalizedUrl(event.url);
      
      const matchedEdited = editedEvents.find(ev => {
        const matchTitle = getNormalizedTitle(ev.title) === normTitle;
        const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
        return matchTitle || matchUrl;
      });
      
      if (matchedEdited) {
        event.location = matchedEdited.location;
        event.lat = matchedEdited.lat;
        event.lon = matchedEdited.lon;
        event.category = matchedEdited.category;
        event.severity = matchedEdited.severity;
        event.edited = true;
        event.details = { ...(event.details || {}), ...(matchedEdited.details || {}) };
      }
    });

    const BATCH_SIZE = 25;
    for (let i = 0; i < sanitized.length; i += BATCH_SIZE) {
      const batch = sanitized.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(event => 
        sql`
          INSERT INTO sigint_events (id, title, category, severity, location, lat, lon, timestamp, url, details, edited)
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
            ${JSON.stringify(event.details || {})},
            ${event.edited || false}
          )
          ON CONFLICT (id) DO UPDATE SET
            title = CASE WHEN sigint_events.edited = TRUE THEN sigint_events.title ELSE EXCLUDED.title END,
            category = CASE WHEN sigint_events.edited = TRUE THEN sigint_events.category ELSE EXCLUDED.category END,
            severity = CASE WHEN sigint_events.edited = TRUE THEN sigint_events.severity ELSE EXCLUDED.severity END,
            location = CASE WHEN sigint_events.edited = TRUE THEN sigint_events.location ELSE EXCLUDED.location END,
            lat = CASE WHEN sigint_events.edited = TRUE THEN sigint_events.lat ELSE EXCLUDED.lat END,
            lon = CASE WHEN sigint_events.edited = TRUE THEN sigint_events.lon ELSE EXCLUDED.lon END,
            timestamp = CASE WHEN sigint_events.edited = TRUE THEN sigint_events.timestamp ELSE EXCLUDED.timestamp END,
            url = CASE WHEN sigint_events.edited = TRUE THEN sigint_events.url ELSE EXCLUDED.url END,
            edited = CASE WHEN sigint_events.edited = TRUE THEN sigint_events.edited ELSE EXCLUDED.edited END,
            details = CASE WHEN sigint_events.edited = TRUE THEN COALESCE(EXCLUDED.details, '{}'::jsonb) || COALESCE(sigint_events.details, '{}'::jsonb) ELSE EXCLUDED.details END;
        `
      ));
    }
  } catch (error) {
    console.error('Database save error:', error);
  }
}

export async function getEvents(timespan = '24h') {
  await initDb();
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
    // Sort local events by timestamp descending, filtering out drafts for public dashboard
    return sanitizedLocal
      .filter(e => e.status !== 'draft')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 500);
  }
  try {
    let interval = '24 hours';
    if (timespan === '6h') interval = '6 hours';
    let rows = [];
    if (timespan === 'today') {
      const res = await sql`SELECT * FROM sigint_events WHERE (edited = TRUE OR (timestamp >= CURRENT_DATE - INTERVAL '7 days')) AND status != 'draft' ORDER BY timestamp DESC`;
      rows = res.rows;
    } else {
      const res = await sql`SELECT * FROM sigint_events WHERE (edited = TRUE OR (timestamp >= NOW() - CAST(${interval} AS INTERVAL) - INTERVAL '7 days')) AND status != 'draft' ORDER BY timestamp DESC LIMIT 500`;
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
  await initDb();
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

export async function createUser(email, passwordHash, fullName, role = 'analyst', isVerified = false, verificationToken = null, verificationExpiresAt = null) {
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
      is_verified: isVerified,
      verification_token: verificationToken,
      verification_expires_at: verificationExpiresAt ? verificationExpiresAt.toISOString() : null,
      created_at: new Date().toISOString()
    };
    localUsers.push(newUser);
    writeJsonFile(LOCAL_USERS_FILE, localUsers);
    return newUser;
  }
  
  try {
    const userId = crypto.randomUUID();
    const { rows } = await sql`
      INSERT INTO users (id, email, password_hash, full_name, role, is_verified, verification_token, verification_expires_at)
      VALUES (${userId}, ${email.toLowerCase().trim()}, ${passwordHash}, ${fullName.trim()}, ${role}, ${isVerified}, ${verificationToken}, ${verificationExpiresAt})
      RETURNING id, email, full_name, role, is_verified, created_at
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

export async function updateUnverifiedUser(userId, { passwordHash, fullName, role, verificationToken, verificationExpiresAt }) {
  if (!process.env.POSTGRES_URL) {
    const localUsers = readJsonFile(LOCAL_USERS_FILE);
    const index = localUsers.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    
    localUsers[index].password_hash = passwordHash;
    localUsers[index].full_name = fullName.trim();
    localUsers[index].role = role;
    localUsers[index].verification_token = verificationToken;
    localUsers[index].verification_expires_at = verificationExpiresAt ? verificationExpiresAt.toISOString() : null;
    
    writeJsonFile(LOCAL_USERS_FILE, localUsers);
    return localUsers[index];
  }
  
  try {
    await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, 
          full_name = ${fullName.trim()}, 
          role = ${role}, 
          verification_token = ${verificationToken}, 
          verification_expires_at = ${verificationExpiresAt}
      WHERE id = ${userId}
    `;
    const { rows } = await sql`SELECT * FROM users WHERE id = ${userId}`;
    return rows[0];
  } catch (error) {
    console.error('updateUnverifiedUser error:', error);
    throw error;
  }
}

export async function verifyUser(userId) {
  if (!process.env.POSTGRES_URL) {
    const localUsers = readJsonFile(LOCAL_USERS_FILE);
    const index = localUsers.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    localUsers[index].is_verified = true;
    localUsers[index].verification_token = null;
    localUsers[index].verification_expires_at = null;
    writeJsonFile(LOCAL_USERS_FILE, localUsers);
    return localUsers[index];
  }
  
  try {
    const { rows } = await sql`
      UPDATE users 
      SET is_verified = TRUE, 
          verification_token = NULL, 
          verification_expires_at = NULL 
      WHERE id = ${userId}
      RETURNING id, email, full_name, role, is_verified, created_at
    `;
    return rows[0];
  } catch (error) {
    console.error('verifyUser error:', error);
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
  const archivedIds = await getArchivedIds();
  const filtered = items.filter(item => {
    const id = item.id || crypto.createHash('md5').update(item.url).digest('hex');
    if (archivedIds.has(id)) return false;
    if (item.url) {
      const normUrl = getNormalizedUrl(item.url);
      if (normUrl && archivedIds.has(normUrl)) return false;
    }
    return true;
  });
  if (filtered.length === 0) return;
  
  if (!process.env.POSTGRES_URL) {
    const localRss = readJsonFile(LOCAL_RSS_FILE);
    const rssMap = new Map(localRss.map(i => [i.url, i]));
    
    // Find all edited references in local database files
    const localEvents = readJsonFile(LOCAL_EVENTS_FILE);
    const editedRss = localRss.filter(i => i.edited === true || i.edited === 'true');
    const editedEvents = localEvents.filter(e => e.edited === true || e.edited === 'true').map(e => ({
      ...e,
      latitude: e.lat,
      longitude: e.lon
    }));
    const editedRefs = [...editedEvents, ...editedRss];
    
    filtered.forEach(item => {
      // Perform ingest-level self-healing
      const normTitle = getNormalizedTitle(item.title);
      const normUrl = getNormalizedUrl(item.url);
      
      const matched = editedRefs.find(ev => {
        const matchTitle = getNormalizedTitle(ev.title) === normTitle;
        const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
        return matchTitle || matchUrl;
      });
      
      if (matched) {
        item.location = matched.location;
        item.latitude = matched.latitude;
        item.longitude = matched.longitude;
        item.category = matched.category;
        item.severity = matched.severity;
        item.edited = true;
      }
      
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
          created_at: new Date().toISOString(),
          edited: item.edited || false
        });
      } else {
        const isEdited = existing.edited === true || existing.edited === 'true' || item.edited === true;
        // Backfill missing fields for existing feeds, preserving manual changes if edited
        existing.title = isEdited ? existing.title : (item.title || existing.title);
        existing.location = isEdited ? (existing.edited ? existing.location : item.location) : (item.location || existing.location);
        existing.latitude = isEdited ? (existing.edited ? existing.latitude : item.latitude) : (item.latitude !== undefined && item.latitude !== null ? item.latitude : existing.latitude);
        existing.longitude = isEdited ? (existing.edited ? existing.longitude : item.longitude) : (item.longitude !== undefined && item.longitude !== null ? item.longitude : existing.longitude);
        existing.category = isEdited ? existing.category : (item.category || existing.category);
        existing.severity = isEdited ? existing.severity : (item.severity || existing.severity);
        existing.summary = isEdited ? existing.summary : (item.summary || existing.summary);
        existing.edited = isEdited;
        rssMap.set(item.url, existing);
      }
    });
    
    writeJsonFile(LOCAL_RSS_FILE, Array.from(rssMap.values()));
    return;
  }
  
  try {
    // 1. Fetch currently edited events and RSS items to perform ingest-level self-healing
    const { rows: editedEvents } = await sql`
      SELECT title, url, location, lat as latitude, lon as longitude, category, severity 
      FROM sigint_events 
      WHERE edited = TRUE
    `;
    const { rows: editedRss } = await sql`
      SELECT title, url, location, latitude, longitude, category, severity 
      FROM rss_items 
      WHERE edited = TRUE
    `;
    const editedRefs = [...editedEvents, ...editedRss];

    // 2. Heal incoming RSS items before insertion/update
    filtered.forEach(item => {
      const normTitle = getNormalizedTitle(item.title);
      const normUrl = getNormalizedUrl(item.url);
      
      const matched = editedRefs.find(ev => {
        const matchTitle = getNormalizedTitle(ev.title) === normTitle;
        const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
        return matchTitle || matchUrl;
      });
      
      if (matched) {
        item.location = matched.location;
        item.latitude = matched.latitude;
        item.longitude = matched.longitude;
        item.category = matched.category;
        item.severity = matched.severity;
        item.edited = true;
      }
    });

    const BATCH_SIZE = 25;
    for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
      const batch = filtered.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(item => {
        const id = item.id || crypto.createHash('md5').update(item.url).digest('hex');
        const latVal = (item.latitude !== undefined && item.latitude !== null) ? parseFloat(item.latitude) : null;
        const lonVal = (item.longitude !== undefined && item.longitude !== null) ? parseFloat(item.longitude) : null;
        
        return sql`
          INSERT INTO rss_items (id, title, url, source, sid, location, latitude, longitude, category, severity, summary, published_at, edited)
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
            ${item.published_at},
            ${item.edited || false}
          )
          ON CONFLICT (url) DO UPDATE SET
            title = CASE WHEN rss_items.edited = TRUE THEN rss_items.title ELSE EXCLUDED.title END,
            location = CASE WHEN rss_items.edited = TRUE THEN rss_items.location ELSE EXCLUDED.location END,
            latitude = CASE WHEN rss_items.edited = TRUE THEN rss_items.latitude ELSE EXCLUDED.latitude END,
            longitude = CASE WHEN rss_items.edited = TRUE THEN rss_items.longitude ELSE EXCLUDED.longitude END,
            category = CASE WHEN rss_items.edited = TRUE THEN rss_items.category ELSE EXCLUDED.category END,
            severity = CASE WHEN rss_items.edited = TRUE THEN rss_items.severity ELSE EXCLUDED.severity END,
            summary = CASE WHEN rss_items.edited = TRUE THEN rss_items.summary ELSE EXCLUDED.summary END,
            edited = CASE WHEN rss_items.edited = TRUE THEN rss_items.edited ELSE EXCLUDED.edited END;
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
        created_at as "created_at",
        edited
      FROM rss_items
      WHERE edited = TRUE OR id IN (
        SELECT id FROM rss_items ORDER BY published_at DESC LIMIT ${limit}
      )
      ORDER BY published_at DESC
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

export async function saveAiRegulations(regulations) {
  if (!regulations || regulations.length === 0) return;

  if (!process.env.POSTGRES_URL) {
    const localRegs = readJsonFile(LOCAL_AI_REGULATIONS_FILE);
    const regMap = new Map(localRegs.map(r => [r.id, r]));

    regulations.forEach(item => {
      regMap.set(String(item.id), {
        id: String(item.id),
        title: item.title,
        jurisdiction: item.jurisdiction || null,
        status: item.status || null,
        area: item.area || null,
        date: item.date || null,
        description: item.description || null,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        created_at: new Date().toISOString()
      });
    });

    writeJsonFile(LOCAL_AI_REGULATIONS_FILE, Array.from(regMap.values()));
    return;
  }

  try {
    const BATCH_SIZE = 25;
    for (let i = 0; i < regulations.length; i += BATCH_SIZE) {
      const batch = regulations.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(reg => {
        return sql`
          INSERT INTO ai_regulations (id, title, jurisdiction, status, area, date, description, lat, lon)
          VALUES (
            ${String(reg.id)}, 
            ${reg.title}, 
            ${reg.jurisdiction || null}, 
            ${reg.status || null}, 
            ${reg.area || null}, 
            ${reg.date || null}, 
            ${reg.description || null}, 
            ${parseFloat(reg.lat)}, 
            ${parseFloat(reg.lon)}
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            jurisdiction = EXCLUDED.jurisdiction,
            status = EXCLUDED.status,
            area = EXCLUDED.area,
            date = EXCLUDED.date,
            description = EXCLUDED.description,
            lat = EXCLUDED.lat,
            lon = EXCLUDED.lon;
        `;
      }));
    }
  } catch (error) {
    console.error('saveAiRegulations database error:', error);
  }
}

export async function getAiRegulations() {
  if (!process.env.POSTGRES_URL) {
    return readJsonFile(LOCAL_AI_REGULATIONS_FILE);
  }

  try {
    const { rows } = await sql`
      SELECT id, title, jurisdiction, status, area, date, description, lat, lon
      FROM ai_regulations
      ORDER BY title ASC
    `;
    return rows.map(r => ({
      ...r,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon)
    }));
  } catch (error) {
    console.error('getAiRegulations database error:', error);
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
  await initDb();
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
  await initDb();
  const cleanEventId = String(eventId).replace(/^db-/, '').replace(/^rss-/, '');
  
  const latVal = parseFloat(fields.lat);
  const lonVal = parseFloat(fields.lon);
  const latIsInvalid = fields.lat === undefined || fields.lat === null || fields.lat === '' || isNaN(latVal);
  const lonIsInvalid = fields.lon === undefined || fields.lon === null || fields.lon === '' || isNaN(lonVal);
  
  if (fields.location && (latIsInvalid || lonIsInvalid)) {
    try {
      const coords = geocodeText(fields.location, '');
      fields.lat = coords.lat;
      fields.lon = coords.lon;
    } catch (e) {
      console.error('Failed to geocode location in updateEvent:', e);
    }
  }

  if (!process.env.POSTGRES_URL) {
    const events = readJsonFile(LOCAL_EVENTS_FILE);
    let idx = events.findIndex(e => e.id === cleanEventId);
    let updatedEvent;
    if (idx === -1) {
      updatedEvent = {
        id: cleanEventId,
        title: fields.title || 'Untitled Signal',
        category: fields.category || 'Political',
        severity: parseInt(fields.severity) || 1,
        location: fields.location || 'Global',
        lat: parseFloat(fields.lat) || 0.0,
        lon: parseFloat(fields.lon) || 0.0,
        timestamp: fields.timestamp || new Date().toISOString(),
        url: fields.url || '',
        details: { summary: fields.summary || '' },
        status: fields.status || 'published',
        edited: true,
        created_at: new Date().toISOString()
      };
      events.push(updatedEvent);
    } else {
      Object.assign(events[idx], fields, { edited: true });
      if (fields.summary !== undefined) {
        if (!events[idx].details) events[idx].details = {};
        events[idx].details.summary = fields.summary;
      }
      updatedEvent = events[idx];
    }
    writeJsonFile(LOCAL_EVENTS_FILE, events);

    // Propagate changes to LOCAL_EVENTS_FILE duplicates in JSON fallback mode
    try {
      const normTitle = getNormalizedTitle(updatedEvent.title);
      const normUrl = getNormalizedUrl(updatedEvent.url);
      const eventsList = readJsonFile(LOCAL_EVENTS_FILE);
      let evChanged = false;
      for (const ev of eventsList) {
        if (ev.id === updatedEvent.id) continue;
        const matchTitle = getNormalizedTitle(ev.title) === normTitle;
        const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
        if (matchTitle || matchUrl) {
          ev.lat = parseFloat(fields.lat) || ev.lat;
          ev.lon = parseFloat(fields.lon) || ev.lon;
          ev.location = fields.location || ev.location;
          ev.category = fields.category || ev.category;
          ev.severity = parseInt(fields.severity) || ev.severity;
          ev.edited = true;
          if (fields.summary !== undefined) {
            if (!ev.details) ev.details = {};
            ev.details.summary = fields.summary;
          }
          evChanged = true;
        }
      }
      if (evChanged) {
        writeJsonFile(LOCAL_EVENTS_FILE, eventsList);
      }
    } catch (err) {
      console.error('Error propagating local event update duplicates:', err);
    }

    // Propagate changes to LOCAL_RSS_FILE in JSON fallback mode
    try {
      const normTitle = getNormalizedTitle(updatedEvent.title);
      const normUrl = getNormalizedUrl(updatedEvent.url);
      const rssItems = readJsonFile(LOCAL_RSS_FILE);
      let rssChanged = false;
      for (const item of rssItems) {
        const matchTitle = getNormalizedTitle(item.title) === normTitle;
        const matchUrl = normUrl && getNormalizedUrl(item.url) === normUrl;
        if (matchTitle || matchUrl) {
          item.latitude = parseFloat(fields.lat) || item.latitude;
          item.longitude = parseFloat(fields.lon) || item.longitude;
          item.location = fields.location || item.location;
          item.category = fields.category || item.category;
          item.severity = parseInt(fields.severity) || item.severity;
          item.edited = true;
          if (fields.summary !== undefined) {
            item.summary = fields.summary;
          }
          rssChanged = true;
        }
      }
      if (rssChanged) {
        writeJsonFile(LOCAL_RSS_FILE, rssItems);
      }
    } catch (err) {
      console.error('Error propagating local events update to RSS:', err);
    }

    return updatedEvent;
  }

  try {
    const checkRes = await sql`SELECT id FROM sigint_events WHERE id = ${cleanEventId}`;
    if (checkRes.rows.length === 0) {
      const title = fields.title || 'Untitled Signal';
      const category = fields.category || 'Political';
      const severity = parseInt(fields.severity) || 1;
      const location = fields.location || 'Global';
      const lat = parseFloat(fields.lat) || 0.0;
      const lon = parseFloat(fields.lon) || 0.0;
      const url = fields.url || '';
      const timestamp = fields.timestamp || new Date().toISOString();
      const details = { summary: fields.summary || '' };
      const status = fields.status || 'published';

      await sql`
        INSERT INTO sigint_events (id, title, category, severity, location, lat, lon, timestamp, url, details, edited, status)
        VALUES (${cleanEventId}, ${title}, ${category}, ${severity}, ${location}, ${lat}, ${lon}, ${timestamp}, ${url}, ${JSON.stringify(details)}, TRUE, ${status})
      `;
    } else {
      if (fields.title !== undefined) await sql`UPDATE sigint_events SET title = ${fields.title} WHERE id = ${cleanEventId}`;
      if (fields.category !== undefined) await sql`UPDATE sigint_events SET category = ${fields.category} WHERE id = ${cleanEventId}`;
      if (fields.severity !== undefined) await sql`UPDATE sigint_events SET severity = ${parseInt(fields.severity)} WHERE id = ${cleanEventId}`;
      if (fields.location !== undefined) await sql`UPDATE sigint_events SET location = ${fields.location} WHERE id = ${cleanEventId}`;
      if (fields.lat !== undefined) await sql`UPDATE sigint_events SET lat = ${parseFloat(fields.lat)} WHERE id = ${cleanEventId}`;
      if (fields.lon !== undefined) await sql`UPDATE sigint_events SET lon = ${parseFloat(fields.lon)} WHERE id = ${cleanEventId}`;
      if (fields.url !== undefined) await sql`UPDATE sigint_events SET url = ${fields.url} WHERE id = ${cleanEventId}`;
      if (fields.status !== undefined) await sql`UPDATE sigint_events SET status = ${fields.status} WHERE id = ${cleanEventId}`;
      if (fields.summary !== undefined) {
        await sql`UPDATE sigint_events SET details = jsonb_set(COALESCE(details, '{}'), '{summary}', ${JSON.stringify(fields.summary)}::jsonb) WHERE id = ${cleanEventId}`;
      }
      await sql`UPDATE sigint_events SET edited = TRUE WHERE id = ${cleanEventId}`;
    }

    const { rows } = await sql`SELECT * FROM sigint_events WHERE id = ${cleanEventId}`;
    const updatedEvent = rows[0] || null;

    // Propagate changes to duplicates in sigint_events and rss_items in Postgres mode
    if (updatedEvent) {
      try {
        const normTitle = getNormalizedTitle(updatedEvent.title);
        const normUrl = getNormalizedUrl(updatedEvent.url);
        
        // 1. Propagate within sigint_events
        const sigRes = await sql`SELECT id, title, url FROM sigint_events`;
        for (const ev of sigRes.rows) {
          if (ev.id === updatedEvent.id) continue;
          const matchTitle = getNormalizedTitle(ev.title) === normTitle;
          const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
          if (matchTitle || matchUrl) {
            const latVal = (fields.lat !== undefined && fields.lat !== null && !isNaN(parseFloat(fields.lat))) ? parseFloat(fields.lat) : ev.lat;
            const lonVal = (fields.lon !== undefined && fields.lon !== null && !isNaN(parseFloat(fields.lon))) ? parseFloat(fields.lon) : ev.lon;
            await sql`
              UPDATE sigint_events 
              SET lat = ${latVal}, lon = ${lonVal}, location = ${fields.location || ev.location},
                  category = ${fields.category || ev.category}, severity = ${parseInt(fields.severity) || ev.severity},
                  edited = TRUE
              WHERE id = ${ev.id}
            `;
            if (fields.summary !== undefined) {
              await sql`UPDATE sigint_events SET details = jsonb_set(COALESCE(details, '{}'), '{summary}', ${JSON.stringify(fields.summary)}::jsonb) WHERE id = ${ev.id}`;
            }
          }
        }

        // 2. Propagate to rss_items
        const rssRes = await sql`SELECT id, title, url FROM rss_items`;
        for (const item of rssRes.rows) {
          const matchTitle = getNormalizedTitle(item.title) === normTitle;
          const matchUrl = normUrl && getNormalizedUrl(item.url) === normUrl;
          if (matchTitle || matchUrl) {
            const latVal = (fields.lat !== undefined && fields.lat !== null && !isNaN(parseFloat(fields.lat))) ? parseFloat(fields.lat) : item.latitude;
            const lonVal = (fields.lon !== undefined && fields.lon !== null && !isNaN(parseFloat(fields.lon))) ? parseFloat(fields.lon) : item.longitude;
            await sql`
              UPDATE rss_items 
              SET latitude = ${latVal}, longitude = ${lonVal}, location = ${fields.location || item.location}, 
                  category = ${fields.category || item.category}, severity = ${parseInt(fields.severity) || item.severity},
                  edited = TRUE
              WHERE id = ${item.id}
            `;
            if (fields.summary !== undefined) {
              await sql`UPDATE rss_items SET summary = ${fields.summary} WHERE id = ${item.id}`;
            }
          }
        }
      } catch (err) {
        console.error('Error propagating Postgres event update:', err);
      }
    }

    return updatedEvent;
  } catch (error) {
    console.error('updateEvent error:', error);
    throw error;
  }
}

export async function updateRssItem(itemId, fields) {
  const cleanItemId = String(itemId).replace(/^db-/, '').replace(/^rss-/, '');
  
  const latVal = parseFloat(fields.latitude);
  const lonVal = parseFloat(fields.longitude);
  const latIsInvalid = fields.latitude === undefined || fields.latitude === null || fields.latitude === '' || isNaN(latVal);
  const lonIsInvalid = fields.longitude === undefined || fields.longitude === null || fields.longitude === '' || isNaN(lonVal);
  
  if (fields.location && (latIsInvalid || lonIsInvalid)) {
    try {
      const coords = geocodeText(fields.location, '');
      fields.latitude = coords.lat;
      fields.longitude = coords.lon;
    } catch (e) {
      console.error('Failed to geocode location in updateRssItem:', e);
    }
  }

  if (!process.env.POSTGRES_URL) {
    const items = readJsonFile(LOCAL_RSS_FILE);
    let idx = items.findIndex(i => i.id === cleanItemId);
    let updatedItem;
    if (idx === -1) {
      updatedItem = {
        id: cleanItemId,
        title: fields.title || 'Untitled RSS Item',
        category: fields.category || 'Political',
        severity: parseInt(fields.severity) || 1,
        location: fields.location || 'Global',
        latitude: fields.latitude !== undefined ? parseFloat(fields.latitude) : 0.0,
        longitude: fields.longitude !== undefined ? parseFloat(fields.longitude) : 0.0,
        url: fields.url || '',
        source: fields.source || 'OSINT',
        sid: fields.sid || 'restored',
        summary: fields.summary || '',
        published_at: new Date().toISOString(),
        edited: true,
        created_at: new Date().toISOString()
      };
      items.push(updatedItem);
    } else {
      Object.assign(items[idx], fields, { edited: true });
      updatedItem = items[idx];
    }
    writeJsonFile(LOCAL_RSS_FILE, items);

    // Propagate changes to LOCAL_RSS_FILE duplicates in JSON fallback mode
    try {
      const normTitle = getNormalizedTitle(updatedItem.title);
      const normUrl = getNormalizedUrl(updatedItem.url);
      const rssList = readJsonFile(LOCAL_RSS_FILE);
      let rssChanged = false;
      for (const item of rssList) {
        if (item.id === updatedItem.id) continue;
        const matchTitle = getNormalizedTitle(item.title) === normTitle;
        const matchUrl = normUrl && getNormalizedUrl(item.url) === normUrl;
        if (matchTitle || matchUrl) {
          item.latitude = fields.latitude !== undefined ? parseFloat(fields.latitude) : item.latitude;
          item.longitude = fields.longitude !== undefined ? parseFloat(fields.longitude) : item.longitude;
          item.location = fields.location || item.location;
          item.category = fields.category || item.category;
          item.severity = parseInt(fields.severity) || item.severity;
          item.edited = true;
          if (fields.summary !== undefined) {
            item.summary = fields.summary;
          }
          rssChanged = true;
        }
      }
      if (rssChanged) {
        writeJsonFile(LOCAL_RSS_FILE, rssList);
      }
    } catch (err) {
      console.error('Error propagating local RSS update duplicates:', err);
    }

    // Propagate changes to LOCAL_EVENTS_FILE in JSON fallback mode
    try {
      const normTitle = getNormalizedTitle(updatedItem.title);
      const normUrl = getNormalizedUrl(updatedItem.url);
      const events = readJsonFile(LOCAL_EVENTS_FILE);
      let evChanged = false;
      for (const ev of events) {
        const matchTitle = getNormalizedTitle(ev.title) === normTitle;
        const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
        if (matchTitle || matchUrl) {
          ev.lat = parseFloat(fields.latitude) !== undefined ? parseFloat(fields.latitude) : ev.lat;
          ev.lon = parseFloat(fields.longitude) !== undefined ? parseFloat(fields.longitude) : ev.lon;
          ev.location = fields.location || ev.location;
          ev.category = fields.category || ev.category;
          ev.severity = parseInt(fields.severity) || ev.severity;
          ev.edited = true;
          if (fields.summary !== undefined) {
            if (!ev.details) ev.details = {};
            ev.details.summary = fields.summary;
          }
          evChanged = true;
        }
      }
      if (evChanged) {
        writeJsonFile(LOCAL_EVENTS_FILE, events);
      }
    } catch (err) {
      console.error('Error propagating local RSS update to events:', err);
    }

    return updatedItem;
  }

  try {
    const checkRes = await sql`SELECT id FROM rss_items WHERE id = ${cleanItemId}`;
    if (checkRes.rows.length === 0) {
      const title = fields.title || 'Untitled RSS Item';
      const category = fields.category || 'Political';
      const severity = parseInt(fields.severity) || 1;
      const location = fields.location || 'Global';
      const latVal = (fields.latitude !== undefined && fields.latitude !== null) ? parseFloat(fields.latitude) : 0.0;
      const lonVal = (fields.longitude !== undefined && fields.longitude !== null) ? parseFloat(fields.longitude) : 0.0;
      const url = fields.url || '';
      const source = fields.source || 'OSINT';
      const sid = fields.sid || 'restored';
      const summary = fields.summary || '';
      const publishedAt = new Date().toISOString();

      await sql`
        INSERT INTO rss_items (id, title, url, source, sid, location, latitude, longitude, category, severity, summary, published_at, edited)
        VALUES (${cleanItemId}, ${title}, ${url}, ${source}, ${sid}, ${location}, ${latVal}, ${lonVal}, ${category}, ${severity}, ${summary}, ${publishedAt}, TRUE)
      `;
    } else {
      if (fields.title !== undefined) await sql`UPDATE rss_items SET title = ${fields.title} WHERE id = ${cleanItemId}`;
      if (fields.category !== undefined) await sql`UPDATE rss_items SET category = ${fields.category} WHERE id = ${cleanItemId}`;
      if (fields.severity !== undefined) await sql`UPDATE rss_items SET severity = ${parseInt(fields.severity)} WHERE id = ${cleanItemId}`;
      if (fields.location !== undefined) await sql`UPDATE rss_items SET location = ${fields.location} WHERE id = ${cleanItemId}`;
      if (fields.latitude !== undefined) await sql`UPDATE rss_items SET latitude = ${parseFloat(fields.latitude)} WHERE id = ${cleanItemId}`;
      if (fields.longitude !== undefined) await sql`UPDATE rss_items SET longitude = ${parseFloat(fields.longitude)} WHERE id = ${cleanItemId}`;
      if (fields.source !== undefined) await sql`UPDATE rss_items SET source = ${fields.source} WHERE id = ${cleanItemId}`;
      if (fields.summary !== undefined) await sql`UPDATE rss_items SET summary = ${fields.summary} WHERE id = ${cleanItemId}`;
      await sql`UPDATE rss_items SET edited = TRUE WHERE id = ${cleanItemId}`;
    }

    const { rows } = await sql`SELECT * FROM rss_items WHERE id = ${cleanItemId}`;
    const updatedItem = rows[0] || null;

    // Propagate changes to sigint_events and duplicate rss_items in Postgres mode
    if (updatedItem) {
      try {
        const normTitle = getNormalizedTitle(updatedItem.title);
        const normUrl = getNormalizedUrl(updatedItem.url);
        
        // 1. Propagate within rss_items
        const rssRes = await sql`SELECT id, title, url FROM rss_items`;
        for (const item of rssRes.rows) {
          if (item.id === updatedItem.id) continue;
          const matchTitle = getNormalizedTitle(item.title) === normTitle;
          const matchUrl = normUrl && getNormalizedUrl(item.url) === normUrl;
          if (matchTitle || matchUrl) {
            const latVal = (fields.latitude !== undefined && fields.latitude !== null && !isNaN(parseFloat(fields.latitude))) ? parseFloat(fields.latitude) : item.latitude;
            const lonVal = (fields.longitude !== undefined && fields.longitude !== null && !isNaN(parseFloat(fields.longitude))) ? parseFloat(fields.longitude) : item.longitude;
            await sql`
              UPDATE rss_items 
              SET latitude = ${latVal}, longitude = ${lonVal}, location = ${fields.location || item.location}, 
                  category = ${fields.category || item.category}, severity = ${parseInt(fields.severity) || item.severity},
                  edited = TRUE
              WHERE id = ${item.id}
            `;
            if (fields.summary !== undefined) {
              await sql`UPDATE rss_items SET summary = ${fields.summary} WHERE id = ${item.id}`;
            }
          }
        }

        // 2. Propagate to sigint_events
        const eventsRes = await sql`SELECT id, title, url FROM sigint_events`;
        for (const ev of eventsRes.rows) {
          const matchTitle = getNormalizedTitle(ev.title) === normTitle;
          const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
          if (matchTitle || matchUrl) {
            const latVal = (fields.latitude !== undefined && fields.latitude !== null && !isNaN(parseFloat(fields.latitude))) ? parseFloat(fields.latitude) : ev.lat;
            const lonVal = (fields.longitude !== undefined && fields.longitude !== null && !isNaN(parseFloat(fields.longitude))) ? parseFloat(fields.longitude) : ev.lon;
            await sql`
              UPDATE sigint_events 
              SET lat = ${latVal}, lon = ${lonVal}, location = ${fields.location || ev.location},
                  category = ${fields.category || ev.category}, severity = ${parseInt(fields.severity) || ev.severity},
                  edited = TRUE
              WHERE id = ${ev.id}
            `;
            if (fields.summary !== undefined) {
              await sql`UPDATE sigint_events SET details = jsonb_set(COALESCE(details, '{}'), '{summary}', ${JSON.stringify(fields.summary)}::jsonb) WHERE id = ${ev.id}`;
            }
          }
        }
      } catch (err) {
        console.error('Error propagating Postgres RSS update:', err);
      }
    }

    return updatedItem;
  } catch (error) {
    console.error('updateRssItem error:', error);
    throw error;
  }
}

async function cascadeArchive(cleanId, archivedBy, clientTitle = '', clientUrl = '') {
  let targetTitle = clientTitle || '';
  let targetUrl = clientUrl || '';

  if (!process.env.POSTGRES_URL) {
    // Local JSON cascading archive logic
    const events = readJsonFile(LOCAL_EVENTS_FILE);
    const rss = readJsonFile(LOCAL_RSS_FILE);
    
    // Find the item first
    const ev = events.find(e => e.id === cleanId);
    if (ev) {
      targetTitle = targetTitle || ev.title;
      targetUrl = targetUrl || ev.url;
    } else {
      const item = rss.find(i => i.id === cleanId);
      if (item) {
        targetTitle = targetTitle || item.title;
        targetUrl = targetUrl || item.url;
      }
    }

    if (!targetTitle) {
      // check static
      const staticPath = path.resolve('public', 'data', 'events.json');
      let staticEvents = [];
      try {
        if (fs.existsSync(staticPath)) {
          staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
        }
      } catch (err) {}
      const staticEvent = staticEvents.find(e => e.id === cleanId);
      if (staticEvent) {
        targetTitle = staticEvent.title;
        targetUrl = staticEvent.url;
      }
    }

    const normTitle = getNormalizedTitle(targetTitle);
    const normUrl = getNormalizedUrl(targetUrl);

    const archivePath = path.resolve('archived-events-local.json');
    const archive = readJsonFile(archivePath);

    // Filter events
    const filteredEvents = [];
    for (const e of events) {
      const matchTitle = normTitle && getNormalizedTitle(e.title) === normTitle;
      const matchUrl = normUrl && getNormalizedUrl(e.url) === normUrl;
      if (e.id === cleanId || matchTitle || matchUrl) {
        if (!archive.some(a => a.id === e.id)) {
          archive.push({
            ...e,
            source_table: 'sigint_events',
            archived_by: archivedBy,
            archived_at: new Date().toISOString(),
            original_created_at: e.created_at || e.timestamp || new Date().toISOString(),
            edited: e.edited || false
          });
        }
      } else {
        filteredEvents.push(e);
      }
    }
    writeJsonFile(LOCAL_EVENTS_FILE, filteredEvents);

    // Filter rss items
    const filteredRss = [];
    for (const r of rss) {
      const matchTitle = normTitle && getNormalizedTitle(r.title) === normTitle;
      const matchUrl = normUrl && getNormalizedUrl(r.url) === normUrl;
      if (r.id === cleanId || matchTitle || matchUrl) {
        if (!archive.some(a => a.id === r.id)) {
          archive.push({
            id: r.id,
            title: r.title,
            category: r.category,
            severity: r.severity,
            location: r.location,
            lat: r.latitude ?? 0,
            lon: r.longitude ?? 0,
            timestamp: r.published_at,
            url: r.url,
            details: { summary: r.summary, source: r.source },
            source_table: 'rss_items',
            archived_by: archivedBy,
            archived_at: new Date().toISOString(),
            original_created_at: r.created_at || new Date().toISOString(),
            edited: r.edited || false
          });
        }
      } else {
        filteredRss.push(r);
      }
    }
    writeJsonFile(LOCAL_RSS_FILE, filteredRss);
    writeJsonFile(archivePath, archive);

    return { id: cleanId, archived: true };
  }

  // Postgres cascading archive logic
  try {
    if (!targetTitle || !targetUrl) {
      const resSig = await sql`SELECT title, url FROM sigint_events WHERE id = ${cleanId}`;
      if (resSig.rows.length > 0) {
        targetTitle = targetTitle || resSig.rows[0].title;
        targetUrl = targetUrl || resSig.rows[0].url;
      } else {
        const resRss = await sql`SELECT title, url FROM rss_items WHERE id = ${cleanId}`;
        if (resRss.rows.length > 0) {
          targetTitle = targetTitle || resRss.rows[0].title;
          targetUrl = targetUrl || resRss.rows[0].url;
        }
      }
    }

    if (!targetTitle) {
      const staticPath = path.resolve('public', 'data', 'events.json');
      let staticEvents = [];
      try {
        if (fs.existsSync(staticPath)) {
          staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
        }
      } catch (err) {}
      const staticEvent = staticEvents.find(e => e.id === cleanId);
      if (staticEvent) {
        targetTitle = staticEvent.title;
        targetUrl = staticEvent.url;
      }
    }

    const normTitle = getNormalizedTitle(targetTitle);
    const normUrl = getNormalizedUrl(targetUrl);

    // Delete and archive matching sigint_events
    const sigRes = await sql`SELECT * FROM sigint_events`;
    for (const ev of sigRes.rows) {
      const matchTitle = normTitle && getNormalizedTitle(ev.title) === normTitle;
      const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
      if (ev.id === cleanId || matchTitle || matchUrl) {
        await sql`
          INSERT INTO archived_events (id, title, category, severity, location, lat, lon, timestamp, url, details, source_table, archived_by, original_created_at, edited)
          VALUES (${ev.id}, ${ev.title}, ${ev.category}, ${ev.severity}, ${ev.location}, ${ev.lat}, ${ev.lon}, ${ev.timestamp}, ${ev.url}, ${JSON.stringify(ev.details)}, 'sigint_events', ${archivedBy}, ${ev.created_at || 'CURRENT_TIMESTAMP'}, ${ev.edited})
          ON CONFLICT (id) DO NOTHING
        `;
        await sql`DELETE FROM sigint_events WHERE id = ${ev.id}`;
      }
    }

    // Delete and archive matching rss_items
    const rssRes = await sql`SELECT * FROM rss_items`;
    for (const item of rssRes.rows) {
      const matchTitle = normTitle && getNormalizedTitle(item.title) === normTitle;
      const matchUrl = normUrl && getNormalizedUrl(item.url) === normUrl;
      if (item.id === cleanId || matchTitle || matchUrl) {
        await sql`
          INSERT INTO archived_events (id, title, category, severity, location, lat, lon, timestamp, url, details, source_table, archived_by, original_created_at, edited)
          VALUES (
            ${item.id}, ${item.title}, ${item.category}, ${item.severity}, ${item.location}, ${item.latitude}, ${item.longitude}, ${item.published_at}, ${item.url}, 
            ${JSON.stringify({summary: item.summary, source: item.source})}, 'rss_items', ${archivedBy}, ${item.created_at || 'CURRENT_TIMESTAMP'}, ${item.edited}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        await sql`DELETE FROM rss_items WHERE id = ${item.id}`;
      }
    }

    // Delete and archive AI regulations or static fallbacks if not handled
    const resReg = await sql`SELECT id, title, jurisdiction, status, area, date, description, lat, lon, created_at FROM ai_regulations WHERE id = ${cleanId}`;
    if (resReg.rows.length > 0) {
      const reg = resReg.rows[0];
      await sql`
        INSERT INTO archived_events (id, title, category, severity, location, lat, lon, timestamp, url, details, source_table, archived_by, original_created_at, edited)
        VALUES (
          ${reg.id}, ${reg.title}, ${reg.area || 'Political'}, 2, ${reg.jurisdiction || 'Global'}, ${reg.lat}, ${reg.lon}, CURRENT_TIMESTAMP, '', 
          ${JSON.stringify({ description: reg.description, status: reg.status, date: reg.date })}, 'ai_regulations', ${archivedBy}, ${reg.created_at || 'CURRENT_TIMESTAMP'}, FALSE
        )
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`DELETE FROM ai_regulations WHERE id = ${cleanId}`;
    }

    // Ensure main ID is archived even if it had no matches
    const finalCheck = await sql`SELECT id FROM archived_events WHERE id = ${cleanId}`;
    if (finalCheck.rows.length === 0) {
      await sql`
        INSERT INTO archived_events (id, title, category, severity, location, lat, lon, timestamp, url, details, source_table, archived_by, original_created_at, edited)
        VALUES (${cleanId}, 'Archived Signal', 'Conflict', 1, 'Global', 0.0, 0.0, CURRENT_TIMESTAMP, '', '{}'::jsonb, 'sigint_events', ${archivedBy}, CURRENT_TIMESTAMP, FALSE)
        ON CONFLICT (id) DO NOTHING
      `;
    }

    return { id: cleanId, archived: true };
  } catch (error) {
    console.error('cascadeArchive error:', error);
    throw error;
  }
}

export async function archiveEvent(eventId, archivedBy, clientTitle = '', clientUrl = '') {
  const cleanEventId = String(eventId).replace(/^db-/, '').replace(/^rss-/, '');
  return cascadeArchive(cleanEventId, archivedBy, clientTitle, clientUrl);
}

export async function archiveRssItem(itemId, archivedBy, clientTitle = '', clientUrl = '') {
  const cleanItemId = String(itemId).replace(/^db-/, '').replace(/^rss-/, '');
  return cascadeArchive(cleanItemId, archivedBy, clientTitle, clientUrl);
}

async function cascadeDeletePermanently(cleanId, clientTitle = '', clientUrl = '') {
  await initDb();
  let targetTitle = clientTitle || '';
  let targetUrl = clientUrl || '';

  if (!process.env.POSTGRES_URL) {
    // Local JSON cascading delete logic
    const events = readJsonFile(LOCAL_EVENTS_FILE);
    const rss = readJsonFile(LOCAL_RSS_FILE);
    
    // Find the item first
    const ev = events.find(e => e.id === cleanId);
    if (ev) {
      targetTitle = targetTitle || ev.title;
      targetUrl = targetUrl || ev.url;
    } else {
      const item = rss.find(i => i.id === cleanId);
      if (item) {
        targetTitle = targetTitle || item.title;
        targetUrl = targetUrl || item.url;
      }
    }

    if (!targetTitle) {
      // check static
      const staticPath = path.resolve('public', 'data', 'events.json');
      let staticEvents = [];
      try {
        if (fs.existsSync(staticPath)) {
          staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
        }
      } catch (err) {}
      const staticEvent = staticEvents.find(e => e.id === cleanId);
      if (staticEvent) {
        targetTitle = staticEvent.title;
        targetUrl = staticEvent.url;
      }
    }

    const normTitle = getNormalizedTitle(targetTitle);
    const normUrl = getNormalizedUrl(targetUrl);

    // Filter events
    const filteredEvents = [];
    for (const e of events) {
      const matchTitle = normTitle && getNormalizedTitle(e.title) === normTitle;
      const matchUrl = normUrl && getNormalizedUrl(e.url) === normUrl;
      if (e.id !== cleanId && !matchTitle && !matchUrl) {
        filteredEvents.push(e);
      }
    }
    writeJsonFile(LOCAL_EVENTS_FILE, filteredEvents);

    // Filter rss items
    const filteredRss = [];
    for (const r of rss) {
      const matchTitle = normTitle && getNormalizedTitle(r.title) === normTitle;
      const matchUrl = normUrl && getNormalizedUrl(r.url) === normUrl;
      if (r.id !== cleanId && !matchTitle && !matchUrl) {
        filteredRss.push(r);
      }
    }
    writeJsonFile(LOCAL_RSS_FILE, filteredRss);

    // Filter ai regulations
    const regulations = readJsonFile(LOCAL_AI_REGULATIONS_FILE);
    const filteredRegs = regulations.filter(reg => reg.id !== cleanId);
    writeJsonFile(LOCAL_AI_REGULATIONS_FILE, filteredRegs);

    // Filter archived events
    const archivePath = path.resolve('archived-events-local.json');
    const archive = readJsonFile(archivePath);
    const filteredArchive = [];
    for (const e of archive) {
      const matchTitle = normTitle && getNormalizedTitle(e.title) === normTitle;
      const matchUrl = normUrl && getNormalizedUrl(e.url) === normUrl;
      if (e.id !== cleanId && !matchTitle && !matchUrl) {
        filteredArchive.push(e);
      }
    }
    writeJsonFile(archivePath, filteredArchive);

    // Record in purged events blocklist to prevent re-ingest!
    const purgedList = readJsonFile(LOCAL_PURGED_EVENTS_FILE);
    if (!purgedList.find(p => p.id === cleanId)) {
      purgedList.push({
        id: cleanId,
        title: targetTitle || 'Unknown Event',
        url: targetUrl || '',
        purged_at: new Date().toISOString()
      });
      writeJsonFile(LOCAL_PURGED_EVENTS_FILE, purgedList);
    }

    // Also remove from static events.json
    const staticPath = path.resolve('public', 'data', 'events.json');
    if (fs.existsSync(staticPath)) {
      try {
        const staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
        const filteredStatic = staticEvents.filter(e => {
          const matchTitle = getNormalizedTitle(e.title) === normTitle;
          const matchUrl = normUrl && getNormalizedUrl(e.url) === normUrl;
          return e.id !== cleanId && !matchTitle && !matchUrl;
        });
        fs.writeFileSync(staticPath, JSON.stringify(filteredStatic, null, 2), 'utf8');
      } catch (err) {
        console.error('Error updating static events.json on local delete:', err);
      }
    }

    return { id: cleanId, deleted: true };
  }

  // Postgres cascading delete logic
  try {
    if (!targetTitle || !targetUrl) {
      const resSig = await sql`SELECT title, url FROM sigint_events WHERE id = ${cleanId}`;
      if (resSig.rows.length > 0) {
        targetTitle = targetTitle || resSig.rows[0].title;
        targetUrl = targetUrl || resSig.rows[0].url;
      } else {
        const resRss = await sql`SELECT title, url FROM rss_items WHERE id = ${cleanId}`;
        if (resRss.rows.length > 0) {
          targetTitle = targetTitle || resRss.rows[0].title;
          targetUrl = targetUrl || resRss.rows[0].url;
        }
      }
    }

    if (!targetTitle) {
      const staticPath = path.resolve('public', 'data', 'events.json');
      let staticEvents = [];
      try {
        if (fs.existsSync(staticPath)) {
          staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
        }
      } catch (err) {}
      const staticEvent = staticEvents.find(e => e.id === cleanId);
      if (staticEvent) {
        targetTitle = staticEvent.title;
        targetUrl = staticEvent.url;
      }
    }

    const normTitle = getNormalizedTitle(targetTitle);
    const normUrl = getNormalizedUrl(targetUrl);

    // Delete matching sigint_events
    const sigRes = await sql`SELECT * FROM sigint_events`;
    for (const ev of sigRes.rows) {
      const matchTitle = normTitle && getNormalizedTitle(ev.title) === normTitle;
      const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
      if (ev.id === cleanId || matchTitle || matchUrl) {
        await sql`DELETE FROM sigint_events WHERE id = ${ev.id}`;
      }
    }

    // Delete matching rss_items
    const rssRes = await sql`SELECT * FROM rss_items`;
    for (const item of rssRes.rows) {
      const matchTitle = normTitle && getNormalizedTitle(item.title) === normTitle;
      const matchUrl = normUrl && getNormalizedUrl(item.url) === normUrl;
      if (item.id === cleanId || matchTitle || matchUrl) {
        await sql`DELETE FROM rss_items WHERE id = ${item.id}`;
      }
    }

    // Delete matching ai regulations
    await sql`DELETE FROM ai_regulations WHERE id = ${cleanId}`;

    // Delete matching archived_events
    const archiveRes = await sql`SELECT * FROM archived_events`;
    for (const ev of archiveRes.rows) {
      const matchTitle = normTitle && getNormalizedTitle(ev.title) === normTitle;
      const matchUrl = normUrl && getNormalizedUrl(ev.url) === normUrl;
      if (ev.id === cleanId || matchTitle || matchUrl) {
        await sql`DELETE FROM archived_events WHERE id = ${ev.id}`;
      }
    }

    // Record in purged events blocklist to prevent re-ingest!
    await sql`
      INSERT INTO purged_events (id, title, url)
      VALUES (${cleanId}, ${targetTitle || 'Unknown Event'}, ${targetUrl || ''})
      ON CONFLICT (id) DO NOTHING
    `;

    // Also record in the local JSON blocklist so local scripts can access it!
    try {
      const purgedList = readJsonFile(LOCAL_PURGED_EVENTS_FILE);
      if (!purgedList.find(p => p.id === cleanId)) {
        purgedList.push({
          id: cleanId,
          title: targetTitle || 'Unknown Event',
          url: targetUrl || '',
          purged_at: new Date().toISOString()
        });
        writeJsonFile(LOCAL_PURGED_EVENTS_FILE, purgedList);
      }
    } catch (err) {
      console.error('Error writing to local purged events blocklist in Postgres mode:', err);
    }

    // Also remove from static events.json
    const staticPath = path.resolve('public', 'data', 'events.json');
    if (fs.existsSync(staticPath)) {
      try {
        const staticEvents = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
        const filteredStatic = staticEvents.filter(e => {
          const matchTitle = getNormalizedTitle(e.title) === normTitle;
          const matchUrl = normUrl && getNormalizedUrl(e.url) === normUrl;
          return e.id !== cleanId && !matchTitle && !matchUrl;
        });
        fs.writeFileSync(staticPath, JSON.stringify(filteredStatic, null, 2), 'utf8');
      } catch (err) {
        console.error('Error updating static events.json on Postgres delete:', err);
      }
    }

    return { id: cleanId, deleted: true };
  } catch (error) {
    console.error('cascadeDeletePermanently error:', error);
    throw error;
  }
}

export async function deleteEventPermanently(eventId, clientTitle = '', clientUrl = '') {
  const cleanEventId = String(eventId).replace(/^db-/, '').replace(/^rss-/, '');
  return cascadeDeletePermanently(cleanEventId, clientTitle, clientUrl);
}

export async function deleteRssItemPermanently(itemId, clientTitle = '', clientUrl = '') {
  const cleanItemId = String(itemId).replace(/^db-/, '').replace(/^rss-/, '');
  return cascadeDeletePermanently(cleanItemId, clientTitle, clientUrl);
}


export async function getArchivedEvents(page = 1, limit = 50) {
  await initDb();
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

export async function getArchivedIds() {
  await initDb();
  if (!process.env.POSTGRES_URL) {
    const archivePath = path.resolve('archived-events-local.json');
    const archive = readJsonFile(archivePath);
    const purged = readJsonFile(LOCAL_PURGED_EVENTS_FILE);
    const ids = new Set(archive.map(e => e.id));
    purged.forEach(e => { if (e.id) ids.add(e.id); });
    // Also block by normalized URL so GDELT re-fetches of the same article are rejected
    archive.forEach(e => { if (e.url) ids.add(getNormalizedUrl(e.url)); });
    purged.forEach(e => { if (e.url) ids.add(getNormalizedUrl(e.url)); });
    return ids;
  }
  try {
    const [archiveRes, purgedRes] = await Promise.all([
      sql`SELECT id, url FROM archived_events`,
      sql`SELECT id, url FROM purged_events`.catch(() => ({ rows: [] }))
    ]);
    const ids = new Set();
    archiveRes.rows.forEach(r => {
      if (r.id) ids.add(r.id);
      if (r.url) ids.add(getNormalizedUrl(r.url));
    });
    purgedRes.rows.forEach(r => {
      if (r.id) ids.add(r.id);
      if (r.url) ids.add(getNormalizedUrl(r.url));
    });
    return ids;
  } catch (error) {
    console.error('getArchivedIds error:', error);
    return new Set();
  }
}

export function getTitleKeywords(title) {
  if (!title) return new Set();
  const clean = title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const tokens = clean.split(/\s+/).filter(t => t.length > 2);
  return new Set(tokens);
}

export function calculateTitleFuzzySimilarity(t1, t2) {
  const set1 = getTitleKeywords(t1);
  const set2 = getTitleKeywords(t2);
  if (set1.size === 0 || set2.size === 0) return 0;
  
  let intersectionCount = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      intersectionCount++;
    }
  }
  const unionSize = set1.size + set2.size - intersectionCount;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

export async function getArchivedInfo() {
  await initDb();
  let archive = [];
  let purged = [];
  if (!process.env.POSTGRES_URL) {
    const archivePath = path.resolve('archived-events-local.json');
    archive = readJsonFile(archivePath);
    purged = readJsonFile(LOCAL_PURGED_EVENTS_FILE);
  } else {
    try {
      const { rows } = await sql`SELECT id, url, title FROM archived_events`;
      archive = rows;
    } catch (e) {
      console.error('getArchivedInfo DB error:', e);
    }
    try {
      const { rows } = await sql`SELECT id, url, title FROM purged_events`;
      purged = rows;
    } catch (e) {
      console.error('getArchivedInfo DB purged_events error:', e);
    }
  }

  const ids = new Set();
  const urls = new Set();
  const titles = new Set();
  const rawTitles = [];

  const processItem = (e) => {
    if (e.id) ids.add(e.id);
    if (e.url) {
      const urlNorm = getNormalizedUrl(e.url);
      if (urlNorm) urls.add(urlNorm);
    }
    if (e.title) {
      rawTitles.push(e.title);
      const titleNorm = e.title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
      if (titleNorm.length >= 10) {
        titles.add(titleNorm);
      }
    }
  };

  archive.forEach(processItem);
  purged.forEach(processItem);

  return { ids, urls, titles, rawTitles };
}

export function isEventArchived(e, archivedInfo) {
  if (!e || !archivedInfo) return false;
  const { ids, urls, titles, rawTitles } = archivedInfo;
  if (e.id && ids.has(e.id)) return true;
  if (e.url) {
    const urlNorm = getNormalizedUrl(e.url);
    if (urlNorm && urls.has(urlNorm)) return true;
  }
  const t = e.title || e.name || e.subject;
  if (t) {
    const titleNorm = t.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (titleNorm && titles.has(titleNorm)) return true;
    
    // Fuzzy matching with 60% threshold
    if (rawTitles && rawTitles.length > 0) {
      for (const archivedTitle of rawTitles) {
        if (calculateTitleFuzzySimilarity(t, archivedTitle) >= 0.6) {
          return true;
        }
      }
    }
  }
  return false;
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
      items.push({ id: event.id, title: event.title, category: event.category, severity: event.severity, location: event.location, latitude: event.lat, longitude: event.lon, published_at: event.timestamp, url: event.url, source: event.details?.source || 'OSINT', summary: event.details?.summary || '', created_at: event.original_created_at, edited: event.edited || false });
      writeJsonFile(LOCAL_RSS_FILE, items);
    } else {
      const events = readJsonFile(LOCAL_EVENTS_FILE);
      events.push({ id: event.id, title: event.title, category: event.category, severity: event.severity, location: event.location, lat: event.lat, lon: event.lon, timestamp: event.timestamp, url: event.url, details: event.details, created_at: event.original_created_at, edited: event.edited || false });
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
        INSERT INTO rss_items (id, title, url, source, sid, location, latitude, longitude, category, severity, summary, published_at, created_at, edited)
        VALUES (${event.id}, ${event.title}, ${event.url || ''}, ${event.details?.source || 'OSINT'}, ${event.details?.source || 'restored'},
          ${event.location}, ${event.lat}, ${event.lon}, ${event.category}, ${event.severity},
          ${event.details?.summary || ''}, ${event.timestamp}, ${event.original_created_at || new Date().toISOString()}, ${event.edited || false})
        ON CONFLICT (url) DO NOTHING
      `;
    } else {
      await sql`
        INSERT INTO sigint_events (id, title, category, severity, location, lat, lon, timestamp, url, details, created_at, edited)
        VALUES (${event.id}, ${event.title}, ${event.category}, ${event.severity}, ${event.location},
          ${event.lat}, ${event.lon}, ${event.timestamp}, ${event.url}, ${JSON.stringify(event.details || {})},
          ${event.original_created_at || new Date().toISOString()}, ${event.edited || false})
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

export async function getDiagnosticAnomalies() {
  let allEvents = [];
  let allRss = [];

  if (!process.env.POSTGRES_URL) {
    allEvents = readJsonFile(LOCAL_EVENTS_FILE);
    allRss = readJsonFile(LOCAL_RSS_FILE).map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      location: item.location,
      lat: item.latitude,
      lon: item.longitude,
      category: item.category,
      severity: item.severity,
      details: { summary: item.summary, isRssItem: true }
    }));
  } else {
    try {
      const evRes = await sql`SELECT id, title, category, severity, location, lat, lon, url, details FROM sigint_events`;
      allEvents = evRes.rows;
      
      const rssRes = await sql`SELECT id, title, url, source, location, latitude as lat, longitude as lon, category, severity, summary FROM rss_items`;
      allRss = rssRes.rows.map(item => ({
        ...item,
        details: { summary: item.summary, isRssItem: true }
      }));
    } catch (err) {
      console.error('Failed to fetch diagnostics raw rows:', err);
      return [];
    }
  }

  const anomalies = [];
  const titleGroups = new Map();
  const urlGroups = new Map();

  const combined = [
    ...allEvents.map(e => ({ ...e, _sourceTable: 'sigint_events' })),
    ...allRss.map(r => ({ ...r, _sourceTable: 'rss_items' }))
  ];

  combined.forEach(item => {
    const normTitle = getNormalizedTitle(item.title);
    const normUrl = getNormalizedUrl(item.url);

    if (normTitle) {
      if (!titleGroups.has(normTitle)) titleGroups.set(normTitle, []);
      titleGroups.get(normTitle).push(item);
    }
    if (normUrl) {
      if (!urlGroups.has(normUrl)) urlGroups.set(normUrl, []);
      urlGroups.get(normUrl).push(item);
    }
  });

  combined.forEach(item => {
    let isFlagged = false;
    let reasons = [];

    // 1. Check coordinates
    const latNum = parseFloat(item.lat);
    const lonNum = parseFloat(item.lon);
    if (item.lat === null || item.lat === undefined || isNaN(latNum) ||
        item.lon === null || item.lon === undefined || isNaN(lonNum)) {
      isFlagged = true;
      reasons.push('Invalid coordinates (NaN or missing value)');
    } else if (latNum === 0.0 && lonNum === 0.0) {
      isFlagged = true;
      reasons.push('Ungeocoded coordinates (Default 0.0, 0.0)');
    } else if (latNum < -90.0 || latNum > 90.0 || lonNum < -180.0 || lonNum > 180.0) {
      isFlagged = true;
      reasons.push(`Coordinates out of bounds (${latNum}, ${lonNum})`);
    }

    // 2. Check duplicates
    const normTitle = getNormalizedTitle(item.title);
    const normUrl = getNormalizedUrl(item.url);
    if (normTitle && titleGroups.get(normTitle).length > 1) {
      isFlagged = true;
      reasons.push(`Duplicate: Shares title with ${titleGroups.get(normTitle).length - 1} other record(s)`);
    }
    if (normUrl && urlGroups.get(normUrl).length > 1) {
      isFlagged = true;
      reasons.push(`Duplicate: Shares URL with ${urlGroups.get(normUrl).length - 1} other record(s)`);
    }

    // 3. Check missing info
    if (!item.title || item.title.trim() === '' || item.title.toLowerCase().includes('untitled')) {
      isFlagged = true;
      reasons.push('Missing or placeholder title');
    }
    if (!item.location || item.location.trim() === '' || item.location.toLowerCase() === 'global' || item.location.toLowerCase() === 'unknown') {
      isFlagged = true;
      reasons.push('Missing or generic location');
    }
    const summaryText = item.details?.summary || item.summary || '';
    if (!summaryText || summaryText.trim().length < 15) {
      isFlagged = true;
      reasons.push('Missing or too short intelligence summary');
    }

    // 4. Check broken links
    if (item._sourceTable === 'sigint_events') {
      if (!item.url || item.url.trim() === '') {
        isFlagged = true;
        reasons.push('Missing source URL press link');
      } else if (item.details?.verificationStatus === 'broken') {
        isFlagged = true;
        reasons.push('Broken/Dead press link (Verification failed)');
      }
    }

    if (isFlagged) {
      anomalies.push({
        id: item.id,
        title: item.title || 'Untitled Dossier',
        category: item.category || 'Political',
        severity: item.severity || 1,
        location: item.location || 'Unknown',
        lat: item.lat,
        lon: item.lon,
        url: item.url || '',
        source_table: item._sourceTable,
        anomalyType: reasons.join('; '),
        details: item.details || {}
      });
    }
  });

  return anomalies;
}

export async function logAccess(email, name, ip, location, userAgent) {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  if (!process.env.POSTGRES_URL) {
    const localLogs = readJsonFile(LOCAL_LOGS_FILE);
    localLogs.unshift({
      id,
      user_email: email,
      user_name: name,
      ip_address: ip,
      location,
      user_agent: userAgent,
      accessed_at: timestamp
    });
    writeJsonFile(LOCAL_LOGS_FILE, localLogs.slice(0, 200)); // cap at 200 logs
    return;
  }
  try {
    await sql`
      INSERT INTO access_logs (id, user_email, user_name, ip_address, location, user_agent, accessed_at)
      VALUES (${id}, ${email}, ${name}, ${ip}, ${location}, ${userAgent}, ${timestamp})
    `;
  } catch (error) {
    console.error('Failed to log access in Postgres:', error);
  }
}

export async function updateHeartbeat(email, name, ip, location) {
  const timestamp = new Date().toISOString();
  if (!process.env.POSTGRES_URL) {
    const localActive = readJsonFile(LOCAL_ACTIVE_USERS_FILE);
    const index = localActive.findIndex(u => u.email === email);
    const userData = { email, name, ip_address: ip, location, last_seen: timestamp };
    if (index !== -1) {
      localActive[index] = userData;
    } else {
      localActive.push(userData);
    }
    // Clean up inactive users (older than 30s)
    const thirtySecsAgo = Date.now() - 30 * 1000;
    const filtered = localActive.filter(u => new Date(u.last_seen).getTime() > thirtySecsAgo);
    writeJsonFile(LOCAL_ACTIVE_USERS_FILE, filtered);
    return;
  }
  try {
    await sql`
      INSERT INTO active_users (email, name, ip_address, location, last_seen)
      VALUES (${email}, ${name}, ${ip}, ${location}, ${timestamp})
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        ip_address = EXCLUDED.ip_address,
        location = EXCLUDED.location,
        last_seen = EXCLUDED.last_seen
    `;
    // Clean up older ones (older than 45s)
    await sql`DELETE FROM active_users WHERE last_seen < NOW() - INTERVAL '45 seconds'`;
  } catch (error) {
    console.error('Failed to update heartbeat in Postgres:', error);
  }
}

export async function getAccessLogs() {
  if (!process.env.POSTGRES_URL) {
    return readJsonFile(LOCAL_LOGS_FILE).slice(0, 100);
  }
  try {
    const { rows } = await sql`
      SELECT id, user_email, user_name, ip_address, location, user_agent, accessed_at
      FROM access_logs
      ORDER BY accessed_at DESC
      LIMIT 100
    `;
    return rows;
  } catch (error) {
    console.error('Failed to get access logs:', error);
    return [];
  }
}

export async function getActiveUsers() {
  const thirtySecsAgo = Date.now() - 30 * 1000;
  if (!process.env.POSTGRES_URL) {
    const localActive = readJsonFile(LOCAL_ACTIVE_USERS_FILE);
    return localActive.filter(u => new Date(u.last_seen).getTime() > thirtySecsAgo);
  }
  try {
    const { rows } = await sql`
      SELECT email, name, ip_address, location, last_seen
      FROM active_users
      WHERE last_seen >= NOW() - INTERVAL '45 seconds'
      ORDER BY last_seen DESC
    `;
    return rows;
  } catch (error) {
    console.error('Failed to get active users:', error);
    return [];
  }
}

export async function getAllUsers(page = 1, limit = 50, search = '') {
  await initDb();
  if (!process.env.POSTGRES_URL) {
    const localUsers = readJsonFile(LOCAL_USERS_FILE);
    let filtered = localUsers;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(u => u.email.toLowerCase().includes(s) || u.full_name.toLowerCase().includes(s));
    }
    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    return { users: paginated, total, page, limit };
  }
  
  try {
    let countQ = 'SELECT COUNT(*) FROM users';
    let countVals = [];
    if (search) {
      countQ += ' WHERE email ILIKE $1 OR full_name ILIKE $1';
      countVals.push(`%${search}%`);
    }
    const { rows: countRows } = await sql.query(countQ, countVals);
    const total = parseInt(countRows[0].count);

    let dataQ = 'SELECT id, email, full_name, role, is_verified, created_at FROM users';
    let dataVals = [];
    if (search) {
      dataQ += ' WHERE email ILIKE $1 OR full_name ILIKE $1';
      dataVals.push(`%${search}%`);
    }
    dataQ += ` ORDER BY created_at DESC LIMIT $${dataVals.length + 1} OFFSET $${dataVals.length + 2}`;
    dataVals.push(limit, (page - 1) * limit);

    const { rows } = await sql.query(dataQ, dataVals);
    return { users: rows, total, page, limit };
  } catch (error) {
    console.error('getAllUsers DB error:', error);
    return { users: [], total: 0, page, limit };
  }
}

export async function updateUserRole(userId, newRole) {
  await initDb();
  if (!process.env.POSTGRES_URL) {
    const localUsers = readJsonFile(LOCAL_USERS_FILE);
    const index = localUsers.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    localUsers[index].role = newRole;
    writeJsonFile(LOCAL_USERS_FILE, localUsers);
    return localUsers[index];
  }
  
  try {
    const { rows } = await sql`
      UPDATE users SET role = ${newRole} WHERE id = ${userId} RETURNING *
    `;
    if (rows.length === 0) throw new Error('User not found');
    return rows[0];
  } catch (error) {
    console.error('updateUserRole DB error:', error);
    throw error;
  }
}

export async function deleteUser(userId) {
  await initDb();
  if (!process.env.POSTGRES_URL) {
    const localUsers = readJsonFile(LOCAL_USERS_FILE);
    const filtered = localUsers.filter(u => u.id !== userId);
    writeJsonFile(LOCAL_USERS_FILE, filtered);
    return { success: true };
  }
  
  try {
    await sql`DELETE FROM users WHERE id = ${userId}`;
    return { success: true };
  } catch (error) {
    console.error('deleteUser DB error:', error);
    throw error;
  }
}
