import { NextResponse } from 'next/server';
import { getAiRegulations, saveAiRegulations, initDb, getArchivedInfo, isEventArchived } from '@/lib/db';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    await initDb();
    let regulations = await getAiRegulations();

    // Self-healing: if the DB is empty OR has less than 100 items (meaning old mock data is present),
    // clear the table and import/re-populate from our rich local KML JSON file to sync with production database!
    if (regulations.length < 100) {
      const localFilePath = path.resolve('ai-regulations-local.json');
      if (fs.existsSync(localFilePath)) {
        try {
          const raw = fs.readFileSync(localFilePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Auto-populating/updating database with ${parsed.length} local KML AI regulations...`);
            
            if (process.env.POSTGRES_URL) {
              await sql`TRUNCATE TABLE ai_regulations`;
            } else {
              // Ensure we write a clean local JSON file (which we did, but good practice)
              fs.writeFileSync(localFilePath, JSON.stringify(parsed, null, 2), 'utf8');
            }
            
            await saveAiRegulations(parsed);
            regulations = await getAiRegulations();
          }
        } catch (e) {
          console.error("Auto-population sync error:", e);
        }
      }
    }

    const archivedInfo = await getArchivedInfo();
    const filteredRegulations = regulations.filter(reg => !isEventArchived(reg, archivedInfo));
    
    return NextResponse.json({
      metadata: {
        total: filteredRegulations.length,
        timestamp: new Date().toISOString()
      },
      aiRegulations: filteredRegulations
    }, {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    console.error("GET /api/ai-regulations error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const body = await req.json();
    if (!body || !Array.isArray(body)) {
      throw new Error("Payload must be an array of AI regulations");
    }

    console.log(`Updating/saving ${body.length} AI regulations via API POST...`);
    await saveAiRegulations(body);

    return NextResponse.json({
      success: true,
      metadata: {
        total_saved: body.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("POST /api/ai-regulations error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
