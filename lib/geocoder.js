// Advanced Geocoding & Text Sanitization Engine for Sovereign Intelligence Dashboard

// High-fidelity Global Cities, States, Countries, and Conflict Zones Coordinates Directory
const GEOGRAPHIC_DIRECTORY = [
  // Geopolitical Hotspots & Conflict Zones
  { keys: ['khartoum', 'darfur', 'port sudan', 'sudan'], name: 'Sudan', lat: 15.5007, lon: 32.5599 },
  { keys: ['gaza strip', 'gaza', 'rafah', 'khan younis', 'jabalia', 'deir al-balah'], name: 'Gaza Strip', lat: 31.3547, lon: 34.3088 },
  { keys: ['west bank', 'ramallah', 'hebron', 'jenin', 'nablus', 'jericho', 'tul karm'], name: 'West Bank', lat: 31.9522, lon: 35.2332 },
  { keys: ['tel aviv', 'jerusalem', 'haifa', 'eilat', 'ashdod', 'idf'], name: 'Israel', lat: 32.0853, lon: 34.7818 },
  { keys: ['kyiv', 'kiev', 'donbas', 'donetsk', 'luhansk', 'kharkiv', 'odesa', 'mariupol', 'crimea', 'zaporizhzhia', 'kherson'], name: 'Ukraine', lat: 50.4501, lon: 30.5234 },
  { keys: ['moscow', 'kremlin', 'st petersburg', 'belgorod', 'kursk'], name: 'Russia', lat: 55.7558, lon: 37.6173 },
  { keys: ['beijing', 'shanghai', 'shenzhen', 'guangzhou', 'xinjiang', 'uyghur', 'hong kong'], name: 'China', lat: 39.9042, lon: 116.4074 },
  { keys: ['taipei', 'taiwan strait', 'kaohsiung', 'hsinchu'], name: 'Taiwan', lat: 25.0330, lon: 121.5654 },
  { keys: ['tehran', 'isfahan', 'shiraz', 'qom', 'natanz'], name: 'Iran', lat: 35.6892, lon: 51.3890 },
  { keys: ['pyongyang', 'dmz'], name: 'North Korea', lat: 39.0392, lon: 125.7625 },
  { keys: ['damascus', 'alepo', 'idlib', 'homs'], name: 'Syria', lat: 33.5138, lon: 36.2765 },
  { keys: ['baghdad', 'erbil', 'mosul', 'basra'], name: 'Iraq', lat: 33.3152, lon: 44.3661 },
  { keys: ['kabul', 'kandahar', 'bagram'], name: 'Afghanistan', lat: 34.5553, lon: 69.2075 },
  { keys: ['mogadishu', 'somaliland', 'puntland'], name: 'Somalia', lat: 2.0469, lon: 45.3182 },
  { keys: ['sanaa', 'hodeida', 'aden', 'houthi'], name: 'Yemen', lat: 15.3694, lon: 44.1910 },
  { keys: ['beirut', 'sidon', 'tyre', 'bekaa', 'hezbollah'], name: 'Lebanon', lat: 33.8938, lon: 35.5018 },

  // United States - Key Geopolitical, Technical & Conflict Centers
  { keys: ['san diego'], name: 'San Diego, USA', lat: 32.7157, lon: -117.1611 },
  { keys: ['los angeles', 'la ', 'pasadena'], name: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437 },
  { keys: ['san francisco', 'silicon valley', 'palo alto', 'mountain view', 'cupertino', 'stanford', 'bay area', 'oakland', 'berkeley'], name: 'San Francisco, USA', lat: 37.7749, lon: -122.4194 },
  { keys: ['new york', 'nyc', 'manhattan', 'brooklyn'], name: 'New York, USA', lat: 40.7128, lon: -74.0060 },
  { keys: ['washington', 'dc ', 'pentagon', 'nsa', 'cia', 'fbi', 'darpa', 'dhs', 'ice'], name: 'Washington D.C., USA', lat: 38.9072, lon: -77.0369 },
  { keys: ['chicago'], name: 'Chicago, USA', lat: 41.8781, lon: -87.6298 },
  { keys: ['houston'], name: 'Houston, USA', lat: 29.7604, lon: -95.3698 },
  { keys: ['seattle', 'redmond'], name: 'Seattle, USA', lat: 47.6062, lon: -122.3321 },
  { keys: ['miami', 'tampa', 'orlando'], name: 'Florida, USA', lat: 27.6648, lon: -81.5158 },
  { keys: ['boston', 'cambridge', 'mit'], name: 'Boston, USA', lat: 42.3601, lon: -71.0589 },
  { keys: ['austin'], name: 'Austin, USA', lat: 30.2672, lon: -97.7431 },
  { keys: ['atlanta'], name: 'Atlanta, USA', lat: 33.7490, lon: -84.3880 },
  { keys: ['detroit'], name: 'Detroit, USA', lat: 42.3314, lon: -83.0458 },
  { keys: ['denver'], name: 'Denver, USA', lat: 39.7392, lon: -104.9903 },
  { keys: ['philadelphia'], name: 'Philadelphia, USA', lat: 39.9526, lon: -75.1652 },
  { keys: ['phoenix'], name: 'Phoenix, USA', lat: 33.4484, lon: -112.0740 },
  { keys: ['las vegas'], name: 'Las Vegas, USA', lat: 36.1716, lon: -115.1398 },
  { keys: ['honolulu', 'oahu', 'hawaii'], name: 'Hawaii, USA', lat: 21.3069, lon: -157.8583 },
  { keys: ['anchorage', 'alaska'], name: 'Alaska, USA', lat: 61.2181, lon: -149.9003 },
  { keys: ['california'], name: 'California, USA', lat: 36.7783, lon: -119.4179 },
  { keys: ['texas'], name: 'Texas, USA', lat: 31.9686, lon: -99.9018 },

  // Global Capitals & International Hubs
  { keys: ['geneva', 'un office geneva', 'un treaty', 'human rights council'], name: 'Geneva, Switzerland', lat: 46.2044, lon: 6.1432 },
  { keys: ['london', 'gchq', 'whitehall'], name: 'London, UK', lat: 51.5074, lon: -0.1278 },
  { keys: ['paris', 'elysee'], name: 'Paris, France', lat: 48.8566, lon: 2.3522 },
  { keys: ['berlin', 'bundestag'], name: 'Berlin, Germany', lat: 52.5200, lon: 13.4050 },
  { keys: ['brussels', 'european union', 'nato hq'], name: 'Brussels, Belgium', lat: 50.8503, lon: 4.3517 },
  { keys: ['tokyo', 'fukushima'], name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
  { keys: ['seoul', 'incheon'], name: 'Seoul, South Korea', lat: 37.5665, lon: 126.9780 },
  { keys: ['manila'], name: 'Manila, Philippines', lat: 14.5995, lon: 120.9842 },
  { keys: ['sydney', 'canberra'], name: 'Australia', lat: -35.2809, lon: 149.1300 },
  { keys: ['ottawa', 'toronto', 'montreal'], name: 'Canada', lat: 45.4215, lon: -75.6972 },
  { keys: ['mexico city'], name: 'Mexico City, Mexico', lat: 19.4326, lon: -99.1332 },
  { keys: ['rio de janeiro', 'brasilia', 'sao paulo'], name: 'Brazil', lat: -15.7938, lon: -47.8828 },
  { keys: ['buenos aires'], name: 'Argentina', lat: -34.6037, lon: -58.3816 },
  { keys: ['cairo', 'sinai', 'suez'], name: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357 },
  { keys: ['riyadh', 'jedah'], name: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
  { keys: ['doha'], name: 'Doha, Qatar', lat: 25.2854, lon: 51.5310 },
  { keys: ['abu dhabi', 'dubai'], name: 'United Arab Emirates', lat: 24.4539, lon: 54.3773 },
  { keys: ['ankara', 'istanbul'], name: 'Turkey', lat: 39.9334, lon: 32.8597 },
  { keys: ['new delhi', 'mumbai', 'kashmir'], name: 'India', lat: 28.6139, lon: 77.2090 },
  { keys: ['singapore'], name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { keys: ['bangkok'], name: 'Bangkok, Thailand', lat: 13.7563, lon: 100.5018 },
  { keys: ['jakarta'], name: 'Jakarta, Indonesia', lat: -6.2088, lon: 106.8456 },
  { keys: ['vietnam', 'hanoi'], name: 'Vietnam', lat: 21.0285, lon: 105.8542 }
];

// Helper to decode HTML character entities commonly found in OSINT summaries
export function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#96;/g, '`')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '--')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Smart Geocoder that extracts high-fidelity geographic matching in title & text
export function geocodeText(title = '', text = '', fallbackSid = null) {
  // Remove parenthetical dateline prefixes (e.g. "(Beirut) – ")
  const cleanTitle = (title || '').replace(/^\s*\([A-Za-z\s,.-]{3,25}\)\s*[–—-]\s*/, '');
  const cleanText = (text || '').replace(/^\s*\([A-Za-z\s,.-]{3,25}\)\s*[–—-]\s*/, '');
  const normalizedTitle = cleanTitle.toLowerCase();
  const normalizedText = cleanText.toLowerCase();
  const combinedText = `${normalizedTitle} ${normalizedText}`;

  // 1. Scan for long-form specific geographic keys first to avoid false-positives
  for (const loc of GEOGRAPHIC_DIRECTORY) {
    if (loc.keys.some(key => combinedText.includes(key))) {
      console.log(`[Semantic Geocode Match]: Found "${loc.name}" coordinates [${loc.lat}, ${loc.lon}]`);
      return { name: loc.name, lat: loc.lat, lon: loc.lon };
    }
  }

  // 2. Context-aware fallback center coordinates based on publisher source ID
  if (fallbackSid) {
    const sid = fallbackSid.toLowerCase();
    if (sid === 'arxiv') {
      return { name: 'Stanford / Silicon Valley', lat: 37.4275, lon: -122.1697 };
    } else if (sid === 'aje' || sid === 'al jazeera') {
      return { name: 'Doha HQ', lat: 25.2854, lon: 51.5310 };
    } else if (sid === 'hrw') {
      return { name: 'Geneva Office', lat: 46.2044, lon: 6.1432 };
    } else if (sid === 'un') {
      return { name: 'UN Headquarters NY', lat: 40.7489, lon: -73.9680 };
    } else if (sid === 'wired') {
      return { name: 'San Francisco HQ', lat: 37.7749, lon: -122.4194 };
    } else if (sid === 'eff') {
      return { name: 'EFF SF Office', lat: 37.7749, lon: -122.4194 };
    }
  }

  // 3. Absolute global fallback
  return { name: 'Global Network', lat: 38.9072, lon: -77.0369 };
}
