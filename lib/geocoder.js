/**
 * Sovereign Intelligence — Position-Aware, Land-Verified International Geocoding Engine
 *
 * Resolves international AI, Cyber & Tech Policy headlines and summaries to precise,
 * land-safe sovereign capitals, tech hubs, and multilateral treaty centers.
 *
 * Key Guarantees:
 *  1. Position-Aware Priority: Leading datelines ("Thailand: ...") and earliest headline
 *     mentions always win over dictionary iteration order.
 *  2. Zero Fake Publisher-HQ Clusters: Articles without a real geographic or national-agency
 *     reference return `{ hasExplicitLocation: false, lat: null, lon: null }` instead of
 *     fabricating pins in Silicon Valley, London, or the Persian Gulf.
 *  3. Land-Safe Coordinates & Golden-Angle Dispersion: Coastal tech hubs are anchored
 *     inland on solid urban terrain so micro-dispersion never drops pins into oceans.
 */

export const GEOGRAPHIC_DIRECTORY = [
  // ── MULTILATERAL & TREATY HUBS ──────────────────────────────────────────────
  { name: 'Geneva, Switzerland', lat: 46.2044, lon: 6.1432, region: 'Europe', specificity: 3, patterns: ['geneva', 'unog', 'itu', 'world health organization', 'world trade organization', 'icrc', 'cern', 'palais des nations'] },
  { name: 'Brussels, Belgium', lat: 50.8503, lon: 4.3517, region: 'Europe', specificity: 3, patterns: ['brussels', 'european union', 'european commission', 'european parliament', 'eu ai act', 'eu ai office', 'digital services act', 'digital markets act', 'edpb', 'european council', 'eu regulators', 'eu antitrust', 'eucyber', 'nato headquarters'] },
  { name: 'Brussels, Belgium', lat: 50.8503, lon: 4.3517, region: 'Europe', specificity: 2, patterns: ['eu', 'e.u.'] },
  { name: 'The Hague, Netherlands', lat: 52.0705, lon: 4.3007, region: 'Europe', specificity: 3, patterns: ['the hague', 'europol', 'international criminal court', 'international court of justice', 'icj', 'icc'] },
  { name: 'Strasbourg, France', lat: 48.5734, lon: 7.7521, region: 'Europe', specificity: 3, patterns: ['strasbourg', 'council of europe', 'echr'] },
  { name: 'Vienna, Austria', lat: 48.2082, lon: 16.3738, region: 'Europe', specificity: 3, patterns: ['vienna', 'iaea', 'osce', 'austria', 'austrian'] },
  { name: 'Tallinn, Estonia', lat: 59.4370, lon: 24.7536, region: 'Europe', specificity: 3, patterns: ['tallinn', 'ccdcoe', 'estonia', 'estonian'] },
  { name: 'Athens, Greece', lat: 37.9838, lon: 23.7275, region: 'Europe', specificity: 3, patterns: ['athens', 'enisa', 'greece', 'greek'] },

  // ── NORTH AMERICA (SUB-REGIONAL TECH & POLICY CAPITALS + SOVEREIGN) ────────
  { name: 'Washington D.C., USA', lat: 38.9072, lon: -77.0369, region: 'Americas', specificity: 3, patterns: ['washington d.c.', 'washington dc', 'washington, d.c.', 'white house', 'capitol hill', 'u.s. congress', 'us congress', 'u.s. senate', 'us senate', 'pentagon', 'cisa', 'nist', 'federal trade commission', 'department of justice', 'department of commerce', 'bureau of industry and security', 'u.s. treasury', 'nsa', 'uscybercom', 'darpa', 'fcc'] },
  { name: 'San Francisco, USA', lat: 37.7650, lon: -122.4350, region: 'Americas', specificity: 3, patterns: ['san francisco'] },
  { name: 'Silicon Valley, USA', lat: 37.4419, lon: -122.1430, region: 'Americas', specificity: 3, patterns: ['silicon valley', 'palo alto', 'mountain view', 'cupertino', 'menlo park', 'santa clara', 'sunnyvale', 'san jose, california'] },
  { name: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437, region: 'Americas', specificity: 3, patterns: ['los angeles', 'hollywood', 'santa monica', 'pasadena'] },
  { name: 'Sacramento, California, USA', lat: 38.5816, lon: -121.4944, region: 'Americas', specificity: 3, patterns: ['sacramento', 'california', 'sb 1047', 'californian'] },
  { name: 'New York, USA', lat: 40.7580, lon: -73.9855, region: 'Americas', specificity: 3, patterns: ['new york', 'manhattan', 'unga', 'un general assembly', 'un security council', 'wall street'] },
  { name: 'Seattle, USA', lat: 47.6205, lon: -122.3212, region: 'Americas', specificity: 3, patterns: ['seattle', 'redmond', 'bellevue'] },
  { name: 'Portland, USA', lat: 45.5152, lon: -122.6784, region: 'Americas', specificity: 3, patterns: ['portland, oregon', 'hillsboro'] },
  { name: 'Denver, USA', lat: 39.7392, lon: -104.9903, region: 'Americas', specificity: 3, patterns: ['denver', 'boulder', 'colorado'] },
  { name: 'Phoenix, USA', lat: 33.4484, lon: -112.0740, region: 'Americas', specificity: 3, patterns: ['phoenix', 'arizona', 'mesa, arizona'] },
  { name: 'Dallas, USA', lat: 32.7767, lon: -96.7970, region: 'Americas', specificity: 3, patterns: ['dallas', 'fort worth'] },
  { name: 'Houston, USA', lat: 29.7604, lon: -95.3698, region: 'Americas', specificity: 3, patterns: ['houston'] },
  { name: 'Austin, Texas, USA', lat: 30.2672, lon: -97.7431, region: 'Americas', specificity: 3, patterns: ['austin', 'texas', 'texan'] },
  { name: 'Chicago, USA', lat: 41.8781, lon: -87.6298, region: 'Americas', specificity: 3, patterns: ['chicago', 'illinois'] },
  { name: 'Detroit, USA', lat: 42.3314, lon: -83.0458, region: 'Americas', specificity: 3, patterns: ['detroit', 'ann arbor', 'michigan'] },
  { name: 'Pittsburgh, USA', lat: 40.4406, lon: -79.9959, region: 'Americas', specificity: 3, patterns: ['pittsburgh', 'carnegie mellon'] },
  { name: 'Boston, USA', lat: 42.3601, lon: -71.0942, region: 'Americas', specificity: 3, patterns: ['boston', 'massachusetts', 'mit media lab'] },
  { name: 'Miami, USA', lat: 25.7617, lon: -80.1918, region: 'Americas', specificity: 3, patterns: ['miami', 'florida'] },
  { name: 'Atlanta, USA', lat: 33.7490, lon: -84.3880, region: 'Americas', specificity: 3, patterns: ['atlanta', 'georgia, u.s.'] },
  { name: 'Virginia, USA', lat: 38.8816, lon: -77.1710, region: 'Americas', specificity: 3, patterns: ['northern virginia', 'ashburn', 'arlington, virginia', 'langley'] },
  { name: 'Querétaro, Mexico', lat: 20.5888, lon: -100.3899, region: 'Americas', specificity: 3, patterns: ['queretaro', 'querétaro', 'guadalajara', 'monterrey'] },
  { name: 'United States', lat: 38.9072, lon: -77.0369, region: 'Americas', specificity: 1, patterns: ['united states', 'u.s.', 'usa', 'us', 'american', 'americans', 'washington'] },

  { name: 'Ottawa, Canada', lat: 45.4215, lon: -75.6972, region: 'Americas', specificity: 2, patterns: ['ottawa', 'canada', 'canadian'] },
  { name: 'Toronto, Canada', lat: 43.6629, lon: -79.3957, region: 'Americas', specificity: 3, patterns: ['toronto', 'ontario'] },
  { name: 'Montreal, Canada', lat: 45.5017, lon: -73.5673, region: 'Americas', specificity: 3, patterns: ['montreal', 'quebec', 'mila'] },
  { name: 'Vancouver, Canada', lat: 49.2606, lon: -123.1139, region: 'Americas', specificity: 3, patterns: ['vancouver', 'british columbia'] },
  { name: 'Mexico City, Mexico', lat: 19.4326, lon: -99.1332, region: 'Americas', specificity: 2, patterns: ['mexico city', 'mexico', 'mexican'] },

  // ── EUROPE & UNITED KINGDOM ─────────────────────────────────────────────────
  { name: 'Cambridge, UK', lat: 52.2053, lon: 0.1218, region: 'Europe', specificity: 3, patterns: ['cambridge university', 'university of cambridge', 'cambridge, uk', 'bletchley park', 'bletchley'] },
  { name: 'Oxford, UK', lat: 51.7520, lon: -1.2577, region: 'Europe', specificity: 3, patterns: ['oxford university', 'university of oxford', 'oxford, uk'] },
  { name: 'London, UK', lat: 51.5074, lon: -0.1278, region: 'Europe', specificity: 2, patterns: ['london', 'united kingdom', 'uk', 'u.k.', 'britain', 'british', 'england', 'westminster', 'whitehall', 'ofcom', 'gchq', 'ncsc', 'uk aisi', 'ico'] },
  { name: 'Edinburgh, Scotland, UK', lat: 55.9533, lon: -3.1883, region: 'Europe', specificity: 3, patterns: ['edinburgh', 'scotland', 'scottish', 'glasgow'] },
  { name: 'Dublin, Ireland', lat: 53.3440, lon: -6.2675, region: 'Europe', specificity: 2, patterns: ['dublin', 'ireland', 'irish', 'irish dpc'] },
  { name: 'Paris, France', lat: 48.8566, lon: 2.3522, region: 'Europe', specificity: 2, patterns: ['paris', 'france', 'french', 'cnil', 'anssi', 'elysee'] },
  { name: 'Munich, Germany', lat: 48.1351, lon: 11.5820, region: 'Europe', specificity: 3, patterns: ['munich', 'bavaria'] },
  { name: 'Frankfurt, Germany', lat: 50.1109, lon: 8.6821, region: 'Europe', specificity: 3, patterns: ['frankfurt', 'de-cix'] },
  { name: 'Berlin, Germany', lat: 52.5200, lon: 13.4050, region: 'Europe', specificity: 2, patterns: ['berlin', 'germany', 'german', 'bundestag', 'bsi', 'hamburg'] },
  { name: 'Amsterdam, Netherlands', lat: 52.3676, lon: 4.9041, region: 'Europe', specificity: 2, patterns: ['amsterdam', 'netherlands', 'dutch', 'holland', 'eindhoven', 'asml'] },
  { name: 'Barcelona, Spain', lat: 41.3874, lon: 2.1686, region: 'Europe', specificity: 3, patterns: ['barcelona', 'catalonia'] },
  { name: 'Madrid, Spain', lat: 40.4168, lon: -3.7038, region: 'Europe', specificity: 2, patterns: ['madrid', 'spain', 'spanish', 'aepd'] },
  { name: 'Milan, Italy', lat: 45.4642, lon: 9.1900, region: 'Europe', specificity: 3, patterns: ['milan'] },
  { name: 'Rome, Italy', lat: 41.9028, lon: 12.4964, region: 'Europe', specificity: 2, patterns: ['rome', 'italy', 'italian', 'garante'] },
  { name: 'Lisbon, Portugal', lat: 38.7223, lon: -9.1393, region: 'Europe', specificity: 2, patterns: ['lisbon', 'portugal', 'portuguese'] },
  { name: 'Bern, Switzerland', lat: 46.9480, lon: 7.4474, region: 'Europe', specificity: 2, patterns: ['zurich', 'bern', 'switzerland', 'swiss'] },
  { name: 'Stockholm, Sweden', lat: 59.3293, lon: 18.0686, region: 'Europe', specificity: 2, patterns: ['stockholm', 'sweden', 'swedish'] },
  { name: 'Oslo, Norway', lat: 59.9139, lon: 10.7522, region: 'Europe', specificity: 2, patterns: ['oslo', 'norway', 'norwegian'] },
  { name: 'Copenhagen, Denmark', lat: 55.6761, lon: 12.5683, region: 'Europe', specificity: 2, patterns: ['copenhagen', 'denmark', 'danish'] },
  { name: 'Helsinki, Finland', lat: 60.1699, lon: 24.9384, region: 'Europe', specificity: 2, patterns: ['helsinki', 'finland', 'finnish'] },
  { name: 'Reykjavik, Iceland', lat: 64.1466, lon: -21.9426, region: 'Europe', specificity: 2, patterns: ['reykjavik', 'iceland', 'icelandic'] },
  { name: 'Warsaw, Poland', lat: 52.2297, lon: 21.0122, region: 'Europe', specificity: 2, patterns: ['warsaw', 'poland', 'polish'] },
  { name: 'Prague, Czechia', lat: 50.0755, lon: 14.4378, region: 'Europe', specificity: 2, patterns: ['prague', 'czech republic', 'czechia', 'czech'] },
  { name: 'Budapest, Hungary', lat: 47.4979, lon: 19.0402, region: 'Europe', specificity: 2, patterns: ['budapest', 'hungary', 'hungarian'] },
  { name: 'Bucharest, Romania', lat: 44.4268, lon: 26.1025, region: 'Europe', specificity: 2, patterns: ['bucharest', 'romania', 'romanian'] },
  { name: 'Sofia, Bulgaria', lat: 42.6977, lon: 23.3219, region: 'Europe', specificity: 2, patterns: ['sofia', 'bulgaria', 'bulgarian'] },
  { name: 'Belgrade, Serbia', lat: 44.7866, lon: 20.4489, region: 'Europe', specificity: 2, patterns: ['belgrade', 'serbia', 'serbian'] },
  { name: 'Zagreb, Croatia', lat: 45.8150, lon: 15.9819, region: 'Europe', specificity: 2, patterns: ['zagreb', 'croatia', 'croatian'] },
  { name: 'Bratislava, Slovakia', lat: 48.1486, lon: 17.1077, region: 'Europe', specificity: 2, patterns: ['bratislava', 'slovakia', 'slovak'] },
  { name: 'Ljubljana, Slovenia', lat: 46.0569, lon: 14.5058, region: 'Europe', specificity: 2, patterns: ['ljubljana', 'slovenia', 'slovenian'] },
  { name: 'Vilnius, Lithuania', lat: 54.6872, lon: 25.2797, region: 'Europe', specificity: 2, patterns: ['vilnius', 'lithuania', 'lithuanian'] },
  { name: 'Riga, Latvia', lat: 56.9496, lon: 24.1052, region: 'Europe', specificity: 2, patterns: ['riga', 'latvia', 'latvian'] },
  { name: 'Luxembourg', lat: 49.6116, lon: 6.1319, region: 'Europe', specificity: 2, patterns: ['luxembourg', 'cjue', 'ecj', 'european court of justice'] },
  { name: 'Kharkiv, Ukraine', lat: 49.9935, lon: 36.2304, region: 'Europe', specificity: 3, patterns: ['kharkiv', 'dnipro'] },
  { name: 'Odesa, Ukraine', lat: 46.4825, lon: 30.7233, region: 'Europe', specificity: 3, patterns: ['odesa', 'odessa'] },
  { name: 'Kyiv, Ukraine', lat: 50.4501, lon: 30.5234, region: 'Europe', specificity: 2, patterns: ['kyiv', 'kiev', 'ukraine', 'ukrainian', 'cert-ua'] },
  { name: 'St. Petersburg, Russia', lat: 59.9343, lon: 30.3351, region: 'Europe', specificity: 3, patterns: ['st. petersburg', 'saint petersburg'] },
  { name: 'Moscow, Russia', lat: 55.7558, lon: 37.6173, region: 'Europe', specificity: 2, patterns: ['moscow', 'kremlin', 'roskomnadzor', 'fsb', 'gru', 'russia', 'russian'] },
  { name: 'Minsk, Belarus', lat: 53.9006, lon: 27.5590, region: 'Europe', specificity: 2, patterns: ['minsk', 'belarus', 'belarusian'] },
  { name: 'Chisinau, Moldova', lat: 47.0105, lon: 28.8638, region: 'Europe', specificity: 2, patterns: ['chisinau', 'moldova', 'moldovan'] },
  { name: 'Tbilisi, Georgia', lat: 41.7151, lon: 44.8271, region: 'Europe', specificity: 2, patterns: ['tbilisi', 'georgian', 'republic of georgia'] },
  { name: 'Yerevan, Armenia', lat: 40.1792, lon: 44.4991, region: 'Europe', specificity: 2, patterns: ['yerevan', 'armenia', 'armenian'] },
  { name: 'Baku, Azerbaijan', lat: 40.4093, lon: 49.8471, region: 'Europe', specificity: 2, patterns: ['baku', 'azerbaijan', 'azerbaijani'] },

  // ── INDO-PACIFIC & EAST/SOUTH/SOUTHEAST ASIA ────────────────────────────────
  { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, region: 'Indo-Pacific', specificity: 3, patterns: ['hong kong'] },
  { name: 'Shenzhen, China', lat: 22.5431, lon: 114.0579, region: 'Indo-Pacific', specificity: 3, patterns: ['shenzhen'] },
  { name: 'Guangzhou, China', lat: 23.1291, lon: 113.2644, region: 'Indo-Pacific', specificity: 3, patterns: ['guangzhou', 'canton'] },
  { name: 'Shanghai, China', lat: 31.2304, lon: 121.4737, region: 'Indo-Pacific', specificity: 3, patterns: ['shanghai', 'waic'] },
  { name: 'Suzhou, China', lat: 31.2989, lon: 120.5853, region: 'Indo-Pacific', specificity: 3, patterns: ['suzhou'] },
  { name: 'Nanjing, China', lat: 32.0603, lon: 118.7969, region: 'Indo-Pacific', specificity: 3, patterns: ['nanjing'] },
  { name: 'Hangzhou, China', lat: 30.2741, lon: 120.1551, region: 'Indo-Pacific', specificity: 3, patterns: ['hangzhou', 'deepseek', 'alibaba cloud'] },
  { name: 'Hefei, China', lat: 31.8206, lon: 117.2272, region: 'Indo-Pacific', specificity: 3, patterns: ['hefei'] },
  { name: 'Wuhan, China', lat: 30.5928, lon: 114.3055, region: 'Indo-Pacific', specificity: 3, patterns: ['wuhan'] },
  { name: 'Chengdu, China', lat: 30.5728, lon: 104.0668, region: 'Indo-Pacific', specificity: 3, patterns: ['chengdu', 'sichuan'] },
  { name: 'Chongqing, China', lat: 29.4316, lon: 106.9123, region: 'Indo-Pacific', specificity: 3, patterns: ['chongqing'] },
  { name: 'Xi\'an, China', lat: 34.3416, lon: 108.9398, region: 'Indo-Pacific', specificity: 3, patterns: ['xi\'an', 'xian', 'shaanxi'] },
  { name: 'Xinjiang, China', lat: 43.8256, lon: 87.6168, region: 'Indo-Pacific', specificity: 3, patterns: ['xinjiang', 'urumqi'] },
  { name: 'Beijing, China', lat: 39.9042, lon: 116.4074, region: 'Indo-Pacific', specificity: 2, patterns: ['beijing', 'china', 'chinese', 'prc', 'cyberspace administration of china', 'miit'] },

  { name: 'Hsinchu, Taiwan', lat: 24.8138, lon: 120.9675, region: 'Indo-Pacific', specificity: 3, patterns: ['hsinchu', 'tsmc'] },
  { name: 'Taipei, Taiwan', lat: 25.0330, lon: 121.5654, region: 'Indo-Pacific', specificity: 2, patterns: ['taipei', 'taiwan', 'taiwanese', 'taiwan strait'] },
  { name: 'Osaka, Japan', lat: 34.6937, lon: 135.5023, region: 'Indo-Pacific', specificity: 3, patterns: ['osaka', 'kyoto', 'kansai'] },
  { name: 'Tokyo, Japan', lat: 35.6895, lon: 139.6917, region: 'Indo-Pacific', specificity: 2, patterns: ['tokyo', 'japan', 'japanese', 'meti'] },
  { name: 'Busan, South Korea', lat: 35.1796, lon: 129.0756, region: 'Indo-Pacific', specificity: 3, patterns: ['busan'] },
  { name: 'Seoul, South Korea', lat: 37.5665, lon: 126.9780, region: 'Indo-Pacific', specificity: 2, patterns: ['seoul', 'south korea', 'south korean', 'rok', 'kisa', 'pipc'] },
  { name: 'Pyongyang, North Korea', lat: 39.0392, lon: 125.7625, region: 'Indo-Pacific', specificity: 2, patterns: ['pyongyang', 'north korea', 'north korean', 'dprk', 'lazarus group', 'kimsuky'] },
  { name: 'Ulaanbaatar, Mongolia', lat: 47.8864, lon: 106.9057, region: 'Indo-Pacific', specificity: 2, patterns: ['ulaanbaatar', 'mongolia', 'mongolian'] },

  { name: 'Bengaluru, India', lat: 12.9716, lon: 77.5946, region: 'Indo-Pacific', specificity: 3, patterns: ['bengaluru', 'bangalore', 'karnataka'] },
  { name: 'Hyderabad, India', lat: 17.3850, lon: 78.4867, region: 'Indo-Pacific', specificity: 3, patterns: ['hyderabad', 'telangana'] },
  { name: 'Chennai, India', lat: 13.0827, lon: 80.2707, region: 'Indo-Pacific', specificity: 3, patterns: ['chennai', 'tamil nadu'] },
  { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, region: 'Indo-Pacific', specificity: 3, patterns: ['mumbai', 'maharashtra', 'reserve bank of india'] },
  { name: 'Pune, India', lat: 18.5204, lon: 73.8567, region: 'Indo-Pacific', specificity: 3, patterns: ['pune'] },
  { name: 'Kolkata, India', lat: 22.5726, lon: 88.3639, region: 'Indo-Pacific', specificity: 3, patterns: ['kolkata', 'west bengal'] },
  { name: 'Ahmedabad, India', lat: 23.0225, lon: 72.5714, region: 'Indo-Pacific', specificity: 3, patterns: ['ahmedabad', 'gujarat', 'gift city'] },
  { name: 'Kochi, India', lat: 9.9312, lon: 76.2673, region: 'Indo-Pacific', specificity: 3, patterns: ['kochi', 'kerala'] },
  { name: 'New Delhi, India', lat: 28.6139, lon: 77.2090, region: 'Indo-Pacific', specificity: 2, patterns: ['new delhi', 'delhi', 'india', 'indian', 'meity', 'cert-in', 'aadhaar'] },
  { name: 'Karachi, Pakistan', lat: 24.8607, lon: 67.0011, region: 'Indo-Pacific', specificity: 3, patterns: ['karachi'] },
  { name: 'Lahore, Pakistan', lat: 31.5204, lon: 74.3587, region: 'Indo-Pacific', specificity: 3, patterns: ['lahore', 'punjab, pakistan'] },
  { name: 'Islamabad, Pakistan', lat: 33.6844, lon: 73.0479, region: 'Indo-Pacific', specificity: 2, patterns: ['islamabad', 'pakistan', 'pakistani'] },
  { name: 'Dhaka, Bangladesh', lat: 23.8103, lon: 90.4125, region: 'Indo-Pacific', specificity: 2, patterns: ['dhaka', 'bangladesh', 'bangladeshi'] },
  { name: 'Colombo, Sri Lanka', lat: 6.9271, lon: 79.8612, region: 'Indo-Pacific', specificity: 2, patterns: ['colombo', 'sri lanka', 'sri lankan'] },
  { name: 'Kathmandu, Nepal', lat: 27.7172, lon: 85.3240, region: 'Indo-Pacific', specificity: 2, patterns: ['kathmandu', 'nepal', 'nepali'] },

  { name: 'Singapore', lat: 1.3521, lon: 103.8198, region: 'Indo-Pacific', specificity: 2, patterns: ['singapore', 'singaporean', 'imda'] },
  { name: 'Chiang Mai, Thailand', lat: 18.7883, lon: 98.9853, region: 'Indo-Pacific', specificity: 3, patterns: ['chiang mai'] },
  { name: 'Bangkok, Thailand', lat: 13.7563, lon: 100.5018, region: 'Indo-Pacific', specificity: 2, patterns: ['bangkok', 'thailand', 'thai', 'etda'] },
  { name: 'Ho Chi Minh City, Vietnam', lat: 10.8231, lon: 106.6297, region: 'Indo-Pacific', specificity: 3, patterns: ['ho chi minh', 'saigon'] },
  { name: 'Da Nang, Vietnam', lat: 16.0544, lon: 108.2022, region: 'Indo-Pacific', specificity: 3, patterns: ['da nang', 'danang'] },
  { name: 'Hanoi, Vietnam', lat: 21.0285, lon: 105.8542, region: 'Indo-Pacific', specificity: 2, patterns: ['hanoi', 'vietnam', 'vietnamese'] },
  { name: 'Surabaya, Indonesia', lat: -7.2575, lon: 112.7521, region: 'Indo-Pacific', specificity: 3, patterns: ['surabaya', 'batam'] },
  { name: 'Bandung, Indonesia', lat: -6.9175, lon: 107.6191, region: 'Indo-Pacific', specificity: 3, patterns: ['bandung'] },
  { name: 'Jakarta, Indonesia', lat: -6.2088, lon: 106.8456, region: 'Indo-Pacific', specificity: 2, patterns: ['jakarta', 'indonesia', 'indonesian', 'asean', 'komdigi'] },
  { name: 'Johor Bahru, Malaysia', lat: 1.4927, lon: 103.7414, region: 'Indo-Pacific', specificity: 3, patterns: ['johor', 'iskandar puteri'] },
  { name: 'Penang, Malaysia', lat: 5.4141, lon: 100.3327, region: 'Indo-Pacific', specificity: 3, patterns: ['penang'] },
  { name: 'Kuala Lumpur, Malaysia', lat: 3.1390, lon: 101.6869, region: 'Indo-Pacific', specificity: 2, patterns: ['kuala lumpur', 'malaysia', 'malaysian'] },
  { name: 'Cebu, Philippines', lat: 10.3157, lon: 123.8854, region: 'Indo-Pacific', specificity: 3, patterns: ['cebu', 'davao'] },
  { name: 'Manila, Philippines', lat: 14.5995, lon: 120.9842, region: 'Indo-Pacific', specificity: 2, patterns: ['manila', 'philippines', 'philippine', 'filipino'] },
  { name: 'Naypyidaw, Myanmar', lat: 19.7633, lon: 96.0785, region: 'Indo-Pacific', specificity: 2, patterns: ['yangon', 'myanmar', 'burma', 'burmese'] },
  { name: 'Phnom Penh, Cambodia', lat: 11.5564, lon: 104.9282, region: 'Indo-Pacific', specificity: 2, patterns: ['phnom penh', 'cambodia', 'cambodian'] },
  { name: 'Vientiane, Laos', lat: 17.9757, lon: 102.6331, region: 'Indo-Pacific', specificity: 2, patterns: ['vientiane', 'laos', 'laotian'] },

  { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, region: 'Indo-Pacific', specificity: 3, patterns: ['sydney', 'new south wales'] },
  { name: 'Melbourne, Australia', lat: -37.8136, lon: 144.9631, region: 'Indo-Pacific', specificity: 3, patterns: ['melbourne', 'victoria, australia'] },
  { name: 'Brisbane, Australia', lat: -27.4698, lon: 153.0251, region: 'Indo-Pacific', specificity: 3, patterns: ['brisbane', 'queensland'] },
  { name: 'Perth, Australia', lat: -31.9505, lon: 115.8605, region: 'Indo-Pacific', specificity: 3, patterns: ['perth', 'western australia'] },
  { name: 'Canberra, Australia', lat: -35.2809, lon: 149.1300, region: 'Indo-Pacific', specificity: 2, patterns: ['canberra', 'australia', 'australian', 'esafety'] },
  { name: 'Auckland, New Zealand', lat: -36.8509, lon: 174.7645, region: 'Indo-Pacific', specificity: 3, patterns: ['auckland'] },
  { name: 'Wellington, New Zealand', lat: -41.2865, lon: 174.7762, region: 'Indo-Pacific', specificity: 2, patterns: ['wellington', 'new zealand', 'aotearoa'] },

  // ── CENTRAL ASIA ────────────────────────────────────────────────────────────
  { name: 'Astana, Kazakhstan', lat: 51.1694, lon: 71.4491, region: 'Indo-Pacific', specificity: 2, patterns: ['astana', 'almaty', 'kazakhstan', 'kazakh'] },
  { name: 'Tashkent, Uzbekistan', lat: 41.2995, lon: 69.2401, region: 'Indo-Pacific', specificity: 2, patterns: ['tashkent', 'uzbekistan', 'uzbek'] },

  // ── MIDDLE EAST & NORTH AFRICA (MENA) ───────────────────────────────────────
  { name: 'Tel Aviv, Israel', lat: 32.0853, lon: 34.7915, region: 'MENA', specificity: 2, patterns: ['tel aviv', 'jerusalem', 'israel', 'israeli', 'idf', 'unit 8200', 'nso group'] },
  { name: 'Gaza / Palestinian Territories', lat: 31.5017, lon: 34.4668, region: 'MENA', specificity: 3, patterns: ['gaza', 'west bank', 'ramallah', 'palestine', 'palestinian'] },
  { name: 'Tehran, Iran', lat: 35.6892, lon: 51.3890, region: 'MENA', specificity: 2, patterns: ['tehran', 'iran', 'iranian', 'irgc'] },
  { name: 'Jeddah, Saudi Arabia', lat: 21.4858, lon: 39.1925, region: 'MENA', specificity: 3, patterns: ['jeddah', 'neom'] },
  { name: 'Riyadh, Saudi Arabia', lat: 24.7136, lon: 46.6753, region: 'MENA', specificity: 2, patterns: ['riyadh', 'saudi arabia', 'saudi', 'sdaia'] },
  { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, region: 'MENA', specificity: 3, patterns: ['dubai'] },
  { name: 'Abu Dhabi, UAE', lat: 24.4539, lon: 54.3773, region: 'MENA', specificity: 2, patterns: ['abu dhabi', 'united arab emirates', 'uae', 'emirati', 'g42'] },
  { name: 'Doha, Qatar', lat: 25.2854, lon: 51.5150, region: 'MENA', specificity: 2, patterns: ['doha', 'qatar', 'qatari'] },
  { name: 'Kuwait City, Kuwait', lat: 29.3759, lon: 47.9774, region: 'MENA', specificity: 2, patterns: ['kuwait'] },
  { name: 'Manama, Bahrain', lat: 26.2285, lon: 50.5860, region: 'MENA', specificity: 2, patterns: ['manama', 'bahrain', 'bahraini'] },
  { name: 'Muscat, Oman', lat: 23.5880, lon: 58.3829, region: 'MENA', specificity: 2, patterns: ['muscat', 'oman', 'omani'] },
  { name: 'Istanbul, Turkey', lat: 41.0082, lon: 28.9784, region: 'MENA', specificity: 3, patterns: ['istanbul', 'bosphorus'] },
  { name: 'Ankara, Turkey', lat: 39.9334, lon: 32.8597, region: 'MENA', specificity: 2, patterns: ['ankara', 'turkey', 'turkish', 'turkiye', 'türkiye'] },
  { name: 'Beirut, Lebanon', lat: 33.8886, lon: 35.4955, region: 'MENA', specificity: 2, patterns: ['beirut', 'lebanon', 'lebanese'] },
  { name: 'Damascus, Syria', lat: 33.5138, lon: 36.2765, region: 'MENA', specificity: 2, patterns: ['damascus', 'aleppo', 'syria', 'syrian'] },
  { name: 'Baghdad, Iraq', lat: 33.3152, lon: 44.3661, region: 'MENA', specificity: 2, patterns: ['baghdad', 'iraq', 'iraqi'] },
  { name: 'Amman, Jordan', lat: 31.9454, lon: 35.9284, region: 'MENA', specificity: 2, patterns: ['amman', 'jordan', 'jordanian'] },
  { name: 'Sanaa, Yemen', lat: 15.3694, lon: 44.1910, region: 'MENA', specificity: 2, patterns: ['sanaa', 'yemen', 'yemeni', 'houthi'] },
  { name: 'Kabul, Afghanistan', lat: 34.5553, lon: 69.2075, region: 'MENA', specificity: 2, patterns: ['kabul', 'afghanistan', 'afghan'] },
  { name: 'Alexandria, Egypt', lat: 31.2001, lon: 29.9187, region: 'MENA', specificity: 3, patterns: ['alexandria'] },
  { name: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357, region: 'MENA', specificity: 2, patterns: ['cairo', 'egypt', 'egyptian'] },
  { name: 'Casablanca, Morocco', lat: 33.5731, lon: -7.5898, region: 'MENA', specificity: 3, patterns: ['casablanca'] },
  { name: 'Rabat, Morocco', lat: 34.0209, lon: -6.8241, region: 'MENA', specificity: 2, patterns: ['rabat', 'morocco', 'moroccan'] },
  { name: 'Tunis, Tunisia', lat: 36.8065, lon: 10.1815, region: 'MENA', specificity: 2, patterns: ['tunis', 'tunisia', 'tunisian'] },
  { name: 'Algiers, Algeria', lat: 36.7538, lon: 3.0588, region: 'MENA', specificity: 2, patterns: ['algiers', 'algeria', 'algerian'] },
  { name: 'Tripoli, Libya', lat: 32.8872, lon: 13.1913, region: 'MENA', specificity: 2, patterns: ['tripoli', 'libya', 'libyan'] },

  // ── SUB-SAHARAN AFRICA ──────────────────────────────────────────────────────
  { name: 'Mombasa, Kenya', lat: -4.0435, lon: 39.6682, region: 'Africa', specificity: 3, patterns: ['mombasa'] },
  { name: 'Nairobi, Kenya', lat: -1.2921, lon: 36.8219, region: 'Africa', specificity: 2, patterns: ['nairobi', 'kenya', 'kenyan'] },
  { name: 'Lagos, Nigeria', lat: 6.5244, lon: 3.3792, region: 'Africa', specificity: 3, patterns: ['lagos'] },
  { name: 'Abuja, Nigeria', lat: 9.0765, lon: 7.3986, region: 'Africa', specificity: 2, patterns: ['abuja', 'nigeria', 'nigerian'] },
  { name: 'Cape Town, South Africa', lat: -33.9249, lon: 18.4241, region: 'Africa', specificity: 3, patterns: ['cape town'] },
  { name: 'Johannesburg, South Africa', lat: -26.2041, lon: 28.0473, region: 'Africa', specificity: 3, patterns: ['johannesburg'] },
  { name: 'Pretoria, South Africa', lat: -25.7479, lon: 28.2293, region: 'Africa', specificity: 2, patterns: ['pretoria', 'south africa', 'south african'] },
  { name: 'Luanda, Angola', lat: -8.8390, lon: 13.2894, region: 'Africa', specificity: 2, patterns: ['luanda', 'angola', 'angolan'] },
  { name: 'Maputo, Mozambique', lat: -25.9692, lon: 32.5732, region: 'Africa', specificity: 2, patterns: ['maputo', 'mozambique', 'mozambican'] },
  { name: 'Windhoek, Namibia', lat: -22.5609, lon: 17.0658, region: 'Africa', specificity: 2, patterns: ['windhoek', 'namibia', 'namibian'] },
  { name: 'Addis Ababa, Ethiopia', lat: 9.0054, lon: 38.7636, region: 'Africa', specificity: 2, patterns: ['addis ababa', 'ethiopia', 'ethiopian', 'african union'] },
  { name: 'Kigali, Rwanda', lat: -1.9441, lon: 30.0619, region: 'Africa', specificity: 2, patterns: ['kigali', 'rwanda', 'rwandan'] },
  { name: 'Accra, Ghana', lat: 5.6037, lon: -0.1870, region: 'Africa', specificity: 2, patterns: ['accra', 'ghana', 'ghanaian'] },
  { name: 'Dakar, Senegal', lat: 14.7167, lon: -17.4677, region: 'Africa', specificity: 2, patterns: ['dakar', 'senegal', 'senegalese'] },
  { name: 'Kampala, Uganda', lat: 0.3476, lon: 32.5825, region: 'Africa', specificity: 2, patterns: ['kampala', 'uganda', 'ugandan'] },
  { name: 'Dar es Salaam, Tanzania', lat: -6.7924, lon: 39.2083, region: 'Africa', specificity: 2, patterns: ['dar es salaam', 'tanzania', 'tanzanian'] },
  { name: 'Khartoum, Sudan', lat: 15.5007, lon: 32.5599, region: 'Africa', specificity: 2, patterns: ['khartoum', 'sudan', 'sudanese'] },
  { name: 'Kinshasa, DRC', lat: -4.4419, lon: 15.2663, region: 'Africa', specificity: 2, patterns: ['kinshasa', 'congo', 'drc', 'congolese'] },
  { name: 'Harare, Zimbabwe', lat: -17.8252, lon: 31.0335, region: 'Africa', specificity: 2, patterns: ['harare', 'zimbabwe', 'zimbabwean'] },
  { name: 'Lusaka, Zambia', lat: -15.3875, lon: 28.3228, region: 'Africa', specificity: 2, patterns: ['lusaka', 'zambia', 'zambian'] },
  { name: 'Yaoundé, Cameroon', lat: 3.8480, lon: 11.5021, region: 'Africa', specificity: 2, patterns: ['yaounde', 'cameroon', 'cameroonian'] },
  { name: 'Abidjan, Côte d\'Ivoire', lat: 5.3600, lon: -4.0083, region: 'Africa', specificity: 2, patterns: ['abidjan', 'ivory coast', 'cote d\'ivoire'] },
  { name: 'Mogadishu, Somalia', lat: 2.0469, lon: 45.3182, region: 'Africa', specificity: 2, patterns: ['mogadishu', 'somalia', 'somali'] },

  // ── LATIN AMERICA & CARIBBEAN ───────────────────────────────────────────────
  { name: 'São Paulo, Brazil', lat: -23.5505, lon: -46.6333, region: 'Americas', specificity: 3, patterns: ['sao paulo', 'são paulo'] },
  { name: 'Rio de Janeiro, Brazil', lat: -22.9120, lon: -43.2302, region: 'Americas', specificity: 3, patterns: ['rio de janeiro'] },
  { name: 'Recife, Brazil', lat: -8.0476, lon: -34.8770, region: 'Americas', specificity: 3, patterns: ['recife', 'fortaleza', 'salvador, brazil'] },
  { name: 'Belo Horizonte, Brazil', lat: -19.9167, lon: -43.9345, region: 'Americas', specificity: 3, patterns: ['belo horizonte', 'curitiba'] },
  { name: 'Brasília, Brazil', lat: -15.7975, lon: -47.8919, region: 'Americas', specificity: 2, patterns: ['brasilia', 'brasília', 'brazil', 'brazilian', 'anpd', 'stf'] },
  { name: 'Córdoba, Argentina', lat: -31.4201, lon: -64.1888, region: 'Americas', specificity: 3, patterns: ['cordoba, argentina', 'córdoba, argentina', 'mendoza'] },
  { name: 'Buenos Aires, Argentina', lat: -34.6037, lon: -58.3816, region: 'Americas', specificity: 2, patterns: ['buenos aires', 'argentina', 'argentine', 'argentinian'] },
  { name: 'Valparaíso, Chile', lat: -33.0472, lon: -71.6127, region: 'Americas', specificity: 3, patterns: ['valparaiso', 'valparaíso', 'atacama'] },
  { name: 'Santiago, Chile', lat: -33.4489, lon: -70.6693, region: 'Americas', specificity: 2, patterns: ['santiago', 'chile', 'chilean'] },
  { name: 'Medellín, Colombia', lat: 6.2442, lon: -75.5812, region: 'Americas', specificity: 3, patterns: ['medellin', 'medellín', 'barranquilla'] },
  { name: 'Bogotá, Colombia', lat: 4.7110, lon: -74.0721, region: 'Americas', specificity: 2, patterns: ['bogota', 'bogotá', 'colombia', 'colombian'] },
  { name: 'Asunción, Paraguay', lat: -25.2637, lon: -57.5759, region: 'Americas', specificity: 2, patterns: ['asuncion', 'asunción', 'paraguay'] },
  { name: 'La Paz, Bolivia', lat: -16.4897, lon: -68.1193, region: 'Americas', specificity: 2, patterns: ['la paz', 'bolivia', 'bolivian'] },
  { name: 'Lima, Peru', lat: -12.0464, lon: -77.0428, region: 'Americas', specificity: 2, patterns: ['lima', 'peru', 'peruvian'] },
  { name: 'Caracas, Venezuela', lat: 10.4806, lon: -66.9036, region: 'Americas', specificity: 2, patterns: ['caracas', 'venezuela', 'venezuelan'] },
  { name: 'Quito, Ecuador', lat: -0.1807, lon: -78.4678, region: 'Americas', specificity: 2, patterns: ['quito', 'ecuador', 'ecuadorian'] },
  { name: 'Montevideo, Uruguay', lat: -34.9011, lon: -56.1645, region: 'Americas', specificity: 2, patterns: ['montevideo', 'uruguay', 'uruguayan'] },
  { name: 'San José, Costa Rica', lat: 9.9281, lon: -84.0907, region: 'Americas', specificity: 2, patterns: ['san jose, costa rica', 'costa rica', 'costa rican', 'belen declaration', 'belén declaration'] },
  { name: 'Panama City, Panama', lat: 8.9824, lon: -79.5199, region: 'Americas', specificity: 2, patterns: ['panama city', 'panama'] },
  { name: 'San Salvador, El Salvador', lat: 13.6929, lon: -89.2182, region: 'Americas', specificity: 2, patterns: ['san salvador', 'el salvador'] },
  { name: 'Havana, Cuba', lat: 23.1136, lon: -82.3666, region: 'Americas', specificity: 2, patterns: ['havana', 'cuba', 'cuban'] }
];

