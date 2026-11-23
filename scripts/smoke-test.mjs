const BASE_URL = (process.env.BASE_URL || 'https://app.sovdash.com').replace(/\/$/, '');

async function assertOk(path, checkFn = null) {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: 'follow' });
  const text = await res.text();
  if (res.status !== 200) {
    throw new Error(`Expected 200 for ${path}, got ${res.status}: ${text.slice(0, 200)}`);
  }
  if (checkFn) {
    await checkFn(res, text);
  }
  console.log(`PASS ${path} (200)`);
}

async function run() {
  const ssrRoutes = [
    '/',
    '/jurisdictions',
    '/jurisdiction/eu',
    '/compare',
    '/readiness',
    '/labs',
    '/compute',
    '/brief',
    '/watchlists',
    '/developers',
    '/methodology',
    '/whitepaper'
  ];

  for (const r of ssrRoutes) {
    await assertOk(r, (res) => {
      if (r === '/developers' && res.headers.get('x-frame-options') !== 'SAMEORIGIN') {
        throw new Error(`Expected X-Frame-Options: SAMEORIGIN on ${r}`);
      }
    });
  }

  for (const e of ['/embed/jurisdiction/eu', '/embed/jurisdiction/us?theme=light', '/embed/readiness']) {
    await assertOk(e, (res) => {
      if (res.headers.get('x-frame-options')) {
        throw new Error(`Expected no X-Frame-Options on ${e}`);
      }
      if (!String(res.headers.get('content-security-policy') || '').includes('frame-ancestors *')) {
        throw new Error(`Expected frame-ancestors * on ${e}`);
      }
    });
  }

  await assertOk('/api/v1/signals?limit=5', (_, text) => {
    const data = JSON.parse(text);
    if (!Array.isArray(data.signals) || data.signals.length === 0) throw new Error('Empty v1 signals');
  });

  await assertOk('/api/v1/signals?format=geojson&limit=5', (_, text) => {
    const geo = JSON.parse(text);
    if (geo.type !== 'FeatureCollection' || !Array.isArray(geo.features)) throw new Error('Invalid signals GeoJSON');
  });

  await assertOk('/api/v1/jurisdictions', (_, text) => {
    const data = JSON.parse(text);
    if ((data.jurisdictions?.length || 0) < 24 || !(data.jurisdictions[0]?.sagri?.score > 50)) {
      throw new Error('Invalid jurisdictions SAGRI payload');
    }
  });

  await assertOk('/api/v1/compute?format=geojson', (_, text) => {
    const geo = JSON.parse(text);
    if (geo.type !== 'FeatureCollection') throw new Error('Invalid compute GeoJSON');
  });

  await assertOk('/api/v1/export/dataset?format=datapackage', (_, text) => {
    const dp = JSON.parse(text);
    if (dp.profile !== 'tabular-data-package' || !dp.datasetSha256) throw new Error('Invalid datapackage');
  });

  // Copilot POST
  const copRes = await fetch(`${BASE_URL}/api/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Compare EU AI Act systemic risk obligations with California SB 53', jurisdiction: 'eu' })
  });
  const copData = await copRes.json();
  if (copRes.status !== 200 || !copData.citations?.length) {
    throw new Error(`Copilot check failed: ${copRes.status}`);
  }
  console.log(`PASS POST /api/copilot (${copData.citations.length} citations)`);

  // Watchlists dry-run & SSRF block
  const wlRes = await fetch(`${BASE_URL}/api/watchlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'test', jurisdictions: ['eu'], minSeverity: 2 })
  });
  if (wlRes.status !== 200) throw new Error(`Watchlist dry-run failed: ${wlRes.status}`);
  console.log('PASS POST /api/watchlists dry-run (200)');

  const ssrfRes = await fetch(`${BASE_URL}/api/watchlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerEmail: 'test@example.com', name: 'SSRF', webhookUrl: 'http://127.0.0.1:8080/hook' })
  });
  if (ssrfRes.status !== 400) throw new Error(`Expected 400 SSRF block, got ${ssrfRes.status}`);
  console.log('PASS POST /api/watchlists SSRF blocked (400)');

  console.log('ALL SMOKE CHECKS PASSED');
}

run().catch((err) => {
  console.error('SMOKE CHECK FAILED:', err);
  process.exit(1);
});
