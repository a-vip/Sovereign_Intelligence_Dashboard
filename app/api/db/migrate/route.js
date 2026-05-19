import { NextResponse } from 'next/server';
import { initDb, saveEvents, saveVaultDocs, createUser, saveSuggestion, saveRssItems } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // 1. Secure token validation to restrict execution
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (token !== 'avi_db_migrate_secure') {
    return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
  }

  const hasDb = !!process.env.POSTGRES_URL;
  if (!hasDb) {
    return NextResponse.json({ error: 'POSTGRES_URL environment variable is missing' }, { status: 400 });
  }

  try {
    console.log('[Migration System]: Initializing database tables...');
    // Ensure all tables and indexes are self-healed and created
    await initDb();

    const report = {
      users: 0,
      events: 0,
      rss: 0,
      suggestions: 0,
      vault: 0
    };

    // 2. Migrate Users
    const usersPath = path.resolve('users-local.json');
    if (fs.existsSync(usersPath)) {
      const localUsers = JSON.parse(fs.readFileSync(usersPath, 'utf8') || '[]');
      console.log(`[Migration System]: Found ${localUsers.length} local users.`);
      for (const u of localUsers) {
        try {
          await createUser(u.email, u.password_hash, u.full_name, u.role);
          report.users++;
        } catch (e) {
          // Ignore if user already exists
          console.warn(`[Migration System]: User ${u.email} already exists or failed:`, e.message);
        }
      }
    }

    // 3. Migrate SIGINT Events
    const eventsPath = path.resolve('events-local.json');
    if (fs.existsSync(eventsPath)) {
      const localEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf8') || '[]');
      console.log(`[Migration System]: Found ${localEvents.length} local events.`);
      if (localEvents.length > 0) {
        await saveEvents(localEvents);
        report.events = localEvents.length;
      }
    }

    // 4. Migrate RSS Items
    const rssPath = path.resolve('rss-local.json');
    if (fs.existsSync(rssPath)) {
      const localRss = JSON.parse(fs.readFileSync(rssPath, 'utf8') || '[]');
      console.log(`[Migration System]: Found ${localRss.length} local RSS items.`);
      if (localRss.length > 0) {
        await saveRssItems(localRss);
        report.rss = localRss.length;
      }
    }

    // 5. Migrate Suggestions
    const suggestionsPath = path.resolve('suggestions-local.json');
    if (fs.existsSync(suggestionsPath)) {
      const localSuggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8') || '[]');
      console.log(`[Migration System]: Found ${localSuggestions.length} local suggestions.`);
      for (const s of localSuggestions) {
        try {
          await saveSuggestion({
            type: s.type,
            subject: s.subject,
            details: s.details,
            targetId: s.target_id,
            operatorEmail: s.operator_email,
            operatorName: s.operator_name,
            screenshot: s.screenshot
          });
          report.suggestions++;
        } catch (e) {
          console.error(`[Migration System]: Suggestion failed:`, e.message);
        }
      }
    }

    // 6. Migrate Vault Documents
    const vaultPath = path.resolve('vault-local.json');
    if (fs.existsSync(vaultPath)) {
      const localVault = JSON.parse(fs.readFileSync(vaultPath, 'utf8') || '[]');
      console.log(`[Migration System]: Found ${localVault.length} local vault docs.`);
      if (localVault.length > 0) {
        const mappedDocs = localVault.map(d => ({
          id: d.id,
          title: d.title,
          filename: d.filename,
          relativePath: d.relative_path,
          category: d.category,
          content: d.content,
          preview: d.preview,
          tags: d.tags,
          threatLevel: d.threat_level,
          lastModified: d.last_modified
        }));
        await saveVaultDocs(mappedDocs);
        report.vault = localVault.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Local database successfully migrated to Neon PostgreSQL cloud instance',
      report
    });

  } catch (error) {
    console.error('[Migration System Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
