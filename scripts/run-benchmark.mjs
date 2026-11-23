import fs from 'fs';
import path from 'path';
import { classifyTechPolicySignal } from '../lib/policyClassifier.js';
import { geocodeText } from '../lib/geocoder.js';

const benchmarkPath = path.resolve('benchmarks/policy-geocoder-benchmark-200.json');
const outPath = path.resolve('benchmarks/latest-results.json');
const dataset = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let tp = 0;
let fp = 0;
let tn = 0;
let fn = 0;
let pillarCorrect = 0;
let pillarTotal = 0;
let geoLocatedCorrect = 0;
let geoLocatedTotal = 0;
let zeroFabCorrect = 0;
let zeroFabTotal = 0;

const failures = [];
const byPillar = {};

for (const row of dataset) {
  const cls = classifyTechPolicySignal(row.title, row.summary || '', row.sourceId || '');
  const geo = geocodeText(row.title, row.summary || '');

  const expected = Boolean(row.expectedRelevant);
  const predicted = Boolean(cls.isRelevant);

  if (expected && predicted) {
    tp++;
    if (row.expectedPillar) {
      pillarTotal++;
      if (!byPillar[row.expectedPillar]) byPillar[row.expectedPillar] = { total: 0, correct: 0 };
      byPillar[row.expectedPillar].total++;
      if (cls.domainPillar === row.expectedPillar) {
        pillarCorrect++;
        byPillar[row.expectedPillar].correct++;
      } else {
        failures.push({ id: row.id, issue: 'pillar_mismatch', expected: row.expectedPillar, got: cls.domainPillar, title: row.title });
      }
    }
  } else if (!expected && predicted) {
    fp++;
    failures.push({ id: row.id, issue: 'false_positive', pillar: cls.domainPillar, title: row.title });
  } else if (!expected && !predicted) {
    tn++;
  } else if (expected && !predicted) {
    fn++;
    failures.push({ id: row.id, issue: 'false_negative', reason: cls.reason, title: row.title });
  }

  if (expected) {
    if (row.expectedHasLocation === false) {
      zeroFabTotal++;
      if (!geo.hasExplicitLocation && geo.lat === null && geo.lon === null) {
        zeroFabCorrect++;
      } else {
        failures.push({ id: row.id, issue: 'location_fabricated', got: `${geo.location} (${geo.lat},${geo.lon})`, title: row.title });
      }
    } else if (typeof row.expectedLat === 'number' && typeof row.expectedLon === 'number') {
      geoLocatedTotal++;
      if (geo.hasExplicitLocation && geo.lat !== null && geo.lon !== null) {
        const dist = haversineKm(row.expectedLat, row.expectedLon, geo.lat, geo.lon);
        if (dist <= 200) {
          geoLocatedCorrect++;
        } else {
          failures.push({ id: row.id, issue: 'geo_distance_exceeded', distKm: Math.round(dist), got: geo.location, title: row.title });
        }
      } else {
        failures.push({ id: row.id, issue: 'geo_missing', title: row.title });
      }
    }
  }
}

const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
const trueNegativeRate = tn + fp > 0 ? tn / (tn + fp) : 0;
const pillarAccuracy = pillarTotal > 0 ? pillarCorrect / pillarTotal : 0;
const geocodingAccuracy = geoLocatedTotal > 0 ? geoLocatedCorrect / geoLocatedTotal : 0;
const zeroFabricationRate = zeroFabTotal > 0 ? zeroFabCorrect / zeroFabTotal : 0;

const summary = {
  benchmarkVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  totalItems: dataset.length,
  positiveItems: tp + fn,
  negativeItems: tn + fp,
  confusionMatrix: { tp, fp, tn, fn },
  metrics: {
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4)),
    trueNegativeRate: Number(trueNegativeRate.toFixed(4)),
    pillarAccuracy: Number(pillarAccuracy.toFixed(4)),
    geocodingAccuracy: Number(geocodingAccuracy.toFixed(4)),
    zeroFabricationRate: Number(zeroFabricationRate.toFixed(4))
  },
  counts: {
    pillarCorrect,
    pillarTotal,
    geoLocatedCorrect,
    geoLocatedTotal,
    zeroFabCorrect,
    zeroFabTotal
  },
  perPillar: Object.fromEntries(
    Object.entries(byPillar).map(([k, v]) => [k, { ...v, accuracy: Number((v.correct / v.total).toFixed(4)) }])
  ),
  failures: failures.slice(0, 15)
};

fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
