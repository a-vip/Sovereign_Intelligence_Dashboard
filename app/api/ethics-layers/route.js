import { NextResponse } from 'next/server';
import { getEthicsLayerPayload } from '@/lib/ethicsOverlays';
import { getFrontierClusters, initDb } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const layer = String(searchParams.get('layer') || 'environmental').trim().toLowerCase();

  let liveClusters = [];
  if (layer === 'environmental') {
    try {
      await initDb();
      liveClusters = await getFrontierClusters(200).catch(() => []);
    } catch {
      liveClusters = [];
    }
  }

  const payload = getEthicsLayerPayload(layer, liveClusters);

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
