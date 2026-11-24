import { NextResponse } from 'next/server';
import { getAiRegulations, saveAiRegulations, initDb, getArchivedInfo, isEventArchived } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminAuth';
import { resolveJurisdictionForLocation } from '@/lib/jurisdictions';
import { SAGRI_BASE_SCORES } from '@/lib/governanceIndex';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

const US_STATE_CODES = {
  AL: 'Alabama, USA', AK: 'Alaska, USA', AZ: 'Arizona, USA', AR: 'Arkansas, USA', CA: 'California, USA',
  CO: 'Colorado, USA', CT: 'Connecticut, USA', DE: 'Delaware, USA', FL: 'Florida, USA', GA: 'Georgia, USA',
  HI: 'Hawaii, USA', ID: 'Idaho, USA', IL: 'Illinois, USA', IN: 'Indiana, USA', IA: 'Iowa, USA',
  KS: 'Kansas, USA', KY: 'Kentucky, USA', LA: 'Louisiana, USA', ME: 'Maine, USA', MD: 'Maryland, USA',
  MA: 'Massachusetts, USA', MI: 'Michigan, USA', MN: 'Minnesota, USA', MS: 'Mississippi, USA', MO: 'Missouri, USA',
  MT: 'Montana, USA', NE: 'Nebraska, USA', NV: 'Nevada, USA', NH: 'New Hampshire, USA', NJ: 'New Jersey, USA',
  NM: 'New Mexico, USA', NY: 'New York, USA', NC: 'North Carolina, USA', ND: 'North Dakota, USA', OH: 'Ohio, USA',
  OK: 'Oklahoma, USA', OR: 'Oregon, USA', PA: 'Pennsylvania, USA', RI: 'Rhode Island, USA', SC: 'South Carolina, USA',
  SD: 'South Dakota, USA', TN: 'Tennessee, USA', TX: 'Texas, USA', UT: 'Utah, USA', VT: 'Vermont, USA',
  VA: 'Virginia, USA', WA: 'Washington, USA', WV: 'West Virginia, USA', WI: 'Wisconsin, USA', WY: 'Wyoming, USA',
  DC: 'Washington D.C., USA'
};

