import { NextResponse } from 'next/server';
import { initDb, saveEvents, getEvents } from '@/lib/db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_EXPIRY = 30000;
let routeCache = {};
let isDbInitialized = false;

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc?query=(artificial%20intelligence%20OR%20autonomous%20weapons%20OR%20drone%20OR%20%22military%20ai%22%20OR%20surveillance%20OR%20%22state%20violations%22)%20sourcelang:english&mode=artlist&maxrecords=250&format=json";
const GDELT_GEO_API = "https://api.gdeltproject.org/api/v2/geo/geo?query=(artificial%20intelligence%20OR%20autonomous%20weapons%20OR%20drone%20OR%20%22military%20ai%22%20OR%20surveillance%20OR%20%22state%20violations%22)&format=GeoJSON&maxpoints=500";

const CAT_KEYWORDS = {
  Conflict: /strike|attack|bomb|missile|drone|kill|military|weapon|war|combat|troops|airstrike|explosion|clash|warfare|assault|targeting/i,
  Humanitarian: /humanitarian|refugee|aid|famine|hunger|displacement|crisis|civilian|casualties|victims|rescue|relief/i,
  Disaster: /disaster|earthquake|flood|tsunami|hurricane|wildfire|storm|cyclone|accident|tremor|quake|eruption|seismic/i,
  Economic: /economic|trade|sanction|tariff|oil|energy|market|finance|invest|contract|billion|funding|gdp|inflation|rates|commerce/i,
  Surveillance: /surveillance|palantir|ice|nest|dhs|facial recognition|biometric|tracking|border control|police tech|cia|fbi|nsa|monitoring|spying|espionage/i,
};

function getCategory(text) {
  const t = text || '';
  for (const [cat, re] of Object.entries(CAT_KEYWORDS)) {
    if (re.test(t)) return cat;
  }
  return 'Political';
}

function getSeverity(text) {
  const t = (text || '').toLowerCase();
  if (/critical|emergency|urgent|massacre|genocide|nuclear|world war/i.test(t)) return 5;
  if (/severe|major|death|killed|destroyed|outbreak/i.test(t)) return 4;
  if (/alert|warning|clash|violation|threat/i.test(t)) return 3;
  if (/significant|important|update|report/i.test(t)) return 2;
  return 1;
}

function getQuality(text) {
  const t = (text || '').toLowerCase();
  let q = 1;
  if (/report|investigation|exclusive|analysis|violation|human rights|ethics/i.test(t)) q += 2;
  if (CAT_KEYWORDS.Conflict.test(t)) q += 1;
  return q;
}

function generateHashId(url, title) {
  const seed = url || title || Math.random().toString();
  return crypto.createHash('md5').update(seed).digest('hex');
}

function getDeterministicJitter(seedText, maxDegrees = 0.6) {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = seedText.charCodeAt(i) + ((hash << 5) - hash);
  }
  const jitterLat = ((hash & 0xFF) / 255.0 - 0.5) * maxDegrees;
  const jitterLon = (((hash >> 8) & 0xFF) / 255.0 - 0.5) * maxDegrees;
  return { lat: jitterLat, lon: jitterLon };
}