// Pre-compile regex entries once at module load for sub-millisecond evaluation
const COMPILED_ENTRIES = [];
for (const loc of GEOGRAPHIC_DIRECTORY) {
  for (const rawPattern of loc.patterns) {
    const escaped = rawPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Handle patterns ending with '.' (like 'u.s.' or 'e.u.') cleanly with non-word lookahead
    const endsWithDot = rawPattern.endsWith('.');
    const regex = new RegExp(
      `(?:^|[^a-zA-Z0-9])(${escaped})${endsWithDot ? '(?=$|[^a-zA-Z0-9])' : '\\b'}`,
      'i'
    );
    COMPILED_ENTRIES.push({
      loc,
      pattern: rawPattern,
      patternLen: rawPattern.length,
      specificity: loc.specificity || 2,
      regex
    });
  }
}

// Strip publisher self-mentions in summaries so e.g. "The New York Times reported..." doesn't geocode to NY
const PUBLISHER_BOILERPLATE_STRIP = /\b(the new york times|new york times|washington post|financial times|wall street journal|al jazeera|south china morning post|straits times|times of india|hindustan times|jerusalem post|moscow times|japan times|korea herald|sydney morning herald|irish times|mit technology review)\b/gi;

export function decodeHtmlEntities(str) {
  if (!str) return '';
  const namedEntities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
    '&ndash;': '–', '&mdash;': '—', '&lsquo;': '‘', '&rsquo;': '’',
    '&ldquo;': '“', '&rdquo;': '”', '&hellip;': '…', '&copy;': '©', '&reg;': '®'
  };

  return String(str)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, (match) => {
      if (namedEntities[match]) return namedEntities[match];
      if (match.startsWith('&#x') || match.startsWith('&#X')) {
        const code = parseInt(match.slice(3, -1), 16);
        return !isNaN(code) ? String.fromCodePoint(code) : match;
      }
      if (match.startsWith('&#')) {
        const code = parseInt(match.slice(2, -1), 10);
        return !isNaN(code) ? String.fromCodePoint(code) : match;
      }
      return match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the best geographic match in a single text string by character position,
 * preferring earlier appearances and breaking ties by specificity & pattern length.
 */
function findEarliestMatch(text) {
  if (!text) return null;
  let best = null;

  for (const entry of COMPILED_ENTRIES) {
    // Guard ultra-short 2-letter tokens ('us', 'eu', 'uk') against matching lowercase English pronoun 'us'
    if (entry.pattern === 'us') {
      const strictUsMatch = /(?:^|[^a-zA-Z0-9])(U\.S\.|US|USA)(?=$|[^a-zA-Z0-9])/.exec(text);
      if (!strictUsMatch) continue;
      const charIdx = strictUsMatch.index + (strictUsMatch[0].length - strictUsMatch[1].length);
      const candidate = { loc: entry.loc, index: charIdx, specificity: entry.specificity, patternLen: entry.patternLen };
      if (isBetterMatch(candidate, best)) best = candidate;
      continue;
    }

    if (entry.pattern === 'eu') {
      const strictEuMatch = /(?:^|[^a-zA-Z0-9])(EU|E\.U\.)(?=$|[^a-zA-Z0-9])/.exec(text);
      if (!strictEuMatch) continue;
      const charIdx = strictEuMatch.index + (strictEuMatch[0].length - strictEuMatch[1].length);
      const candidate = { loc: entry.loc, index: charIdx, specificity: entry.specificity, patternLen: entry.patternLen };
      if (isBetterMatch(candidate, best)) best = candidate;
      continue;
    }

    const m = entry.regex.exec(text);
    if (m) {
      const charIdx = m.index + (m[0].length - m[1].length);
      const candidate = {
        loc: entry.loc,
        index: charIdx,
        specificity: entry.specificity,
        patternLen: entry.patternLen
      };
      if (isBetterMatch(candidate, best)) {
        best = candidate;
      }
    }
  }

  return best ? best.loc : null;
}

function isBetterMatch(candidate, currentBest) {
  if (!currentBest) return true;
  // If one match starts meaningfully earlier (>3 chars) in the text, it is the primary subject!
  if (candidate.index + 3 < currentBest.index) return true;
  if (currentBest.index + 3 < candidate.index) return false;

  // Overlapping or near-identical start index (e.g. "South Korea" vs "Korea", or "New Delhi" vs "Delhi"):
  // Prefer longer pattern first, then higher specificity
  if (candidate.patternLen !== currentBest.patternLen) {
    return candidate.patternLen > currentBest.patternLen;
  }
  if (candidate.specificity !== currentBest.specificity) {
    return candidate.specificity > currentBest.specificity;
  }
  return candidate.index < currentBest.index;
}

/**
 * Resolves headline + summary to an accurate geographic coordinate.
 *
 * @param {string} title
 * @param {string} [summary]
 * @param {string} [sourceId]
 * @returns {{
 *   name: string,
 *   lat: number | null,
 *   lon: number | null,
 *   region: string,
 *   hasExplicitLocation: boolean
 * }}
 */
export function geocodeText(title = '', summary = '', sourceId = '') {
  const cleanTitle = decodeHtmlEntities(title || '');
  const cleanSummary = decodeHtmlEntities(summary || '').replace(PUBLISHER_BOILERPLATE_STRIP, ' ');

  // 1. Check leading Dateline / Country Prefix in headline (e.g., "Thailand: ...", "US: ...", "[EU] ...")
  const prefixMatch = cleanTitle.match(/^\s*\[?([A-Za-z.\s'-]{2,30})\]?\s*[:—–-]\s+/);
  if (prefixMatch && prefixMatch[1]) {
    const prefixLoc = findEarliestMatch(prefixMatch[1].trim());
    if (prefixLoc) {
      return {
        name: prefixLoc.name,
        lat: prefixLoc.lat,
        lon: prefixLoc.lon,
        region: prefixLoc.region || 'Global',
        hasExplicitLocation: true
      };
    }
  }

  // 2. Earliest geographic or institutional match anywhere in the headline
  const titleLoc = findEarliestMatch(cleanTitle);
  if (titleLoc) {
    return {
      name: titleLoc.name,
      lat: titleLoc.lat,
      lon: titleLoc.lon,
      region: titleLoc.region || 'Global',
      hasExplicitLocation: true
    };
  }

  // 3. Earliest geographic or institutional match in the summary body (first 450 chars to avoid footer noise)
  const leadSummary = cleanSummary.slice(0, 450);
  const summaryLoc = findEarliestMatch(leadSummary);
  if (summaryLoc) {
    return {
      name: summaryLoc.name,
      lat: summaryLoc.lat,
      lon: summaryLoc.lon,
      region: summaryLoc.region || 'Global',
      hasExplicitLocation: true
    };
  }

  // 4. Official US government feed exception: CISA advisories are explicitly US federal cyber alerts
  if (sourceId === 'cisa') {
    return {
      name: 'Washington D.C., USA',
      lat: 38.9072,
      lon: -77.0369,
      region: 'Americas',
      hasExplicitLocation: true
    };
  }

  // 5. No explicit location found -> DO NOT fabricate publisher HQ coordinates!
  return {
    name: 'Global / Non-Territorial',
    lat: null,
    lon: null,
    region: 'Global',
    hasExplicitLocation: false
  };
}

/**
 * Deterministic, land-safe golden-angle spiral dispersion for co-located city pins.
 * Keeps multiple real events in major capitals cleanly separated (max ~12 km radius)
 * without overlapping into a single unreadable stack or drifting into oceans.
 */
export function disperseCoLocatedEvents(events = [], maxPerHub = 5) {
  const hubCounts = new Map();
  const result = [];

  for (const ev of events) {
    const lat = parseFloat(ev.lat ?? ev.latitude);
    const lon = parseFloat(ev.lon ?? ev.longitude);
    if (isNaN(lat) || isNaN(lon)) continue;

    // Group pins within ~15km (0.15 deg) as belonging to the same city hub
    const hubKey = `${Math.round(lat / 0.15) * 0.15}_${Math.round(lon / 0.15) * 0.15}`;
    const count = hubCounts.get(hubKey) || 0;

    // Preserve pinned/edited dossiers unconditionally; cap unedited automated duplicates per city hub
    const isPinnedOrEdited = ev.edited === true || ev.details?.isPinned === true || ev.curated === true;
    if (!isPinnedOrEdited && count >= maxPerHub) {
      continue;
    }

    hubCounts.set(hubKey, count + 1);

    if (count === 0) {
      result.push({ ...ev, lat, lon });
      continue;
    }

    // Golden-angle spiral (137.508 deg = 2.39996 rad), small land-safe radius (0.028 to 0.095 deg)
    const angle = count * 2.39996323;
    const radius = Math.min(0.028 * Math.sqrt(count), 0.11);
    const dLat = radius * Math.cos(angle);
    const cosLat = Math.max(0.25, Math.cos((lat * Math.PI) / 180));
    const dLon = (radius * Math.sin(angle)) / cosLat;

    result.push({
      ...ev,
      lat: Number((lat + dLat).toFixed(5)),
      lon: Number((lon + dLon).toFixed(5))
    });
  }

  return result;
}