const DEMONYM_OR_PREFIX_TO_JURISDICTION = [
  [/\btunisian?\b/i, 'Tunisia'],
  [/\balgerian?\b/i, 'Algeria'],
  [/\bangolan?\b/i, 'Angola'],
  [/\bargentin[ae]?\b/i, 'Argentina'],
  [/\bafrican union|auda-nepad|achpr/i, 'African Union'],
  [/\baustralian?\b/i, 'Australia'],
  [/\baustrian?\b/i, 'Austria'],
  [/\bbelgian?\b/i, 'Belgium'],
  [/\bbrazil(?:ian)?\b/i, 'Brazil'],
  [/\bcanad(?:a|ian)\b/i, 'Canada'],
  [/\bchile(?:an)?\b/i, 'Chile'],
  [/\bchin(?:a|ese)|cac|miit\b/i, 'China'],
  [/\bcolombian?\b/i, 'Colombia'],
  [/\bcosta rica\b/i, 'Costa Rica'],
  [/\bczech/i, 'Czechia'],
  [/\bdanish|denmark\b/i, 'Denmark'],
  [/\begypt(?:ian)?\b/i, 'Egypt'],
  [/\beston(?:ia|ian)\b/i, 'Estonia'],
  [/\bethiopia\b/i, 'Ethiopia'],
  [/\beuropean union|eu ai act|council of europe|coe\b/i, 'European Union'],
  [/\bfinland|finnish\b/i, 'Finland'],
  [/\bfranc(?:e|h)\b/i, 'France'],
  [/\bgerman(?:y)?\b/i, 'Germany'],
  [/\bghana(?:ian)?\b/i, 'Ghana'],
  [/\bgre(?:ece|ek)\b/i, 'Greece'],
  [/\bhungar(?:y|ian)\b/i, 'Hungary'],
  [/\bindia(?:n)?\b/i, 'India'],
  [/\bindonesia(?:n)?\b/i, 'Indonesia'],
  [/\bireland|irish\b/i, 'Ireland'],
  [/\bisrael(?:i)?\b/i, 'Israel'],
  [/\bital(?:y|ian)\b/i, 'Italy'],
  [/\bjapan(?:ese)?|meti\b/i, 'Japan'],
  [/\bkenya(?:n)?\b/i, 'Kenya'],
  [/\bmalaysia(?:n)?\b/i, 'Malaysia'],
  [/\bmauritius\b/i, 'Mauritius'],
  [/\bmexic(?:o|an)\b/i, 'Mexico'],
  [/\bmorocc(?:o|an)\b/i, 'Morocco'],
  [/\bnetherlands|dutch\b/i, 'Netherlands'],
  [/\bnew zealand\b/i, 'New Zealand'],
  [/\bnigeria(?:n)?\b/i, 'Nigeria'],
  [/\bnorw(?:ay|egian)\b/i, 'Norway'],
  [/\bperu(?:vian)?\b/i, 'Peru'],
  [/\bphilippines|filipino\b/i, 'Philippines'],
  [/\bpoland|polish\b/i, 'Poland'],
  [/\bportug(?:al|uese)\b/i, 'Portugal'],
  [/\bqatar(?:i)?\b/i, 'Qatar'],
  [/\brussia(?:n)?\b/i, 'Russia'],
  [/\brwanda(?:n)?\b/i, 'Rwanda'],
  [/\bsaudi arabia\b/i, 'Saudi Arabia'],
  [/\bsingapore(?:an)?|imda|pdpc\b/i, 'Singapore'],
  [/\bsouth africa(?:n)?\b/i, 'South Africa'],
  [/\bsouth korea|korean\b/i, 'South Korea'],
  [/\bspain|spanish\b/i, 'Spain'],
  [/\bswed(?:en|ish)\b/i, 'Sweden'],
  [/\bswitzerland|swiss\b/i, 'Switzerland'],
  [/\btaiwan(?:ese)?\b/i, 'Taiwan'],
  [/\bthailand|thai\b/i, 'Thailand'],
  [/\bturk(?:ey|iye|ish)\b/i, 'Turkey'],
  [/\bukrain(?:e|ian)\b/i, 'Ukraine'],
  [/\bunited arab emirates|uae|dubai|abu dhabi\b/i, 'United Arab Emirates'],
  [/\bunited kingdom|\buk\b|britain|british\b/i, 'United Kingdom'],
  [/\buruguay(?:an)?\b/i, 'Uruguay'],
  [/\bvietnam(?:ese)?\b/i, 'Vietnam'],
  [/\b(AB|SB|ACR)-\d+\b/, 'California, USA'],
  [/\b(HB|SB|HF|SF)-\d+\b/, 'United States (State)']
];

function inferJurisdiction(rawJurisdiction, rawTitle) {
  let j = String(rawJurisdiction || '').replace(/\u00a0/g, ' ').trim();
  const titleClean = String(rawTitle || '').replace(/\u00a0/g, ' ').replace(/^Global\s*[-–—:]\s*/i, '').trim();

  if (US_STATE_CODES[j.toUpperCase()]) {
    j = US_STATE_CODES[j.toUpperCase()];
  } else if (j.length > 60) {
    // Some KML rows stored the whole resolution name inside `jurisdiction`
    for (const [rx, label] of DEMONYM_OR_PREFIX_TO_JURISDICTION) {
      if (rx.test(j) || rx.test(titleClean)) {
        j = label;
        break;
      }
    }
  }

  if (!j || /^global$/i.test(j) || /^unknown$/i.test(j)) {
    for (const [rx, label] of DEMONYM_OR_PREFIX_TO_JURISDICTION) {
      if (rx.test(titleClean)) {
        j = label;
        break;
      }
    }
  }

  if (!j || /^global$/i.test(j)) {
    const prefix = titleClean.split(/\s+-\s+|\s+—\s+/)[0]?.trim();
    if (prefix && prefix.length >= 2 && prefix.length <= 36 && !/^(AB|SB|HB|HR)-?\d+/i.test(prefix)) {
      j = prefix;
    } else {
      j = 'Multilateral / International';
    }
  }

  return { cleanTitle: titleClean || rawTitle, cleanJurisdiction: j };
}