function getCountryCoords(country, title = '') {
  const c = (country || '').toLowerCase().trim();
  const t = (title || '').toLowerCase();
  
  // Safe token-boundary checker to prevent substring false positives (e.g. 'flood' matching US state abbreviation 'fl')
  const hasWord = (text, word) => {
    return new RegExp(`\\b${word}\\b`, 'i').test(text);
  };
  
  let baseCoords = null;
  let resolvedLocation = '';

  // 1. High-Fidelity City & Region Geolocation Scanner (Explicit Title Matches)
  if (t.includes('gaza') || t.includes('rafah') || t.includes('khan younis')) { baseCoords = { lat: 31.35, lon: 34.30 }; resolvedLocation = 'Gaza Strip'; }
  else if (t.includes('jerusalem') || t.includes('ramallah') || t.includes('west bank')) { baseCoords = { lat: 31.7683, lon: 35.2137 }; resolvedLocation = 'Jerusalem / West Bank'; }
  else if (t.includes('tel aviv') || t.includes('haifa') || t.includes('ben gurion')) { baseCoords = { lat: 32.0853, lon: 34.7818 }; resolvedLocation = 'Tel Aviv, Israel'; }
  else if (t.includes('beirut') || t.includes('sidon') || t.includes('tyre')) { baseCoords = { lat: 33.8938, lon: 35.5018 }; resolvedLocation = 'Beirut, Lebanon'; }
  else if (t.includes('damascus') || t.includes('homs') || t.includes('latakia') || t.includes('syria')) { baseCoords = { lat: 34.8021, lon: 38.9968 }; resolvedLocation = 'Damascus, Syria'; }
  else if (t.includes('lebanon')) { baseCoords = { lat: 33.8547, lon: 35.8623 }; resolvedLocation = 'Lebanon Region'; }
  else if (t.includes('nicosia') || t.includes('limassol') || t.includes('cyprus')) { baseCoords = { lat: 35.1856, lon: 33.3823 }; resolvedLocation = 'Nicosia, Cyprus'; }
  else if (t.includes('kiev') || t.includes('kyiv')) { baseCoords = { lat: 50.4501, lon: 30.5234 }; resolvedLocation = 'Kyiv, Ukraine'; }
  else if (t.includes('kharkiv') || t.includes('kharkov')) { baseCoords = { lat: 49.9935, lon: 36.2304 }; resolvedLocation = 'Kharkiv, Ukraine'; }
  else if (t.includes('odesa') || t.includes('odessa')) { baseCoords = { lat: 46.4825, lon: 30.7233 }; resolvedLocation = 'Odesa, Ukraine'; }
  else if (t.includes('lviv')) { baseCoords = { lat: 49.8397, lon: 24.0297 }; resolvedLocation = 'Lviv, Ukraine'; }
  else if (t.includes('crimea') || t.includes('sevastopol')) { baseCoords = { lat: 44.9521, lon: 34.1024 }; resolvedLocation = 'Crimea'; }
  else if (t.includes('moscow') || t.includes('kremlin')) { baseCoords = { lat: 55.7558, lon: 37.6173 }; resolvedLocation = 'Moscow, Russia'; }
  else if (t.includes('london')) { baseCoords = { lat: 51.5074, lon: -0.1278 }; resolvedLocation = 'London, United Kingdom'; }
  else if (t.includes('paris')) { baseCoords = { lat: 48.8566, lon: 2.3522 }; resolvedLocation = 'Paris, France'; }
  else if (t.includes('berlin')) { baseCoords = { lat: 51.1657, lon: 10.4515 }; resolvedLocation = 'Berlin, Germany'; }
  else if (t.includes('silicon valley') || t.includes('san francisco') || t.includes('palantir')) { baseCoords = { lat: 37.7749, lon: -122.4194 }; resolvedLocation = 'Silicon Valley, USA'; }
  else if (t.includes('tokyo')) { baseCoords = { lat: 35.6762, lon: 139.6503 }; resolvedLocation = 'Tokyo, Japan'; }
  else if (t.includes('beijing')) { baseCoords = { lat: 39.9042, lon: 116.4074 }; resolvedLocation = 'Beijing, China'; }
  else if (t.includes('taipei') || t.includes('taiwan')) { baseCoords = { lat: 25.0330, lon: 121.5654 }; resolvedLocation = 'Taipei, Taiwan'; }
  else if (t.includes('israel') || t.includes('gaza') || t.includes('palestine')) { baseCoords = { lat: 31.0461, lon: 34.8516 }; resolvedLocation = 'Israel/Palestine'; }

  // 2. High-Precision Title-Based Country Name Match (Traps global articles reporting specific countries)
  if (!baseCoords) {
    if (t.includes('egypt')) { baseCoords = { lat: 26.8206, lon: 30.8025 }; resolvedLocation = 'Egypt'; }
    else if (t.includes('angola')) { baseCoords = { lat: -11.2027, lon: 17.8739 }; resolvedLocation = 'Angola'; }
    else if (t.includes('russia')) { baseCoords = { lat: 61.5240, lon: 105.3188 }; resolvedLocation = 'Russia'; }
    else if (t.includes('japan')) { baseCoords = { lat: 36.2048, lon: 138.2529 }; resolvedLocation = 'Japan'; }
    else if (t.includes('germany')) { baseCoords = { lat: 51.1657, lon: 10.4515 }; resolvedLocation = 'Germany'; }
    else if (t.includes('france')) { baseCoords = { lat: 46.2276, lon: 2.2137 }; resolvedLocation = 'France'; }
    else if (t.includes('united kingdom') || t.includes('britain') || hasWord(t, 'uk')) { baseCoords = { lat: 55.3781, lon: -3.4360 }; resolvedLocation = 'United Kingdom'; }
    else if (t.includes('canada')) { baseCoords = { lat: 56.1304, lon: -106.3468 }; resolvedLocation = 'Canada'; }
    else if (t.includes('italy')) { baseCoords = { lat: 41.8719, lon: 12.5674 }; resolvedLocation = 'Italy'; }
    else if (t.includes('spain')) { baseCoords = { lat: 40.4637, lon: -3.7492 }; resolvedLocation = 'Spain'; }
    else if (t.includes('switzerland')) { baseCoords = { lat: 46.8182, lon: 8.2275 }; resolvedLocation = 'Switzerland'; }
    else if (t.includes('sweden')) { baseCoords = { lat: 60.1282, lon: 18.6435 }; resolvedLocation = 'Sweden'; }
    else if (t.includes('norway')) { baseCoords = { lat: 60.4720, lon: 8.4689 }; resolvedLocation = 'Norway'; }
    else if (t.includes('ukraine')) { baseCoords = { lat: 48.3794, lon: 31.1656 }; resolvedLocation = 'Ukraine'; }
    else if (t.includes('yemen')) { baseCoords = { lat: 15.5527, lon: 48.5164 }; resolvedLocation = 'Yemen'; }
    else if (t.includes('iran')) { baseCoords = { lat: 32.4279, lon: 53.6880 }; resolvedLocation = 'Iran'; }
    else if (t.includes('iraq')) { baseCoords = { lat: 33.2232, lon: 43.6793 }; resolvedLocation = 'Iraq'; }
    else if (t.includes('saudi')) { baseCoords = { lat: 23.8859, lon: 45.0792 }; resolvedLocation = 'Saudi Arabia'; }
    else if (t.includes('india')) { baseCoords = { lat: 20.5937, lon: 78.9629 }; resolvedLocation = 'India'; }
    else if (t.includes('australia')) { baseCoords = { lat: -25.2744, lon: 133.7751 }; resolvedLocation = 'Australia'; }
    else if (t.includes('chad')) { baseCoords = { lat: 15.4542, lon: 18.7322 }; resolvedLocation = 'Chad'; }
    else if (t.includes('congo') || t.includes('drc')) { baseCoords = { lat: -4.0383, lon: 21.7587 }; resolvedLocation = 'Dem. Rep. Congo'; }
    else if (t.includes('libya')) { baseCoords = { lat: 26.3351, lon: 17.2283 }; resolvedLocation = 'Libya'; }
    else if (t.includes('venezuela')) { baseCoords = { lat: 6.4238, lon: -66.5897 }; resolvedLocation = 'Venezuela'; }
    else if (t.includes('turkey')) { baseCoords = { lat: 38.9637, lon: 35.2433 }; resolvedLocation = 'Turkey'; }
    else if (t.includes('mexico')) { baseCoords = { lat: 23.6345, lon: -102.5528 }; resolvedLocation = 'Mexico'; }
    else if (t.includes('pakistan')) { baseCoords = { lat: 30.3753, lon: 69.3451 }; resolvedLocation = 'Pakistan'; }
    else if (t.includes('afghanistan')) { baseCoords = { lat: 33.9391, lon: 67.7100 }; resolvedLocation = 'Afghanistan'; }
    else if (t.includes('philippines')) { baseCoords = { lat: 12.8797, lon: 121.7740 }; resolvedLocation = 'Philippines'; }
    else if (t.includes('indonesia')) { baseCoords = { lat: -0.7893, lon: 113.9213 }; resolvedLocation = 'Indonesia'; }
    else if (t.includes('colombia')) { baseCoords = { lat: 4.5709, lon: -72.9566 }; resolvedLocation = 'Colombia'; }
    else if (t.includes('sudan')) { baseCoords = { lat: 12.8628, lon: 30.2176 }; resolvedLocation = 'Sudan'; }
    else if (t.includes('somalia')) { baseCoords = { lat: 5.1521, lon: 46.1996 }; resolvedLocation = 'Somalia'; }
    else if (t.includes('kenya')) { baseCoords = { lat: -1.2921, lon: 36.8219 }; resolvedLocation = 'Kenya'; }
    else if (t.includes('nigeria')) { baseCoords = { lat: 9.0820, lon: 8.6753 }; resolvedLocation = 'Nigeria'; }
    else if (t.includes('malaysia')) { baseCoords = { lat: 4.2105, lon: 101.9758 }; resolvedLocation = 'Malaysia'; }
    else if (t.includes('thailand')) { baseCoords = { lat: 15.8700, lon: 100.9925 }; resolvedLocation = 'Thailand'; }
    else if (t.includes('vietnam')) { baseCoords = { lat: 14.0583, lon: 108.2772 }; resolvedLocation = 'Vietnam'; }
    else if (t.includes('greece')) { baseCoords = { lat: 39.0742, lon: 21.8243 }; resolvedLocation = 'Greece'; }
    else if (t.includes('brazil')) { baseCoords = { lat: -14.2350, lon: -51.9253 }; resolvedLocation = 'Brazil'; }
    else if (t.includes('poland')) { baseCoords = { lat: 51.9194, lon: 19.1451 }; resolvedLocation = 'Poland'; }
    else if (t.includes('netherlands') || t.includes('holland')) { baseCoords = { lat: 52.1326, lon: 5.2913 }; resolvedLocation = 'Netherlands'; }
    else if (t.includes('belgium')) { baseCoords = { lat: 50.5039, lon: 4.4699 }; resolvedLocation = 'Belgium'; }
    else if (t.includes('tunisia')) { baseCoords = { lat: 33.8869, lon: 9.5375 }; resolvedLocation = 'Tunisia'; }
    else if (t.includes('uganda')) { baseCoords = { lat: 1.3733, lon: 32.2903 }; resolvedLocation = 'Uganda'; }
    else if (t.includes('rwanda')) { baseCoords = { lat: -1.9403, lon: 29.8739 }; resolvedLocation = 'Rwanda'; }
    else if (t.includes('morocco')) { baseCoords = { lat: 31.7917, lon: -7.0926 }; resolvedLocation = 'Morocco'; }
    else if (t.includes('algeria')) { baseCoords = { lat: 28.0339, lon: 1.6596 }; resolvedLocation = 'Algeria'; }
    else if (t.includes('ethiopia')) { baseCoords = { lat: 9.1450, lon: 40.4897 }; resolvedLocation = 'Ethiopia'; }
    else if (t.includes('tanzania')) { baseCoords = { lat: -6.3690, lon: 34.8888 }; resolvedLocation = 'Tanzania'; }
    else if (t.includes('south africa')) { baseCoords = { lat: -30.5595, lon: 22.9375 }; resolvedLocation = 'South Africa'; }
    else if (t.includes('south sudan')) { baseCoords = { lat: 6.8770, lon: 31.3070 }; resolvedLocation = 'South Sudan'; }
    else if (t.includes('niger')) { baseCoords = { lat: 17.6078, lon: 8.0817 }; resolvedLocation = 'Niger'; }
    else if (t.includes('mali')) { baseCoords = { lat: 17.5707, lon: -3.9962 }; resolvedLocation = 'Mali'; }
    else if (t.includes('jordan')) { baseCoords = { lat: 30.5852, lon: 36.2384 }; resolvedLocation = 'Jordan'; }
    else if (t.includes('united arab emirates') || t.includes('uae') || t.includes('dubai')) { baseCoords = { lat: 23.4241, lon: 53.8478 }; resolvedLocation = 'United Arab Emirates'; }
    else if (t.includes('qatar')) { baseCoords = { lat: 25.3548, lon: 51.1839 }; resolvedLocation = 'Qatar'; }
    else if (t.includes('kuwait')) { baseCoords = { lat: 29.3759, lon: 47.9774 }; resolvedLocation = 'Kuwait'; }
    else if (t.includes('bangladesh')) { baseCoords = { lat: 23.6850, lon: 90.3563 }; resolvedLocation = 'Bangladesh'; }
    else if (t.includes('myanmar') || t.includes('burma')) { baseCoords = { lat: 21.9162, lon: 95.9560 }; resolvedLocation = 'Myanmar'; }
    else if (t.includes('nepal')) { baseCoords = { lat: 28.3949, lon: 84.1240 }; resolvedLocation = 'Nepal'; }
    else if (t.includes('sri lanka')) { baseCoords = { lat: 7.8731, lon: 80.7718 }; resolvedLocation = 'Sri Lanka'; }
    else if (t.includes('korea')) { baseCoords = { lat: 35.9078, lon: 127.7669 }; resolvedLocation = 'Korea'; }
    else if (t.includes('laos')) { baseCoords = { lat: 19.8563, lon: 102.4955 }; resolvedLocation = 'Laos'; }
    else if (t.includes('cambodia')) { baseCoords = { lat: 12.5657, lon: 104.9910 }; resolvedLocation = 'Cambodia'; }
    else if (t.includes('singapore')) { baseCoords = { lat: 1.3521, lon: 103.8198 }; resolvedLocation = 'Singapore'; }
    else if (t.includes('new zealand') || hasWord(t, 'nz')) { baseCoords = { lat: -40.9006, lon: 174.8860 }; resolvedLocation = 'New Zealand'; }
    else if (t.includes('belarus')) { baseCoords = { lat: 53.7098, lon: 27.9534 }; resolvedLocation = 'Belarus'; }
    else if (t.includes('armenia')) { baseCoords = { lat: 40.0691, lon: 45.0382 }; resolvedLocation = 'Armenia'; }
    else if (t.includes('azerbaijan')) { baseCoords = { lat: 40.1431, lon: 47.5769 }; resolvedLocation = 'Azerbaijan'; }
    else if (t.includes('ireland')) { baseCoords = { lat: 53.4129, lon: -8.2439 }; resolvedLocation = 'Ireland'; }
    else if (t.includes('austria')) { baseCoords = { lat: 47.5162, lon: 14.5501 }; resolvedLocation = 'Austria'; }
    else if (t.includes('czechia') || t.includes('czech republic')) { baseCoords = { lat: 49.8175, lon: 15.4730 }; resolvedLocation = 'Czechia'; }
    else if (t.includes('slovakia')) { baseCoords = { lat: 48.6690, lon: 19.6990 }; resolvedLocation = 'Slovakia'; }
    else if (t.includes('hungary')) { baseCoords = { lat: 47.1625, lon: 19.5033 }; resolvedLocation = 'Hungary'; }
    else if (t.includes('romania')) { baseCoords = { lat: 45.9432, lon: 24.9668 }; resolvedLocation = 'Romania'; }
    else if (t.includes('bulgaria')) { baseCoords = { lat: 42.7339, lon: 25.4858 }; resolvedLocation = 'Bulgaria'; }
    else if (t.includes('croatia')) { baseCoords = { lat: 45.1000, lon: 15.2000 }; resolvedLocation = 'Croatia'; }
    else if (t.includes('serbia')) { baseCoords = { lat: 44.0165, lon: 21.0059 }; resolvedLocation = 'Serbia'; }
    else if (t.includes('kosovo')) { baseCoords = { lat: 42.6026, lon: 20.9030 }; resolvedLocation = 'Kosovo'; }
    else if (t.includes('albania')) { baseCoords = { lat: 41.1533, lon: 20.1683 }; resolvedLocation = 'Albania'; }
    else if (t.includes('macedonia')) { baseCoords = { lat: 41.6086, lon: 21.7453 }; resolvedLocation = 'Macedonia'; }
    else if (t.includes('denmark')) { baseCoords = { lat: 56.2639, lon: 9.5018 }; resolvedLocation = 'Denmark'; }
    else if (t.includes('finland')) { baseCoords = { lat: 61.9241, lon: 25.7482 }; resolvedLocation = 'Finland'; }
    else if (t.includes('estonia')) { baseCoords = { lat: 58.5953, lon: 25.0136 }; resolvedLocation = 'Estonia'; }
    else if (t.includes('latvia')) { baseCoords = { lat: 56.8796, lon: 24.6032 }; resolvedLocation = 'Latvia'; }
    else if (t.includes('lithuania')) { baseCoords = { lat: 55.1694, lon: 23.8813 }; resolvedLocation = 'Lithuania'; }
    else if (t.includes('portugal')) { baseCoords = { lat: 39.3999, lon: -8.2245 }; resolvedLocation = 'Portugal'; }
    else if (t.includes('argentina')) { baseCoords = { lat: -38.4161, lon: -63.6167 }; resolvedLocation = 'Argentina'; }
    else if (t.includes('peru')) { baseCoords = { lat: -9.1899, lon: -75.0152 }; resolvedLocation = 'Peru'; }
    else if (t.includes('chile')) { baseCoords = { lat: -35.6751, lon: -71.5430 }; resolvedLocation = 'Chile'; }
    else if (t.includes('ecuador')) { baseCoords = { lat: -1.8312, lon: -78.1834 }; resolvedLocation = 'Ecuador'; }
    else if (t.includes('bolivia')) { baseCoords = { lat: -16.2902, lon: -63.5887 }; resolvedLocation = 'Bolivia'; }
    else if (t.includes('paraguay')) { baseCoords = { lat: -23.4425, lon: -58.4438 }; resolvedLocation = 'Paraguay'; }
    else if (t.includes('uruguay')) { baseCoords = { lat: -32.5228, lon: -55.7658 }; resolvedLocation = 'Uruguay'; }
    else if (t.includes('cuba')) { baseCoords = { lat: 21.5218, lon: -77.7812 }; resolvedLocation = 'Cuba'; }
    else if (t.includes('haiti')) { baseCoords = { lat: 18.9712, lon: -72.2852 }; resolvedLocation = 'Haiti'; }
    else if (t.includes('dominican republic')) { baseCoords = { lat: 18.7357, lon: -70.1627 }; resolvedLocation = 'Dominican Republic'; }
    else if (t.includes('panama')) { baseCoords = { lat: 8.5380, lon: -80.7821 }; resolvedLocation = 'Panama'; }
    else if (t.includes('solomon islands')) { baseCoords = { lat: -9.6457, lon: 160.1562 }; resolvedLocation = 'Solomon Islands'; }
    else if (t.includes('united states') || hasWord(t, 'us') || hasWord(t, 'usa') || t.includes('trump') || t.includes('hegseth') || t.includes('biden') || t.includes('white house') || t.includes('pentagon') || t.includes('congress') || t.includes('dnc') || t.includes('rnc') || t.includes('senate') || t.includes('supreme court') || t.includes('fbi') || t.includes('cia') || t.includes('nsa') || t.includes('dhs') || t.includes('ice') || t.includes('american') || t.includes('america')) { baseCoords = { lat: 37.0902, lon: -95.7129 }; resolvedLocation = 'United States'; }

  }

  // 3. Country-Code Secondary Fallback Match (Only if title did NOT specify any country keywords)
  if (!baseCoords) {
    if (c === 'jp') { baseCoords = { lat: 36.2048, lon: 138.2529 }; resolvedLocation = 'Japan'; }
    else if (c === 'de') { baseCoords = { lat: 51.1657, lon: 10.4515 }; resolvedLocation = 'Germany'; }
    else if (c === 'fr') { baseCoords = { lat: 46.2276, lon: 2.2137 }; resolvedLocation = 'France'; }
    else if (c === 'uk' || c === 'gb') { baseCoords = { lat: 55.3781, lon: -3.4360 }; resolvedLocation = 'United Kingdom'; }
    else if (c === 'ca') { baseCoords = { lat: 56.1304, lon: -106.3468 }; resolvedLocation = 'Canada'; }
    else if (c === 'it') { baseCoords = { lat: 41.8719, lon: 12.5674 }; resolvedLocation = 'Italy'; }
    else if (c === 'es') { baseCoords = { lat: 40.4637, lon: -3.7492 }; resolvedLocation = 'Spain'; }
    else if (c === 'ch') { baseCoords = { lat: 46.8182, lon: 8.2275 }; resolvedLocation = 'Switzerland'; }
    else if (c === 'se') { baseCoords = { lat: 60.1282, lon: 18.6435 }; resolvedLocation = 'Sweden'; }
    else if (c === 'no') { baseCoords = { lat: 60.4720, lon: 8.4689 }; resolvedLocation = 'Norway'; }
    else if (c === 'ua') { baseCoords = { lat: 48.3794, lon: 31.1656 }; resolvedLocation = 'Ukraine'; }
    else if (c === 'ye') { baseCoords = { lat: 15.5527, lon: 48.5164 }; resolvedLocation = 'Yemen'; }
    else if (c === 'ir') { baseCoords = { lat: 32.4279, lon: 53.6880 }; resolvedLocation = 'Iran'; }
    else if (c === 'iq') { baseCoords = { lat: 33.2232, lon: 43.6793 }; resolvedLocation = 'Iraq'; }
    else if (c === 'sa') { baseCoords = { lat: 23.8859, lon: 45.0792 }; resolvedLocation = 'Saudi Arabia'; }
    else if (c === 'in') { baseCoords = { lat: 20.5937, lon: 78.9629 }; resolvedLocation = 'India'; }
    else if (c === 'au') { baseCoords = { lat: -25.2744, lon: 133.7751 }; resolvedLocation = 'Australia'; }
    else if (c === 'td') { baseCoords = { lat: 15.4542, lon: 18.7322 }; resolvedLocation = 'Chad'; }
    else if (c === 'cd') { baseCoords = { lat: -4.0383, lon: 21.7587 }; resolvedLocation = 'Dem. Rep. Congo'; }
    else if (c === 'ly') { baseCoords = { lat: 26.3351, lon: 17.2283 }; resolvedLocation = 'Libya'; }
    else if (c === 've') { baseCoords = { lat: 6.4238, lon: -66.5897 }; resolvedLocation = 'Venezuela'; }
    else if (c === 'eg') { baseCoords = { lat: 26.8206, lon: 30.8025 }; resolvedLocation = 'Egypt'; }
    else if (c === 'tr') { baseCoords = { lat: 38.9637, lon: 35.2433 }; resolvedLocation = 'Turkey'; }
    else if (c === 'mx') { baseCoords = { lat: 23.6345, lon: -102.5528 }; resolvedLocation = 'Mexico'; }
    else if (c === 'pk') { baseCoords = { lat: 30.3753, lon: 69.3451 }; resolvedLocation = 'Pakistan'; }
    else if (c === 'af') { baseCoords = { lat: 33.9391, lon: 67.7100 }; resolvedLocation = 'Afghanistan'; }
    else if (c === 'ph') { baseCoords = { lat: 12.8797, lon: 121.7740 }; resolvedLocation = 'Philippines'; }
    else if (c === 'id') { baseCoords = { lat: -0.7893, lon: 113.9213 }; resolvedLocation = 'Indonesia'; }
    else if (c === 'co') { baseCoords = { lat: 4.5709, lon: -72.9566 }; resolvedLocation = 'Colombia'; }
    else if (c === 'sd') { baseCoords = { lat: 12.8628, lon: 30.2176 }; resolvedLocation = 'Sudan'; }
    else if (c === 'so') { baseCoords = { lat: 5.1521, lon: 46.1996 }; resolvedLocation = 'Somalia'; }
    else if (c === 'ke') { baseCoords = { lat: -1.2921, lon: 36.8219 }; resolvedLocation = 'Kenya'; }
    else if (c === 'ng') { baseCoords = { lat: 9.0820, lon: 8.6753 }; resolvedLocation = 'Nigeria'; }
    else if (c === 'my') { baseCoords = { lat: 4.2105, lon: 101.9758 }; resolvedLocation = 'Malaysia'; }
    else if (c === 'th') { baseCoords = { lat: 15.8700, lon: 100.9925 }; resolvedLocation = 'Thailand'; }
    else if (c === 'vn') { baseCoords = { lat: 14.0583, lon: 108.2772 }; resolvedLocation = 'Vietnam'; }
    else if (c === 'gr') { baseCoords = { lat: 39.0742, lon: 21.8243 }; resolvedLocation = 'Greece'; }
    else if (c === 'br') { baseCoords = { lat: -14.2350, lon: -51.9253 }; resolvedLocation = 'Brazil'; }
    else if (c === 'pl') { baseCoords = { lat: 51.9194, lon: 19.1451 }; resolvedLocation = 'Poland'; }
    else if (c === 'nl') { baseCoords = { lat: 52.1326, lon: 5.2913 }; resolvedLocation = 'Netherlands'; }
    else if (c === 'be') { baseCoords = { lat: 50.5039, lon: 4.4699 }; resolvedLocation = 'Belgium'; }
    else if (c === 'tn') { baseCoords = { lat: 33.8869, lon: 9.5375 }; resolvedLocation = 'Tunisia'; }
    else if (c === 'ug') { baseCoords = { lat: 1.3733, lon: 32.2903 }; resolvedLocation = 'Uganda'; }
    else if (c === 'rw') { baseCoords = { lat: -1.9403, lon: 29.8739 }; resolvedLocation = 'Rwanda'; }
    else if (c === 'ma') { baseCoords = { lat: 31.7917, lon: -7.0926 }; resolvedLocation = 'Morocco'; }
    else if (c === 'dz') { baseCoords = { lat: 28.0339, lon: 1.6596 }; resolvedLocation = 'Algeria'; }
    else if (c === 'et') { baseCoords = { lat: 9.1450, lon: 40.4897 }; resolvedLocation = 'Ethiopia'; }
    else if (c === 'tz') { baseCoords = { lat: -6.3690, lon: 34.8888 }; resolvedLocation = 'Tanzania'; }
    else if (c === 'za') { baseCoords = { lat: -30.5595, lon: 22.9375 }; resolvedLocation = 'South Africa'; }
    else if (c === 'ss') { baseCoords = { lat: 6.8770, lon: 31.3070 }; resolvedLocation = 'South Sudan'; }
    else if (c === 'ne') { baseCoords = { lat: 17.6078, lon: 8.0817 }; resolvedLocation = 'Niger'; }
    else if (c === 'ml') { baseCoords = { lat: 17.5707, lon: -3.9962 }; resolvedLocation = 'Mali'; }
    else if (c === 'jo') { baseCoords = { lat: 30.5852, lon: 36.2384 }; resolvedLocation = 'Jordan'; }
    else if (c === 'ae') { baseCoords = { lat: 23.4241, lon: 53.8478 }; resolvedLocation = 'United Arab Emirates'; }
    else if (c === 'qa') { baseCoords = { lat: 25.3548, lon: 51.1839 }; resolvedLocation = 'Qatar'; }
    else if (c === 'kw') { baseCoords = { lat: 29.3759, lon: 47.9774 }; resolvedLocation = 'Kuwait'; }
    else if (c === 'bd') { baseCoords = { lat: 23.6850, lon: 90.3563 }; resolvedLocation = 'Bangladesh'; }
    else if (c === 'mm') { baseCoords = { lat: 21.9162, lon: 95.9560 }; resolvedLocation = 'Myanmar'; }
    else if (c === 'np') { baseCoords = { lat: 28.3949, lon: 84.1240 }; resolvedLocation = 'Nepal'; }
    else if (c === 'lk') { baseCoords = { lat: 7.8731, lon: 80.7718 }; resolvedLocation = 'Sri Lanka'; }
    else if (c === 'kr' || c === 'kp') { baseCoords = { lat: 35.9078, lon: 127.7669 }; resolvedLocation = 'Korea'; }
    else if (c === 'la') { baseCoords = { lat: 19.8563, lon: 102.4955 }; resolvedLocation = 'Laos'; }
    else if (c === 'kh') { baseCoords = { lat: 12.5657, lon: 104.9910 }; resolvedLocation = 'Cambodia'; }
    else if (c === 'sg') { baseCoords = { lat: 1.3521, lon: 103.8198 }; resolvedLocation = 'Singapore'; }
    else if (c === 'nz') { baseCoords = { lat: -40.9006, lon: 174.8860 }; resolvedLocation = 'New Zealand'; }
    else if (c === 'by') { baseCoords = { lat: 53.7098, lon: 27.9534 }; resolvedLocation = 'Belarus'; }
    else if (c === 'ge') { baseCoords = { lat: 42.3154, lon: 43.3569 }; resolvedLocation = 'Georgia (Country)'; }
    else if (c === 'am') { baseCoords = { lat: 40.0691, lon: 45.0382 }; resolvedLocation = 'Armenia'; }
    else if (c === 'az') { baseCoords = { lat: 40.1431, lon: 47.5769 }; resolvedLocation = 'Azerbaijan'; }
    else if (c === 'ie') { baseCoords = { lat: 53.4129, lon: -8.2439 }; resolvedLocation = 'Ireland'; }
    else if (c === 'at') { baseCoords = { lat: 47.5162, lon: 14.5501 }; resolvedLocation = 'Austria'; }
    else if (c === 'cz') { baseCoords = { lat: 49.8175, lon: 15.4730 }; resolvedLocation = 'Czechia'; }
    else if (c === 'sk') { baseCoords = { lat: 48.6690, lon: 19.6990 }; resolvedLocation = 'Slovakia'; }
    else if (c === 'hu') { baseCoords = { lat: 47.1625, lon: 19.5033 }; resolvedLocation = 'Hungary'; }
    else if (c === 'ro') { baseCoords = { lat: 45.9432, lon: 24.9668 }; resolvedLocation = 'Romania'; }
    else if (c === 'bg') { baseCoords = { lat: 42.7339, lon: 25.4858 }; resolvedLocation = 'Bulgaria'; }
    else if (c === 'hr') { baseCoords = { lat: 45.1000, lon: 15.2000 }; resolvedLocation = 'Croatia'; }
    else if (c === 'rs') { baseCoords = { lat: 44.0165, lon: 21.0059 }; resolvedLocation = 'Serbia'; }
    else if (c === 'xk') { baseCoords = { lat: 42.6026, lon: 20.9030 }; resolvedLocation = 'Kosovo'; }
    else if (c === 'al') { baseCoords = { lat: 41.1533, lon: 20.1683 }; resolvedLocation = 'Albania'; }
    else if (c === 'mk') { baseCoords = { lat: 41.6086, lon: 21.7453 }; resolvedLocation = 'Macedonia'; }
    else if (c === 'dk') { baseCoords = { lat: 56.2639, lon: 9.5018 }; resolvedLocation = 'Denmark'; }
    else if (c === 'fi') { baseCoords = { lat: 61.9241, lon: 25.7482 }; resolvedLocation = 'Finland'; }
    else if (c === 'ee') { baseCoords = { lat: 58.5953, lon: 25.0136 }; resolvedLocation = 'Estonia'; }
    else if (c === 'lv') { baseCoords = { lat: 56.8796, lon: 24.6032 }; resolvedLocation = 'Latvia'; }
    else if (c === 'lt') { baseCoords = { lat: 55.1694, lon: 23.8813 }; resolvedLocation = 'Lithuania'; }
    else if (c === 'pt') { baseCoords = { lat: 39.3999, lon: -8.2245 }; resolvedLocation = 'Portugal'; }
    else if (c === 'ar') { baseCoords = { lat: -38.4161, lon: -63.6167 }; resolvedLocation = 'Argentina'; }
    else if (c === 'pe') { baseCoords = { lat: -9.1899, lon: -75.0152 }; resolvedLocation = 'Peru'; }
    else if (c === 'cl') { baseCoords = { lat: -35.6751, lon: -71.5430 }; resolvedLocation = 'Chile'; }
    else if (c === 'ec') { baseCoords = { lat: -1.8312, lon: -78.1834 }; resolvedLocation = 'Ecuador'; }
    else if (c === 'bo') { baseCoords = { lat: -16.2902, lon: -63.5887 }; resolvedLocation = 'Bolivia'; }
    else if (c === 'py') { baseCoords = { lat: -23.4425, lon: -58.4438 }; resolvedLocation = 'Paraguay'; }
    else if (c === 'uy') { baseCoords = { lat: -32.5228, lon: -55.7658 }; resolvedLocation = 'Uruguay'; }
    else if (c === 'cu') { baseCoords = { lat: 21.5218, lon: -77.7812 }; resolvedLocation = 'Cuba'; }
    else if (c === 'ht') { baseCoords = { lat: 18.9712, lon: -72.2852 }; resolvedLocation = 'Haiti'; }
    else if (c === 'do') { baseCoords = { lat: 18.7357, lon: -70.1627 }; resolvedLocation = 'Dominican Republic'; }
    else if (c === 'pa') { baseCoords = { lat: 8.5380, lon: -80.7821 }; resolvedLocation = 'Panama'; }
    else if (c === 'sb') { baseCoords = { lat: -9.6457, lon: 160.1562 }; resolvedLocation = 'Solomon Islands'; }
    else if (c === 'ru') { baseCoords = { lat: 61.5240, lon: 105.3188 }; resolvedLocation = 'Russia'; }
    else if (c === 'ao') { baseCoords = { lat: -11.2027, lon: 17.8739 }; resolvedLocation = 'Angola'; }
    else if (c === 'us') { baseCoords = { lat: 37.0902, lon: -95.7129 }; resolvedLocation = 'United States'; }
  }

  // 4. High-Fidelity US States Classifiers (to distribute US events accurately instead of stacking in Kansas)
  if (!baseCoords) {
    if (t.includes('texas') || hasWord(t, 'tx')) { baseCoords = { lat: 31.9686, lon: -99.9018 }; resolvedLocation = 'Texas, USA'; }
    else if (t.includes('california') || hasWord(t, 'ca')) { baseCoords = { lat: 36.7783, lon: -119.4179 }; resolvedLocation = 'California, USA'; }
    else if (t.includes('arizona') || hasWord(t, 'az')) { baseCoords = { lat: 34.0489, lon: -111.0937 }; resolvedLocation = 'Arizona, USA'; }
    else if (t.includes('georgia') || hasWord(t, 'ga')) { baseCoords = { lat: 32.1656, lon: -82.9001 }; resolvedLocation = 'Georgia, USA'; }
    else if (t.includes('new york') || hasWord(t, 'ny')) { baseCoords = { lat: 43.2994, lon: -74.2179 }; resolvedLocation = 'New York, USA'; }
    else if (t.includes('washington') || hasWord(t, 'dc') || hasWord(t, 'd.c.')) { baseCoords = { lat: 38.9072, lon: -77.0369 }; resolvedLocation = 'Washington D.C., USA'; }
    else if (t.includes('florida') || hasWord(t, 'fl')) { baseCoords = { lat: 27.6648, lon: -81.5158 }; resolvedLocation = 'Florida, USA'; }
    else if (t.includes('illinois') || hasWord(t, 'il')) { baseCoords = { lat: 40.6331, lon: -89.3985 }; resolvedLocation = 'Illinois, USA'; }
    else if (t.includes('pennsylvania') || hasWord(t, 'pa')) { baseCoords = { lat: 41.2033, lon: -77.1945 }; resolvedLocation = 'Pennsylvania, USA'; }
    else if (t.includes('ohio') || hasWord(t, 'oh')) { baseCoords = { lat: 40.4173, lon: -82.9071 }; resolvedLocation = 'Ohio, USA'; }
    else if (t.includes('michigan') || hasWord(t, 'mi')) { baseCoords = { lat: 44.3148, lon: -85.6024 }; resolvedLocation = 'Michigan, USA'; }
    else if (t.includes('north carolina') || hasWord(t, 'nc')) { baseCoords = { lat: 35.7596, lon: -79.0193 }; resolvedLocation = 'North Carolina, USA'; }
    else if (t.includes('south carolina') || hasWord(t, 'sc')) { baseCoords = { lat: 33.8361, lon: -81.1637 }; resolvedLocation = 'South Carolina, USA'; }
    else if (t.includes('virginia') || hasWord(t, 'va')) { baseCoords = { lat: 37.4316, lon: -78.6569 }; resolvedLocation = 'Virginia, USA'; }
    else if (t.includes('maryland') || hasWord(t, 'md')) { baseCoords = { lat: 39.0458, lon: -76.6413 }; resolvedLocation = 'Maryland, USA'; }
    else if (t.includes('massachusetts') || hasWord(t, 'ma')) { baseCoords = { lat: 42.4072, lon: -71.8157 }; resolvedLocation = 'Massachusetts, USA'; }
    else if (t.includes('colorado') || hasWord(t, 'co')) { baseCoords = { lat: 39.5501, lon: -105.7821 }; resolvedLocation = 'Colorado, USA'; }
    else if (t.includes('utah') || hasWord(t, 'ut')) { baseCoords = { lat: 39.3210, lon: -111.0937 }; resolvedLocation = 'Utah, USA'; }
    else if (t.includes('oregon') || hasWord(t, 'or')) { baseCoords = { lat: 43.8041, lon: -120.5542 }; resolvedLocation = 'Oregon, USA'; }
  }

  // 4. Smart Fallbacks (Only if no specific state or country was matched above!)
  if (!baseCoords) {
    if (t.includes('surveillance') || t.includes('security') || c.includes('wired') || c.includes('eff')) {
      baseCoords = { lat: 37.0902, lon: -95.7129 };
      resolvedLocation = 'United States';
    } else if (c.includes('reliefweb') || c.includes('human rights') || c.includes('hrw')) {
      baseCoords = { lat: 46.8182, lon: 8.2275 };
      resolvedLocation = 'Geneva, Switzerland';
    } else {
      const LANDMASS_COORDS = [
        { lat: 39.8283, lon: -98.5795, name: 'North America' },  // North America
        { lat: 56.1304, lon: -106.3468, name: 'Canada' }, // Canada
        { lat: -14.2350, lon: -51.9253, name: 'Brazil' }, // Brazil
        { lat: 48.3794, lon: 31.1656, name: 'Ukraine' },   // Ukraine
        { lat: 46.2276, lon: 2.2137, name: 'France' },     // France
        { lat: 9.0820, lon: 8.6753, name: 'Nigeria' },      // Nigeria
        { lat: 26.8206, lon: 30.8025, name: 'Egypt' },   // Egypt
        { lat: 32.4279, lon: 53.6880, name: 'Iran' },   // Iran
        { lat: 20.5937, lon: 78.9629, name: 'India' },   // India
        { lat: 35.8617, lon: 104.1954, name: 'China' }   // China
      ];
      // Deterministic landmass selection based on title/country seed to prevent duplicates/jumping coordinates!
      let hash = 0;
      const seedText = title || country || 'signal';
      for (let i = 0; i < seedText.length; i++) {
        hash = seedText.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % LANDMASS_COORDS.length;
      const selected = LANDMASS_COORDS[index];
      baseCoords = { lat: selected.lat, lon: selected.lon };
      resolvedLocation = selected.name;
    }
  }

  // Apply stable, deterministic coordinate jitter to space markers beautifully without stack jumping!
  const jitter = getDeterministicJitter(title || country || 'signal', 0.6);
  return {
    lat: baseCoords.lat + jitter.lat,
    lon: baseCoords.lon + jitter.lon,
    resolvedLocation: resolvedLocation || country || 'Global'
  };
}

function parseLocalRadarDossiers() {
  const dossierDir = "C:\\AI_Workspace\\Obsidian\\Avi\\Automated_Intel_Dossiers\\🗞️_Daily_Radar";
  const events = [];
  
  try {
    if (!fs.existsSync(dossierDir)) return events;
    const files = fs.readdirSync(dossierDir).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const filePath = path.join(dossierDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      
      const sections = raw.split(/#### 🔴 /);
      for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const lines = section.split('\n');
        const title = lines[0].trim();
        
        let source = 'OSINT';
        let published = new Date().toISOString();
        let link = '';
        let summary = '';
        
        for (const line of lines) {
          const l = line.trim();
          if (l.startsWith('* **Source:**')) {
            source = l.replace(/^\*\s*\*\*Source:\*\*\s*/i, '').trim();
          } else if (l.startsWith('* **Published:**')) {
            published = l.replace(/^\*\s*\*\*Published:\*\*\s*/i, '').trim();
          } else if (l.startsWith('* **Link:**')) {
            const match = l.match(/\((https?:\/\/[^\s)]+)\)/);
            if (match) link = match[1];
            else link = l.replace(/^\*\s*\*\*Link:\*\*\s*/i, '').trim();
          } else if (l.startsWith('* **Brief Summary:**')) {
            summary = l.replace(/^\*\s*\*\*Brief Summary:\*\*\s*/i, '').trim();
          }
        }
        
        const coords = getCountryCoords(source || 'Global', title);
        
        events.push({
          id: generateHashId(link, title),
          title,
          url: link,
          source: source || 'OSINT',
          timestamp: published,
          category: getCategory(title),
          severity: getSeverity(title),
          quality: getQuality(title),
          location: coords?.resolvedLocation || source || 'Global',
          lat: coords ? coords.lat : null,
          lon: coords ? coords.lon : null,
          details: { summary }
        });
      }
    }
  } catch (err) {
    console.error('Error parsing local radar dossiers:', err);
  }
  return events;
}

