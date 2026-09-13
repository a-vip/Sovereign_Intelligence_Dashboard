// Advanced Geocoding & Text Sanitization Engine for Sovereign Intelligence Dashboard

// Deterministic spatial jitter generator to disperse clustered events around regional centers
export function getDeterministicJitter(seedText, maxDegrees = 0.35) {
  let hash = 0;
  const str = String(seedText || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const jitterLat = ((hash & 0xFF) / 255.0 - 0.5) * maxDegrees;
  const jitterLon = (((hash >> 8) & 0xFF) / 255.0 - 0.5) * maxDegrees;
  return { lat: jitterLat, lon: jitterLon };
}

// High-fidelity Global Cities, Countries, Conflict Zones, and Maritime Chokepoints
const GEOGRAPHIC_DIRECTORY = [
  // Maritime & Strategic Chokepoints
  { keys: ['strait of hormuz', 'hormuz'], name: 'Strait of Hormuz', lat: 26.5667, lon: 56.2500 },
  { keys: ['red sea', 'bab el-mandeb', 'bab-el-mandeb'], name: 'Red Sea', lat: 20.0000, lon: 38.5000 },
  { keys: ['suez canal'], name: 'Suez Canal', lat: 30.5852, lon: 32.2654 },
  { keys: ['south china sea', 'spratly', 'paracel'], name: 'South China Sea', lat: 12.0000, lon: 113.0000 },
  { keys: ['taiwan strait'], name: 'Taiwan Strait', lat: 24.0000, lon: 119.5000 },
  { keys: ['black sea'], name: 'Black Sea', lat: 43.5000, lon: 34.5000 },
  { keys: ['baltic sea'], name: 'Baltic Sea', lat: 58.0000, lon: 20.0000 },

  // Geopolitical Hotspots & Conflict Zones
  { keys: ['gaza strip', 'gaza', 'rafah', 'khan younis', 'jabalia', 'deir al-balah', 'nuseirat'], name: 'Gaza Strip', lat: 31.3547, lon: 34.3088 },
  { keys: ['west bank', 'ramallah', 'hebron', 'jenin', 'nablus', 'jericho', 'tul karm', 'tulkarm', 'bethlehem'], name: 'West Bank', lat: 31.9522, lon: 35.2332 },
  { keys: ['tel aviv', 'jerusalem', 'haifa', 'eilat', 'ashdod', 'idf', 'israel', 'israeli'], name: 'Israel', lat: 32.0853, lon: 34.7818 },
  { keys: ['beirut', 'sidon', 'tyre', 'bekaa', 'baalbek', 'nabatieh', 'hezbollah', 'lebanon', 'lebanese'], name: 'Lebanon', lat: 33.8938, lon: 35.5018 },
  { keys: ['damascus', 'aleppo', 'idlib', 'homs', 'hama', 'latakia', 'golan', 'syria', 'syrian'], name: 'Syria', lat: 33.5138, lon: 36.2765 },
  { keys: ['sanaa', 'hodeida', 'aden', 'marib', 'houthi', 'ansarallah', 'yemen', 'yemeni'], name: 'Yemen', lat: 15.3694, lon: 44.1910 },
  { keys: ['khartoum', 'darfur', 'port sudan', 'el fasher', 'omdurman', 'kordofan', 'sudan', 'sudanese'], name: 'Sudan', lat: 15.5007, lon: 32.5599 },
  { keys: ['juba', 'south sudan'], name: 'South Sudan', lat: 4.8594, lon: 31.5713 },
  { keys: ['tehran', 'isfahan', 'shiraz', 'qom', 'natanz', 'fordow', 'tabriz', 'iran', 'iranian'], name: 'Iran', lat: 35.6892, lon: 51.3890 },
  { keys: ['baghdad', 'erbil', 'mosul', 'basra', 'kirkuk', 'najaf', 'iraq', 'iraqi'], name: 'Iraq', lat: 33.3152, lon: 44.3661 },
  { keys: ['kyiv', 'kiev', 'donbas', 'donetsk', 'luhansk', 'kharkiv', 'odesa', 'mariupol', 'crimea', 'zaporizhzhia', 'kherson', 'dnipro', 'lviv', 'ukraine', 'ukrainian'], name: 'Ukraine', lat: 50.4501, lon: 30.5234 },
  { keys: ['moscow', 'kremlin', 'st petersburg', 'belgorod', 'kursk', 'rostov', 'russia', 'russian'], name: 'Russia', lat: 55.7558, lon: 37.6173 },
  { keys: ['mogadishu', 'somaliland', 'puntland', 'somalia', 'somali'], name: 'Somalia', lat: 2.0469, lon: 45.3182 },
  { keys: ['kabul', 'kandahar', 'bagram', 'afghanistan', 'taliban'], name: 'Afghanistan', lat: 34.5553, lon: 69.2075 },
  { keys: ['pyongyang', 'dmz', 'north korea'], name: 'North Korea', lat: 39.0392, lon: 125.7625 },
  { keys: ['n\'djamena', 'chad'], name: 'Chad', lat: 12.1348, lon: 15.0557 },
  { keys: ['niamey', 'niger'], name: 'Niger', lat: 13.5116, lon: 2.1254 },
  { keys: ['bamako', 'mali'], name: 'Mali', lat: 12.6392, lon: -8.0029 },
  { keys: ['ouagadougou', 'burkina faso'], name: 'Burkina Faso', lat: 12.3714, lon: -1.5197 },
  { keys: ['tripoli', 'benghazi', 'libya', 'libyan'], name: 'Libya', lat: 32.8872, lon: 13.1913 },

  // Europe & Mediterranean
  { keys: ['greece', 'greek', 'athens', 'thessaloniki', 'tempe', 'larissa', 'crete', 'aegean'], name: 'Greece', lat: 37.9838, lon: 23.7275 },
  { keys: ['cyprus', 'nicosia', 'limassol', 'larnaca'], name: 'Cyprus', lat: 35.1856, lon: 33.3823 },
  { keys: ['turkey', 'turkiye', 'turkish', 'ankara', 'istanbul', 'izmir'], name: 'Turkey', lat: 39.9334, lon: 32.8597 },
  { keys: ['london', 'gchq', 'whitehall', 'britain', 'british', 'uk', 'united kingdom', 'england', 'scotland', 'wales', 'belfast'], name: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  { keys: ['paris', 'elysee', 'france', 'french', 'marseille', 'lyon'], name: 'France', lat: 48.8566, lon: 2.3522 },
  { keys: ['berlin', 'bundestag', 'germany', 'german', 'munich', 'frankfurt', 'hamburg'], name: 'Germany', lat: 52.5200, lon: 13.4050 },
  { keys: ['brussels', 'european union', 'nato hq', 'belgium', 'belgian'], name: 'Belgium', lat: 50.8503, lon: 4.3517 },
  { keys: ['geneva', 'un office geneva', 'un treaty', 'human rights council', 'zurich', 'switzerland', 'swiss'], name: 'Switzerland', lat: 46.2044, lon: 6.1432 },
  { keys: ['rome', 'italy', 'italian', 'milan', 'naples'], name: 'Italy', lat: 41.9028, lon: 12.4964 },
  { keys: ['madrid', 'spain', 'spanish', 'barcelona', 'valencia'], name: 'Spain', lat: 40.4168, lon: -3.7038 },
  { keys: ['lisbon', 'portugal', 'portuguese'], name: 'Portugal', lat: 38.7223, lon: -9.1393 },
  { keys: ['warsaw', 'poland', 'polish', 'krakow'], name: 'Poland', lat: 52.2297, lon: 21.0122 },
  { keys: ['amsterdam', 'hague', 'netherlands', 'dutch', 'rotterdam'], name: 'Netherlands', lat: 52.3676, lon: 4.9041 },
  { keys: ['stockholm', 'sweden', 'swedish', 'gothenburg'], name: 'Sweden', lat: 59.3293, lon: 18.0686 },
  { keys: ['oslo', 'norway', 'norwegian'], name: 'Norway', lat: 59.9139, lon: 10.7522 },
  { keys: ['helsinki', 'finland', 'finnish'], name: 'Finland', lat: 60.1699, lon: 24.9384 },
  { keys: ['copenhagen', 'denmark', 'danish'], name: 'Denmark', lat: 55.6761, lon: 12.5683 },
  { keys: ['dublin', 'ireland', 'irish'], name: 'Ireland', lat: 53.3498, lon: -6.2603 },
  { keys: ['vienna', 'austria', 'austrian'], name: 'Austria', lat: 48.2082, lon: 16.3738 },
  { keys: ['prague', 'czech', 'czechia'], name: 'Czech Republic', lat: 50.0755, lon: 14.4378 },
  { keys: ['budapest', 'hungary', 'hungarian'], name: 'Hungary', lat: 47.4979, lon: 19.0402 },
  { keys: ['bucharest', 'romania', 'romanian'], name: 'Romania', lat: 44.4268, lon: 26.1025 },
  { keys: ['sofia', 'bulgaria', 'bulgarian'], name: 'Bulgaria', lat: 42.6977, lon: 23.3219 },
  { keys: ['belgrade', 'serbia', 'serbian'], name: 'Serbia', lat: 44.7866, lon: 20.4489 },
  { keys: ['zagreb', 'croatia', 'croatian'], name: 'Croatia', lat: 45.8150, lon: 15.9819 },
  { keys: ['sarajevo', 'bosnia'], name: 'Bosnia and Herzegovina', lat: 43.8563, lon: 18.4131 },
  { keys: ['tirana', 'albania'], name: 'Albania', lat: 41.3275, lon: 19.8187 },
  { keys: ['tallinn', 'estonia'], name: 'Estonia', lat: 59.4370, lon: 24.7535 },
  { keys: ['riga', 'latvia'], name: 'Latvia', lat: 56.9496, lon: 24.1052 },
  { keys: ['vilnius', 'lithuania'], name: 'Lithuania', lat: 54.6872, lon: 25.2797 },
  { keys: ['chisinau', 'moldova'], name: 'Moldova', lat: 47.0105, lon: 28.8638 },
  { keys: ['tbilisi', 'georgia '], name: 'Georgia', lat: 41.7151, lon: 44.8271 },
  { keys: ['yerevan', 'armenia'], name: 'Armenia', lat: 40.1792, lon: 44.4991 },
  { keys: ['baku', 'azerbaijan'], name: 'Azerbaijan', lat: 40.4093, lon: 49.8671 },

  // Asia & Oceania
  { keys: ['india', 'indian', 'new delhi', 'delhi', 'mumbai', 'bengaluru', 'bangalore', 'chennai', 'kolkata', 'manipur', 'kashmir'], name: 'India', lat: 28.6139, lon: 77.2090 },
  { keys: ['pakistan', 'pakistani', 'islamabad', 'karachi', 'lahore', 'peshawar'], name: 'Pakistan', lat: 33.6844, lon: 73.0479 },
  { keys: ['dhaka', 'bangladesh', 'bengal'], name: 'Bangladesh', lat: 23.8103, lon: 90.4125 },
  { keys: ['colombo', 'sri lanka'], name: 'Sri Lanka', lat: 6.9271, lon: 79.8612 },
  { keys: ['kathmandu', 'nepal'], name: 'Nepal', lat: 27.7172, lon: 85.3240 },
  { keys: ['beijing', 'shanghai', 'shenzhen', 'guangzhou', 'wuhan', 'chengdu', 'xinjiang', 'uyghur', 'hong kong', 'china', 'chinese'], name: 'China', lat: 39.9042, lon: 116.4074 },
  { keys: ['taipei', 'taiwan', 'kaohsiung', 'hsinchu', 'taichung'], name: 'Taiwan', lat: 25.0330, lon: 121.5654 },
  { keys: ['tokyo', 'fukushima', 'osaka', 'kyoto', 'japan', 'japanese'], name: 'Japan', lat: 35.6762, lon: 139.6503 },
  { keys: ['seoul', 'incheon', 'busan', 'south korea', 'korean'], name: 'South Korea', lat: 37.5665, lon: 126.9780 },
  { keys: ['manila', 'quezon city', 'davao', 'philippines', 'filipino'], name: 'Philippines', lat: 14.5995, lon: 120.9842 },
  { keys: ['jakarta', 'indonesia', 'indonesian', 'bali', 'surabaya'], name: 'Indonesia', lat: -6.2088, lon: 106.8456 },
  { keys: ['singapore'], name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { keys: ['kuala lumpur', 'malaysia', 'malaysian'], name: 'Malaysia', lat: 3.1390, lon: 101.6869 },
  { keys: ['bangkok', 'thailand', 'thai'], name: 'Thailand', lat: 13.7563, lon: 100.5018 },
  { keys: ['vietnam', 'vietnamese', 'hanoi', 'ho chi minh', 'saigon', 'da nang'], name: 'Vietnam', lat: 21.0285, lon: 105.8542 },
  { keys: ['yangon', 'naypyidaw', 'myanmar', 'burma', 'burmese'], name: 'Myanmar', lat: 19.7633, lon: 96.0785 },
  { keys: ['canberra', 'sydney', 'melbourne', 'brisbane', 'perth', 'australia', 'australian'], name: 'Australia', lat: -35.2809, lon: 149.1300 },
  { keys: ['wellington', 'auckland', 'new zealand'], name: 'New Zealand', lat: -41.2865, lon: 174.7762 },

  // Middle East & North Africa
  { keys: ['doha', 'qatar', 'qatari'], name: 'Qatar', lat: 25.2854, lon: 51.5310 },
  { keys: ['riyadh', 'jeddah', 'mecca', 'medina', 'aramco', 'saudi arabia', 'saudi'], name: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
  { keys: ['abu dhabi', 'dubai', 'sharjah', 'emirates', 'uae'], name: 'United Arab Emirates', lat: 24.4539, lon: 54.3773 },
  { keys: ['kuwait city', 'kuwait'], name: 'Kuwait', lat: 29.3759, lon: 47.9774 },
  { keys: ['manama', 'bahrain'], name: 'Bahrain', lat: 26.2285, lon: 50.5860 },
  { keys: ['muscat', 'salalah', 'oman'], name: 'Oman', lat: 23.5880, lon: 58.3829 },
  { keys: ['cairo', 'alexandria', 'sinai', 'suez', 'egypt', 'egyptian'], name: 'Egypt', lat: 30.0444, lon: 31.2357 },
  { keys: ['amman', 'jordan', 'jordanian'], name: 'Jordan', lat: 31.9454, lon: 35.9284 },
  { keys: ['tunis', 'tunisia'], name: 'Tunisia', lat: 36.8065, lon: 10.1815 },
  { keys: ['algiers', 'algeria'], name: 'Algeria', lat: 36.7538, lon: 3.0588 },
  { keys: ['rabat', 'casablanca', 'morocco'], name: 'Morocco', lat: 34.0209, lon: -6.8416 },

  // Sub-Saharan Africa
  { keys: ['addis ababa', 'tigray', 'amhara', 'ethiopia'], name: 'Ethiopia', lat: 9.0320, lon: 38.7469 },
  { keys: ['nairobi', 'mombasa', 'kenya'], name: 'Kenya', lat: -1.2921, lon: 36.8219 },
  { keys: ['abuja', 'lagos', 'kano', 'nigeria'], name: 'Nigeria', lat: 9.0765, lon: 7.3986 },
  { keys: ['kinshasa', 'goma', 'drc', 'congo'], name: 'Democratic Republic of Congo', lat: -4.4419, lon: 15.2663 },
  { keys: ['pretoria', 'johannesburg', 'cape town', 'south africa'], name: 'South Africa', lat: -25.7479, lon: 28.2293 },
  { keys: ['kampala', 'uganda'], name: 'Uganda', lat: 0.3476, lon: 32.5825 },
  { keys: ['kigali', 'rwanda'], name: 'Rwanda', lat: -1.9706, lon: 30.1044 },

  // Americas
  { keys: ['san diego'], name: 'San Diego, USA', lat: 32.7157, lon: -117.1611 },
  { keys: ['los angeles', 'pasadena'], name: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437 },
  { keys: ['san francisco', 'silicon valley', 'palo alto', 'mountain view', 'cupertino', 'stanford', 'bay area', 'oakland', 'berkeley'], name: 'San Francisco, USA', lat: 37.7749, lon: -122.4194 },
  { keys: ['new york', 'nyc', 'manhattan', 'brooklyn', 'un headquarters'], name: 'New York, USA', lat: 40.7128, lon: -74.0060 },
  { keys: ['washington', 'pentagon', 'nsa', 'cia', 'fbi', 'darpa', 'dhs', 'ice ', 'capitol hill', 'white house'], name: 'Washington D.C., USA', lat: 38.9072, lon: -77.0369 },
  { keys: ['chicago'], name: 'Chicago, USA', lat: 41.8781, lon: -87.6298 },
  { keys: ['houston', 'austin', 'dallas', 'texas'], name: 'Texas, USA', lat: 31.9686, lon: -99.9018 },
  { keys: ['seattle', 'redmond'], name: 'Seattle, USA', lat: 47.6062, lon: -122.3321 },
  { keys: ['miami', 'florida'], name: 'Florida, USA', lat: 27.6648, lon: -81.5158 },
  { keys: ['boston', 'cambridge', 'mit'], name: 'Boston, USA', lat: 42.3601, lon: -71.0589 },
  { keys: ['atlanta'], name: 'Atlanta, USA', lat: 33.7490, lon: -84.3880 },
  { keys: ['detroit'], name: 'Detroit, USA', lat: 42.3314, lon: -83.0458 },
  { keys: ['denver'], name: 'Denver, USA', lat: 39.7392, lon: -104.9903 },
  { keys: ['honolulu', 'hawaii'], name: 'Hawaii, USA', lat: 21.3069, lon: -157.8583 },
  { keys: ['alaska', 'anchorage'], name: 'Alaska, USA', lat: 61.2181, lon: -149.9003 },
  { keys: ['united states', 'usa', 'america', 'american'], name: 'United States', lat: 39.8283, lon: -98.5795 },
  { keys: ['ottawa', 'toronto', 'montreal', 'vancouver', 'canada', 'canadian'], name: 'Canada', lat: 45.4215, lon: -75.6972 },
  { keys: ['mexico city', 'mexico', 'mexican'], name: 'Mexico', lat: 19.4326, lon: -99.1332 },
  { keys: ['havana', 'cuba'], name: 'Cuba', lat: 23.1136, lon: -82.3666 },
  { keys: ['port-au-prince', 'haiti'], name: 'Haiti', lat: 18.5944, lon: -72.3074 },
  { keys: ['bogota', 'medellin', 'colombia'], name: 'Colombia', lat: 4.7110, lon: -74.0721 },
  { keys: ['caracas', 'venezuela'], name: 'Venezuela', lat: 10.4806, lon: -66.9036 },
  { keys: ['brasilia', 'sao paulo', 'rio de janeiro', 'brazil', 'brazilian'], name: 'Brazil', lat: -15.7938, lon: -47.8828 },
  { keys: ['buenos aires', 'argentina'], name: 'Argentina', lat: -34.6037, lon: -58.3816 },
  { keys: ['santiago', 'chile'], name: 'Chile', lat: -33.4489, lon: -70.6693 },
  { keys: ['lima', 'peru'], name: 'Peru', lat: -12.0464, lon: -77.0428 }
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

// Smart Geocoder that extracts high-fidelity geographic matching with deterministic spatial dispersion
export function geocodeText(title = '', text = '', fallbackSid = null) {
  const cleanTitle = (title || '').replace(/^\s*\([A-Za-z\s,.-]{3,25}\)\s*[–—-]\s*/, '');
  const cleanText = (text || '').replace(/^\s*\([A-Za-z\s,.-]{3,25}\)\s*[–—-]\s*/, '');
  const normalizedTitle = cleanTitle.toLowerCase();
  const normalizedText = cleanText.toLowerCase();
  const combinedText = `${normalizedTitle} ${normalizedText}`;

  // Helper: check word boundaries to prevent false substring matches
  const hasToken = (needle) => {
    const escaped = needle.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(combinedText);
  };

  // 1. Scan for specific geographic keys
  for (const loc of GEOGRAPHIC_DIRECTORY) {
    if (loc.keys.some(key => hasToken(key))) {
      const jitter = getDeterministicJitter(combinedText, 0.35);
      const lat = Number((loc.lat + jitter.lat).toFixed(4));
      const lon = Number((loc.lon + jitter.lon).toFixed(4));
      return { name: loc.name, lat, lon };
    }
  }

  // 2. Context-aware fallback center coordinates based on publisher source ID, dispersed with jitter
  if (fallbackSid) {
    const sid = fallbackSid.toLowerCase();
    const jitter = getDeterministicJitter(combinedText, 0.6);

    if (sid === 'arxiv') {
      return { name: 'Stanford / Silicon Valley', lat: Number((37.4275 + jitter.lat).toFixed(4)), lon: Number((-122.1697 + jitter.lon).toFixed(4)) };
    } else if (sid === 'aje' || sid === 'al jazeera') {
      // Al Jazeera global correspondents: disperse across Middle East / Global monitoring grid
      return { name: 'Middle East Bureau', lat: Number((25.2854 + jitter.lat * 2).toFixed(4)), lon: Number((51.5310 + jitter.lon * 2).toFixed(4)) };
    } else if (sid === 'hrw') {
      return { name: 'Geneva Office', lat: Number((46.2044 + jitter.lat).toFixed(4)), lon: Number((6.1432 + jitter.lon).toFixed(4)) };
    } else if (sid === 'un') {
      return { name: 'UN Headquarters NY', lat: Number((40.7489 + jitter.lat).toFixed(4)), lon: Number((-73.9680 + jitter.lon).toFixed(4)) };
    } else if (sid === 'wired' || sid === 'eff') {
      return { name: 'San Francisco Tech Center', lat: Number((37.7749 + jitter.lat).toFixed(4)), lon: Number((-122.4194 + jitter.lon).toFixed(4)) };
    } else if (sid === 'nature') {
      return { name: 'London Research Centre', lat: Number((51.5074 + jitter.lat).toFixed(4)), lon: Number((-0.1278 + jitter.lon).toFixed(4)) };
    }
  }

  // 3. Absolute global fallback with broad regional distribution based on content hash
  const jitter = getDeterministicJitter(combinedText, 1.2);
  return { 
    name: 'Global Node', 
    lat: Number((38.9072 + jitter.lat).toFixed(4)), 
    lon: Number((-77.0369 + jitter.lon).toFixed(4)) 
  };
}