function normalizeRegulation(reg) {
  const { cleanTitle, cleanJurisdiction } = inferJurisdiction(reg.jurisdiction, reg.title);
  const rawDesc = String(reg.description || '')
    .replace(/\u00a0/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, ' ');

  // Extract first embedded URL if present
  const urlMatch = rawDesc.match(/https?:\/\/[^\s"'<>)\]]+/i);
  const extractedUrl = urlMatch ? urlMatch[0].replace(/[.,;:'")]+$/, '') : null;

  // Strip boilerplate text ("This maps the AI regulation tracking...") and extract legislation/citation text
  const withoutMapBoilerplate = rawDesc
    .replace(/This maps the AI regulation tracking for[\s\S]*$/i, '')
    .replace(/^Official Source \/ Legislation:\s*(?:Strategy:)?\s*/i, '')
    .trim();

  const excerptWithoutUrl = (extractedUrl ? withoutMapBoilerplate.replace(extractedUrl, '') : withoutMapBoilerplate)
    .replace(/^[•:\-\s]+|[•:\-\s]+$/g, '')
    .trim();

  const matchedJur = resolveJurisdictionForLocation(`${cleanJurisdiction} ${cleanTitle}`);
  const sagriEntry = matchedJur ? SAGRI_BASE_SCORES[matchedJur.slug] : null;

  let finalUrl = reg.url || extractedUrl;
  let urlType = finalUrl ? 'direct' : 'registry';
  if (!finalUrl) {
    if (/\(OECD\)/i.test(rawDesc)) {
      finalUrl = `https://oecd.ai/en/dashboards/policy-initiatives?q=${encodeURIComponent(cleanTitle.slice(0, 90))}`;
    } else {
      finalUrl = `https://oecd.ai/en/dashboards/policy-initiatives?q=${encodeURIComponent(`${cleanJurisdiction} ${cleanTitle}`.slice(0, 90))}`;
    }
  }

  const summary =
    excerptWithoutUrl.length >= 24
      ? excerptWithoutUrl
      : `${cleanTitle} is tracked under ${cleanJurisdiction} governance focusing on ${reg.area || 'General AI Policy'} (Status: ${reg.status || 'Policy'}). Official repository record linked below.`;

  return {
    ...reg,
    title: cleanTitle,
    jurisdiction: cleanJurisdiction,
    url: finalUrl,
    urlType,
    citationExcerpt: excerptWithoutUrl || null,
    summary,
    jurisdictionSlug: matchedJur?.slug || null,
    regulator: matchedJur?.regulator || null,
    bindingStatus: matchedJur?.posture || reg.status || 'Policy',
    sagriScore: sagriEntry?.overall ?? null
  };
}

export async function GET() {
  try {
    await initDb();
    let regulations = await getAiRegulations();

    if (regulations.length < 100) {
      const localFilePath = path.resolve('ai-regulations-local.json');
      if (fs.existsSync(localFilePath)) {
        try {
          const raw = fs.readFileSync(localFilePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (process.env.POSTGRES_URL) {
              await sql`TRUNCATE TABLE ai_regulations`;
            } else {
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
    const normalized = regulations
      .filter((reg) => !isEventArchived(reg, archivedInfo))
      .map(normalizeRegulation);

    return NextResponse.json({
      metadata: {
        total: normalized.length,
        directLinks: normalized.filter((r) => r.urlType === 'direct').length,
        timestamp: new Date().toISOString()
      },
      aiRegulations: normalized
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
  const auth = await verifyAdmin(req);
  if (auth.error) return auth.error;

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