function loadStaticEvents() {
  const staticPath = path.join(process.cwd(), 'public', 'data', 'events.json');
  try {
    if (fs.existsSync(staticPath)) {
      const data = fs.readFileSync(staticPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading static events:', err);
  }
  return [];
}

const CURATED_STATIC_MARKERS = [
  { lat: 31.5, lon: 34.5, name: 'IDF Lavender AI targeting system deployment', category: 'Conflict', severity: 5, tag: 'CRITICAL', source: '+972 Magazine', url: 'https://www.972mag.com/lavender-ai-israeli-army-gaza/' },
  { lat: 31.8, lon: 35.2, name: 'Red Wolf biometric surveillance network', category: 'Conflict', severity: 4, tag: 'ALERT', source: 'Amnesty International', url: 'https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/' },
  { lat: 59.3, lon: 18.0, name: 'SIPRI annual report: global LAWS development surging', category: 'Political', severity: 2, tag: 'NEW', source: 'SIPRI', url: 'https://www.sipri.org/media/press-release/2023/ai-and-autonomous-weapons' }
];

async function fetchGdelt(timespan) {
  let mks = [];
  let evs = [];
  try {
    const [geoRes, docRes] = await Promise.all([
      fetch(GDELT_GEO_API).catch(() => null),
      fetch(GDELT_DOC_API).catch(() => null)
    ]);
    if (geoRes?.ok) {
      const geo = await geoRes.json();
      mks = (geo.features || []).map(f => {
        const p = f.properties || {};
        const n = (p.name || p.html || 'Signal').replace(/<[^>]*>/g, '').slice(0, 150);
        return {
          id: generateHashId(p.url, n),
          lat: f.geometry?.coordinates?.[1],
          lon: f.geometry?.coordinates?.[0],
          name: n,
          category: getCategory(n),
          severity: getSeverity(n),
          url: p.url || null,
          count: p.count || 1
        };
      }).filter(m => m.lat && m.lon);
    }
    if (docRes?.ok) {
      const doc = await docRes.json();
      evs = (doc.articles || []).map(a => {
        let ts = a.seendate || new Date().toISOString();
        if (typeof ts === 'string' && /^\d{14}$/.test(ts)) {
          ts = ts.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z');
        }
        const locationName = a.sourcecountry || 'Global';
        const coords = getCountryCoords(locationName, a.title);
        return {
          id: generateHashId(a.url, a.title),
          title: a.title || 'Untitled Signal',
          url: a.url,
          source: a.domain || 'OSINT',
          timestamp: ts,
          category: getCategory(a.title),
          severity: getSeverity(a.title),
          quality: getQuality(a.title),
          location: coords?.resolvedLocation || locationName,
          lat: coords ? coords.lat : null,
          lon: coords ? coords.lon : null,
          details: { ...a }
        };
      }).filter(e => e.quality > 1);
    }
  } catch (err) { console.error('GDELT Fetch Err:', err); }
  return { mks, evs };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ts = searchParams.get('timespan') || '24h';
    const now = Date.now();

    if (!isDbInitialized) {
      await initDb();
      isDbInitialized = true;
    }

    if (routeCache[ts] && now - routeCache[ts].time < CACHE_EXPIRY) {
      return NextResponse.json(routeCache[ts].data, { 
        headers: { 'Cache-Control': 'no-store, max-age=0' } 
      });
    }

    const { mks, evs } = await fetchGdelt(ts);
    const dbEventsList = await getEvents(ts);
    const staticEvents = loadStaticEvents();

    let finalEventsList = [...dbEventsList, ...staticEvents];
    if (finalEventsList.length === 0 && evs.length === 0) {
      console.log('No online, database, or static events found. Trying local dossiers...');
      finalEventsList = parseLocalRadarDossiers();
    }

    // Merge and Deduplicate Events
    const eventMap = new Map();
    finalEventsList.forEach(e => eventMap.set(e.id, e));
    evs.forEach(e => eventMap.set(e.id, e));

    const sortedEvents = Array.from(eventMap.values()).sort((a, b) => {
      const isA = a.source?.includes('Vault') || a.source?.includes('OCHA') || a.source?.includes('HRW');
      const isB = b.source?.includes('Vault') || b.source?.includes('OCHA') || b.source?.includes('HRW');
      if (isA && !isB) return -1;
      if (!isA && isB) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Assign high-fidelity coordinates
    sortedEvents.forEach(e => {
      const coords = getCountryCoords(e.location || 'Global', e.title);
      if (coords) {
        if (!e.lat || !e.lon) {
          e.lat = coords.lat;
          e.lon = coords.lon;
        }
        if (coords.resolvedLocation && (!e.location || e.location === 'Global' || e.location.length <= 3)) {
          e.location = coords.resolvedLocation;
        }
      }
    });

    // Deep event deduplication by URL and title similarity
    const seenEventTitles = new Set();
    const seenEventUrls = new Set();
    const allEvents = [];

    sortedEvents.forEach(e => {
      const titleNorm = (e.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 45);
      const urlNorm = (e.url || '').split('?')[0];

      if (urlNorm && seenEventUrls.has(urlNorm)) return;
      if (titleNorm && seenEventTitles.has(titleNorm)) return;

      if (urlNorm) seenEventUrls.add(urlNorm);
      if (titleNorm) seenEventTitles.add(titleNorm);
      allEvents.push(e);
    });

    // Build and Deduplicate Markers
    const curated = CURATED_STATIC_MARKERS.map((m, i) => ({ ...m, id: `curated-${i}`, count: 1 }));
    const dbMarkers = allEvents.filter(e => e.lat && e.lon).map(e => ({
      id: `db-${e.id}`, lat: e.lat, lon: e.lon, name: e.title,
      category: e.category, severity: e.severity, url: e.url, location: e.location, count: 1
    }));

    const rawMarkers = [...curated, ...dbMarkers, ...mks];
    const seenMarkerCoords = new Set();
    const seenMarkerNames = new Set();
    const finalMarkers = [];

    rawMarkers.forEach(m => {
      if (!m.lat || !m.lon) return;

      const coordKey = `${Number(m.lat).toFixed(4)},${Number(m.lon).toFixed(4)}`;
      const nameNorm = (m.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 45);

      // Prevent duplicate overlays and stacked repeats of the same or highly similar stories
      if (nameNorm && seenMarkerNames.has(nameNorm)) return;
      if (coordKey && seenMarkerCoords.has(coordKey) && m.name && [...seenMarkerNames].some(n => nameNorm.includes(n) || n.includes(nameNorm))) return;

      if (coordKey) seenMarkerCoords.add(coordKey);
      if (nameNorm) seenMarkerNames.add(nameNorm);
      finalMarkers.push(m);
    });

    const responseData = {
      markers: finalMarkers.slice(0, 1000),
      events: allEvents.slice(0, 1000),
      lastUpdated: new Date().toISOString(),
      status: 'success'
    };

    routeCache[ts] = { time: now, data: responseData };
    return NextResponse.json(responseData, { 
      headers: { 'Cache-Control': 'no-store, max-age=0' } 
    });

  } catch (err) {
    console.error('API GET ERROR:', err);
    return NextResponse.json({ markers: [], events: [], status: 'error', error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ') || auth.split(' ')[1] !== process.env.DASHBOARD_API_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const incoming = body.events || [];
    if (incoming.length === 0) return NextResponse.json({ message: 'No events' });

    if (!isDbInitialized) { await initDb(); isDbInitialized = true; }

    const formatted = incoming.map(e => ({
      id: e.id || generateHashId(e.url, e.title),
      title: e.title, url: e.url, source: e.source || 'Vault',
      timestamp: e.timestamp || new Date().toISOString(),
      category: e.category || getCategory(e.title),
      severity: e.severity || getSeverity(e.title),
      lat: e.lat || null, lon: e.lon || null,
      details: e.details || {}
    }));

    await saveEvents(formatted);
    routeCache = {}; // Reset cache
    return NextResponse.json({ message: 'Success', count: formatted.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
