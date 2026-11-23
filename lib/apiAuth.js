import { validateApiKey } from './db.js';

export async function resolveApiAccess(request) {
  let rawKey = '';
  try {
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      rawKey = authHeader.slice(7).trim();
    }
    if (!rawKey) {
      rawKey = (request.headers.get('x-api-key') || '').trim();
    }
    if (!rawKey && request.url) {
      const { searchParams } = new URL(request.url);
      rawKey = (searchParams.get('api_key') || '').trim();
    }
  } catch {
    rawKey = '';
  }

  const verified = await validateApiKey(rawKey);
  const tier = verified.valid ? verified.tier : 'free';
  const maxLimit = verified.valid ? verified.maxLimit : 15;

  return {
    tier,
    authenticated: Boolean(verified.valid),
    maxLimit,
    allowFullHistory: tier !== 'free',
    email: verified.email || null,
    responseHeaders: {
      'X-Sovereign-API-Version': '1.0',
      'X-Sovereign-Tier': tier,
      'X-Sovereign-Max-Items': String(maxLimit),
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300'
    }
  };
}
