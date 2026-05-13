import { NextResponse } from 'next/server';
import { parseVault } from '@/lib/vaultParser';

export const dynamic = 'force-dynamic';

// In-memory cache to avoid re-parsing the entire vault on every poll
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 10000; // 10 seconds

export async function GET() {
  try {
    const now = Date.now();
    if (!cache || now - cacheTime > CACHE_TTL) {
      cache = parseVault();
      cacheTime = now;
    }

    // Strip heavy content field from documents to reduce payload
    const lite = {
      ...cache,
      documents: cache.documents.map(({ content, ...rest }) => rest),
    };

    return NextResponse.json(lite, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Vault parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse vault', details: error.message },
      { status: 500 }
    );
  }
}
