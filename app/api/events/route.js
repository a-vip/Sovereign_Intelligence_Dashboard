import { NextResponse } from 'next/server';
import { initDb, saveEvents, getEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CACHE_TTL = 30000;
let routeCache = {};
let isDbReady = false;

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc?query=(artificial%20intelligence%20OR%20autonomous%20weapons%20OR%20drone%20OR%20%22military%20ai%22%20OR%20surveillance%20OR%20%22state%20violations%22)%20sourcelang:english&mode=artlist&maxrecords=250&format=json";
const GDELT_GEO_API = "https://api.gdeltproject.org/api/v2/geo/geo?query=(artificial%20intelligence%20OR%20autonomous%20weapons%20OR%20drone%20OR%20%22military%20ai%22%20OR%20surveillance%20OR%20%22state%20violations%22)&format=GeoJSON&maxpoints=500";

function getCategory(text) {
  if (!text) return 'Political';
  if (/strike|attack|bomb|missile|drone|kill|military|weapon|war|combat|troops|airstrike|explosion|clash|warfare|assault|targeting/i.test(text)) return 'Conflict';
  return 'Political';
}

function createId(u, t) {
  return (u || t || Math.random().toString()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

export async function GET(req) {
  console.log("API: GET Request received");
  try {
    const timespan = "24h";
    const currentTime = Date.now();

    if (!isDbReady) {
      console.log("API: Initializing DB");
      await initDb();
      isDbReady = true;
    }

    console.log("API: Fetching GDELT");
    const [geoRes, docRes] = await Promise.all([
      fetch(GDELT_GEO_API).catch(() => null),
      fetch(GDELT_DOC_API).catch(() => null)
    ]);

    let gdeltMarkers = [];
    if (geoRes?.ok) {
      const geo = await geoRes.json();
      gdeltMarkers = (geo.features || []).map(f => ({
        id: createId(f.properties?.url, f.properties?.name),
        lat: f.geometry?.coordinates?.[1],
        lon: f.geometry?.coordinates?.[0],
        name: f.properties?.name || 'Signal',
        category: getCategory(f.properties?.name),
        severity: 2,
        url: f.properties?.url || null,
        count: 1
      })).filter(m => m.lat && m.lon);
    }

    console.log("API: Fetching DB events");
    const dbEvents = await getEvents(timespan);

    const result = {
      markers: gdeltMarkers.slice(0, 200),
      events: dbEvents.slice(0, 100),
      lastUpdated: new Date().toISOString(),
      status: 'success'
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('CRITICAL API ERROR:', err);
    return NextResponse.json({ 
      status: 'error', 
      message: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}

export async function POST(req) {
  return NextResponse.json({ message: "POST disabled for debug" });
}
