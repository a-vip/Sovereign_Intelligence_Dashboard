import { NextResponse } from 'next/server';
import { getEthicsLayerPayload } from '@/lib/ethicsOverlays';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const layer = String(searchParams.get('layer') || 'environmental').trim().toLowerCase();
  const payload = getEthicsLayerPayload(layer);

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid layer. Supported: environmental, supply_chain, biometric_welfare, ai_labor' },
      { status: 400 }
    );
  }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
  });
}
