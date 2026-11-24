import { NextResponse } from 'next/server';

const CELESTRAK_CACHE_TTL_MS = 60 * 60 * 1000;
let celestrakStationCache = { fetchedAt: 0, byNorad: {} };

async function getCelesTrakStationOverrides() {
  const now = Date.now();
  if (celestrakStationCache.fetchedAt && now - celestrakStationCache.fetchedAt < CELESTRAK_CACHE_TTL_MS) {
    return celestrakStationCache.byNorad;
  }
  try {
    const res = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json', {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'SovereignObservatory/2.0' }
    });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        const map = {};
        for (const row of list) {
          const id = String(row.NORAD_CAT_ID || '').trim();
          const meanMotion = Number(row.MEAN_MOTION);
          const inc = Number(row.INCLINATION);
          const raan = Number(row.RA_OF_ASC_NODE);
          if (id && Number.isFinite(meanMotion) && meanMotion > 0) {
            map[id] = {
              period: Number((1440 / meanMotion).toFixed(2)),
              inclination: Number.isFinite(inc) ? inc : undefined,
              raan: Number.isFinite(raan) ? raan : undefined
            };
          }
        }
        celestrakStationCache = { fetchedAt: now, byNorad: map };
        return map;
      }
    }
  } catch {}
  return celestrakStationCache.byNorad || {};
}

// 42 tracked spacecraft with NORAD IDs, Keplerian parameters & AI/Policy/OSINT metadata
const BASE_SATELLITES = [
  // Orbital Research Stations
  {
    id: '25544', name: 'ISS (ZARYA)', code: '25544', launchDate: '1998-11-20', country: 'US / International',
    operator: 'NASA / Roscosmos / ESA / JAXA / CSA', missionType: 'station', orbitRegime: 'LEO',
    altitude: 420, period: 92.8, inclination: 51.64, raan: 45.0, phaseOffset: 0.0, swathRadiusKm: 420,
    purpose: 'Crewed Orbital Microgravity & Earth Observation Lab',
    strategicRelevance: 'International treaty governance model (1998 IGA) and orbital AI edge-compute & Earth-observation testbed.'
  },
  {
    id: '48274', name: 'TIANGONG (CSS)', code: '48274', launchDate: '2021-04-29', country: 'China (CNSA)',
    operator: 'CMSA / CNSA', missionType: 'station', orbitRegime: 'LEO',
    altitude: 389, period: 92.3, inclination: 41.58, raan: 220.0, phaseOffset: 1.2, swathRadiusKm: 390,
    purpose: 'Sovereign Modular Crewed Space Station',
    strategicRelevance: 'Autonomous robotic arm servicing, on-orbit AI experiment modules, and independent Chinese human-spaceflight governance.'
  },

  // Earth Observation, Synthetic Aperture Radar & Climate AI Monitoring
  {
    id: '20580', name: 'HUBBLE SPACE TELESCOPE', code: '20580', launchDate: '1990-04-24', country: 'US (NASA)',
    operator: 'NASA / ESA / STScI', missionType: 'science', orbitRegime: 'LEO',
    altitude: 535, period: 95.4, inclination: 28.47, raan: 120.0, phaseOffset: 0.5, swathRadiusKm: 280,
    purpose: 'Deep-Space Optical & UV Astrophysics Observatory',
    strategicRelevance: 'Foundational open-archive scientific image corpus powering astrophysics foundation models and anomaly-detection AI.'
  },
  {
    id: '27386', name: 'ENVISAT', code: '27386', launchDate: '2002-03-01', country: 'ESA (Europe)',
    operator: 'European Space Agency', missionType: 'earth_obs', orbitRegime: 'LEO',
    altitude: 790, period: 101.0, inclination: 98.54, raan: 15.0, phaseOffset: 0.8, swathRadiusKm: 520,
    purpose: 'Legacy Multi-Sensor Environmental Archive Craft',
    strategicRelevance: 'Multi-decadal climate baseline dataset referenced in AI climate modeling and space-debris mitigation law.'
  },
  {
    id: '37849', name: 'SUOMI NPP', code: '37849', launchDate: '2011-10-28', country: 'US (NOAA)',
    operator: 'NOAA / NASA', missionType: 'earth_obs', orbitRegime: 'LEO',
    altitude: 824, period: 101.0, inclination: 98.7, raan: 75.0, phaseOffset: 0.2, swathRadiusKm: 620,
    purpose: 'VIIRS Polar Climate & Nighttime Lights Radiometer',
    strategicRelevance: 'Feeds global disaster-response models, wildfire heat alerts, and conflict-zone grid blackout verification.'
  },
  {
    id: '43013', name: 'NOAA-20 (JPSS-1)', code: '43013', launchDate: '2017-11-18', country: 'US (NOAA)',
    operator: 'NOAA', missionType: 'earth_obs', orbitRegime: 'LEO',
    altitude: 825, period: 101.2, inclination: 98.7, raan: 205.0, phaseOffset: 1.1, swathRadiusKm: 620,
    purpose: 'Next-Generation Polar Numerical Weather Sensor',
    strategicRelevance: 'Primary input stream for global ML weather-forecasting foundation models (GraphCast, GenCast, FourCastNet).'
  },
  {
    id: '25994', name: 'TERRA (EOS AM-1)', code: '25994', launchDate: '1999-12-18', country: 'US (NASA)',
    operator: 'NASA Earth Observing System', missionType: 'earth_obs', orbitRegime: 'LEO',
    altitude: 705, period: 98.8, inclination: 98.2, raan: 310.0, phaseOffset: 0.35, swathRadiusKm: 540,
    purpose: 'MODIS Land, Aerosol & Thermal Anomaly Observatory',
    strategicRelevance: 'Open NASA GIBS & EONET source data verifying global thermal events, cloud cover, and environmental stress.'
  },
  {
    id: '27424', name: 'AQUA (EOS PM-1)', code: '27424', launchDate: '2002-05-04', country: 'US (NASA)',
    operator: 'NASA Earth Observing System', missionType: 'earth_obs', orbitRegime: 'LEO',
    altitude: 705, period: 98.9, inclination: 98.2, raan: 130.0, phaseOffset: 0.9, swathRadiusKm: 540,
    purpose: 'Global Precipitation, Drought & Water-Cycle Sensor',
    strategicRelevance: 'Monitors regional drought & basin stress affecting hyperscale AI data-center cooling allocations.'
  },
  {
    id: '39634', name: 'SENTINEL-1A', code: '39634', launchDate: '2014-04-03', country: 'ESA (Europe)',
    operator: 'Copernicus / ESA', missionType: 'earth_obs', orbitRegime: 'LEO',
    altitude: 693, period: 98.6, inclination: 98.18, raan: 40.0, phaseOffset: 0.1, swathRadiusKm: 400,
    purpose: 'All-Weather C-Band Synthetic Aperture Radar (SAR)',
    strategicRelevance: 'Open SAR radar used in automated UN/OSINT war-crime verification, ship dark-fleet detection, and flood mapping.'
  },
  {
    id: '40697', name: 'SENTINEL-2A', code: '40697', launchDate: '2015-06-23', country: 'ESA (Europe)',
    operator: 'Copernicus / ESA', missionType: 'earth_obs', orbitRegime: 'LEO',
    altitude: 786, period: 100.6, inclination: 98.57, raan: 160.0, phaseOffset: 0.45, swathRadiusKm: 450,
    purpose: '10m Multispectral Land & Conflict Verification',
    strategicRelevance: 'High-revisit EU open imagery critical for transparent AI-assisted deforestation, mining, and conflict audits.'
  },
  {
    id: '41335', name: 'SENTINEL-3A', code: '41335', launchDate: '2016-02-16', country: 'ESA (Europe)',
    operator: 'Copernicus / EUMETSAT', missionType: 'earth_obs', orbitRegime: 'LEO',
    altitude: 815, period: 101.0, inclination: 98.65, raan: 280.0, phaseOffset: 0.7, swathRadiusKm: 560,
    purpose: 'Sea Surface Temperature & Ocean Color Altimetry',
    strategicRelevance: 'Supports subsea cable coastal risk monitoring, maritime heatwaves, and planetary climate modeling.'
  },
  {
    id: '42969', name: 'SENTINEL-5P', code: '42969', launchDate: '2017-10-13', country: 'ESA (Europe)',
    operator: 'Copernicus / ESA', missionType: 'earth_obs', orbitRegime: 'LEO',
    altitude: 824, period: 101.0, inclination: 98.7, raan: 345.0, phaseOffset: 1.3, swathRadiusKm: 650,
    purpose: 'TROPOMI Atmospheric Methane & NO₂ Spectrometer',
    strategicRelevance: 'Detects industrial gas flaring, LNG super-emitters, and fossil-grid emissions near energy & compute hubs.'
  },

  // Geostationary Weather Sentinels (GEO 35,786km)
  {
    id: '41866', name: 'GOES-16 (EAST)', code: '41866', launchDate: '2016-11-19', country: 'US (NOAA)',
    operator: 'NOAA / NASA', missionType: 'weather_geo', orbitRegime: 'GEO',
    altitude: 35786, period: 1436.0, inclination: 0.01, raan: 75.2, phaseOffset: 0.0, swathRadiusKm: 1800,
    purpose: 'Geostationary Americas Severe Weather Imager',
    strategicRelevance: 'Continuous Atlantic hurricane & severe weather tracking informing grid resilience for US/LATAM data centers.'
  },
  {
    id: '43226', name: 'GOES-17 (WEST)', code: '43226', launchDate: '2018-03-01', country: 'US (NOAA)',
    operator: 'NOAA / NASA', missionType: 'weather_geo', orbitRegime: 'GEO',
    altitude: 35786, period: 1436.0, inclination: 0.02, raan: 137.2, phaseOffset: 0.0, swathRadiusKm: 1800,
    purpose: 'Geostationary Pacific Climate & Fire Watch',
    strategicRelevance: 'Pacific typhoon and wildfire monitoring protecting critical US West Coast & Pacific subsea infrastructure.'
  },
  {
    id: '40892', name: 'METEOSAT-11 (MSG-4)', code: '40892', launchDate: '2015-07-15', country: 'EUMETSAT',
    operator: 'EUMETSAT', missionType: 'weather_geo', orbitRegime: 'GEO',
    altitude: 35786, period: 1436.0, inclination: 0.05, raan: 0.0, phaseOffset: 0.0, swathRadiusKm: 1800,
    purpose: 'Zero-Longitude Europe/Africa Weather Sentinel',
    strategicRelevance: 'Delivers continuous atmospheric telemetry across Africa, MENA, and Europe via EUMETSAT open data policy.'
  },

  // GNSS PNT Navigation Constellations (MEO 19,100-23,222km)
  { id: '28474', name: 'GPS BIIRM-1', code: '28474', launchDate: '2004-11-06', country: 'US (USSF)', operator: 'US Space Force', missionType: 'navigation', orbitRegime: 'MEO', altitude: 20200, period: 718.0, inclination: 55.0, raan: 60.0, phaseOffset: 0.0, swathRadiusKm: 1100, purpose: 'Precision Navigation & Timing (PNT)', strategicRelevance: 'L1/L2 civil timing and autonomous aviation navigation targeted in electronic-warfare GPS jamming zones.' },
  { id: '28874', name: 'GPS BIIRM-2', code: '28874', launchDate: '2005-09-26', country: 'US (USSF)', operator: 'US Space Force', missionType: 'navigation', orbitRegime: 'MEO', altitude: 20200, period: 718.0, inclination: 55.0, raan: 120.0, phaseOffset: 0.16, swathRadiusKm: 1100, purpose: 'Precision Navigation & Timing (PNT)', strategicRelevance: 'Timing synchronization backbone for global financial networks, telecom cell towers, and GNSS spoofing audits.' },
  { id: '29258', name: 'GPS BIIRM-3', code: '29258', launchDate: '2006-09-25', country: 'US (USSF)', operator: 'US Space Force', missionType: 'navigation', orbitRegime: 'MEO', altitude: 20200, period: 718.0, inclination: 55.0, raan: 180.0, phaseOffset: 0.33, swathRadiusKm: 1100, purpose: 'Precision Navigation & Timing (PNT)', strategicRelevance: 'Monitored by civilian ADS-B receivers to detect real-time GNSS interference over Black Sea, Baltic, and Levant corridors.' },
  { id: '32260', name: 'GPS BIIRM-4', code: '32260', launchDate: '2007-10-17', country: 'US (USSF)', operator: 'US Space Force', missionType: 'navigation', orbitRegime: 'MEO', altitude: 20200, period: 718.0, inclination: 55.0, raan: 240.0, phaseOffset: 0.5, swathRadiusKm: 1100, purpose: 'Precision Navigation & Timing (PNT)', strategicRelevance: 'Supports civilian GNSS signal authentication and autonomous logistics timing across Pacific and Americas corridors.' },
  { id: '32711', name: 'GPS BIIRM-5', code: '32711', launchDate: '2008-03-15', country: 'US (USSF)', operator: 'US Space Force', missionType: 'navigation', orbitRegime: 'MEO', altitude: 20200, period: 718.0, inclination: 55.0, raan: 300.0, phaseOffset: 0.66, swathRadiusKm: 1100, purpose: 'Precision Navigation & Timing (PNT)', strategicRelevance: 'Tracked in maritime AIS integrity verification and autonomous weapon-guidance countermeasures.' },
  { id: '36585', name: 'GPS BIIF-1', code: '36585', launchDate: '2010-05-28', country: 'US (USSF)', operator: 'US Space Force', missionType: 'navigation', orbitRegime: 'MEO', altitude: 20200, period: 718.0, inclination: 55.0, raan: 360.0, phaseOffset: 0.83, swathRadiusKm: 1100, purpose: 'Block IIF L5 Aviation PNT Node', strategicRelevance: 'Transmits dual-frequency anti-jamming L5 signals supporting safer civil aviation over EW conflict corridors.' },

  { id: '40889', name: 'GALILEO-20', code: '40889', launchDate: '2015-09-11', country: 'EU / ESA', operator: 'EUSPA / ESA', missionType: 'navigation', orbitRegime: 'MEO', altitude: 23222, period: 844.0, inclination: 56.0, raan: 45.0, phaseOffset: 0.1, swathRadiusKm: 1200, purpose: 'European Sovereign Authenticated GNSS', strategicRelevance: 'Features OSNMA cryptographic signal authentication designed to defeat state GNSS spoofing attacks.' },
  { id: '40890', name: 'GALILEO-21', code: '40890', launchDate: '2015-09-11', country: 'EU / ESA', operator: 'EUSPA / ESA', missionType: 'navigation', orbitRegime: 'MEO', altitude: 23222, period: 844.0, inclination: 56.0, raan: 165.0, phaseOffset: 0.4, swathRadiusKm: 1200, purpose: 'European Sovereign Authenticated GNSS', strategicRelevance: 'Pillar of European strategic autonomy in precision navigation and encrypted emergency Search & Rescue (SAR).' },
  { id: '41174', name: 'GALILEO-22', code: '41174', launchDate: '2015-12-17', country: 'EU / ESA', operator: 'EUSPA / ESA', missionType: 'navigation', orbitRegime: 'MEO', altitude: 23222, period: 844.0, inclination: 56.0, raan: 285.0, phaseOffset: 0.7, swathRadiusKm: 1200, purpose: 'European Sovereign Authenticated GNSS', strategicRelevance: 'Provides independent European civil-governance PNT telemetry outside military-controlled constellations.' },

  { id: '40358', name: 'GLONASS-801', code: '40358', launchDate: '2014-11-30', country: 'Russia (Roscosmos)', operator: 'Roscosmos', missionType: 'navigation', orbitRegime: 'MEO', altitude: 19100, period: 676.0, inclination: 64.8, raan: 15.0, phaseOffset: 0.05, swathRadiusKm: 1050, purpose: 'Russian High-Latitude Navigation Node', strategicRelevance: 'Higher 64.8° inclination optimizes Arctic & Eastern European navigation alongside regional electronic warfare deployments.' },
  { id: '40359', name: 'GLONASS-802', code: '40359', launchDate: '2014-11-30', country: 'Russia (Roscosmos)', operator: 'Roscosmos', missionType: 'navigation', orbitRegime: 'MEO', altitude: 19100, period: 676.0, inclination: 64.8, raan: 135.0, phaseOffset: 0.35, swathRadiusKm: 1050, purpose: 'Russian High-Latitude Navigation Node', strategicRelevance: 'Critical dual-use PNT asset studied in sanctions compliance, GNSS interference, and autonomous munition defense.' },
  { id: '40360', name: 'GLONASS-803', code: '40360', launchDate: '2014-11-30', country: 'Russia (Roscosmos)', operator: 'Roscosmos', missionType: 'navigation', orbitRegime: 'MEO', altitude: 19100, period: 676.0, inclination: 64.8, raan: 255.0, phaseOffset: 0.65, swathRadiusKm: 1050, purpose: 'Russian High-Latitude Navigation Node', strategicRelevance: 'Tracked for sovereign timing resilience and Arctic northern sea route autonomous navigation telemetry.' },

  // LEO Communications Mega-Constellations (Starlink, OneWeb, Iridium)
  { id: '44713', name: 'STARLINK-1011', code: '44713', launchDate: '2019-11-11', country: 'US (SpaceX)', operator: 'SpaceX', missionType: 'comms', orbitRegime: 'LEO', altitude: 550, period: 95.0, inclination: 53.0, raan: 0.0, phaseOffset: 0.0, swathRadiusKm: 480, purpose: 'Low-Latency Orbital Broadband Mesh', strategicRelevance: 'Raises private-actor sovereignty questions around wartime battlefield connectivity controls, spectrum dominance, and orbital safety.' },
  { id: '44714', name: 'STARLINK-1012', code: '44714', launchDate: '2019-11-11', country: 'US (SpaceX)', operator: 'SpaceX', missionType: 'comms', orbitRegime: 'LEO', altitude: 550, period: 95.0, inclination: 53.0, raan: 45.0, phaseOffset: 0.12, swathRadiusKm: 480, purpose: 'Low-Latency Orbital Broadband Mesh', strategicRelevance: 'Used across disaster-recovery zones, rural Global South connectivity debates, and drone command-and-control debates.' },
  { id: '44715', name: 'STARLINK-1013', code: '44715', launchDate: '2019-11-11', country: 'US (SpaceX)', operator: 'SpaceX', missionType: 'comms', orbitRegime: 'LEO', altitude: 550, period: 95.0, inclination: 53.0, raan: 90.0, phaseOffset: 0.24, swathRadiusKm: 480, purpose: 'Low-Latency Orbital Broadband Mesh', strategicRelevance: 'Subject of sovereign licensing, lawful-intercept mandates, and ITU orbital-slot concentration policy inquiries.' },
  { id: '44716', name: 'STARLINK-1014', code: '44716', launchDate: '2019-11-11', country: 'US (SpaceX)', operator: 'SpaceX', missionType: 'comms', orbitRegime: 'LEO', altitude: 550, period: 95.0, inclination: 53.0, raan: 135.0, phaseOffset: 0.36, swathRadiusKm: 480, purpose: 'Low-Latency Orbital Broadband Mesh', strategicRelevance: 'Optical inter-satellite laser links route encrypted traffic independent of terrestrial subsea cables.' },
  { id: '44717', name: 'STARLINK-1015', code: '44717', launchDate: '2019-11-11', country: 'US (SpaceX)', operator: 'SpaceX', missionType: 'comms', orbitRegime: 'LEO', altitude: 550, period: 95.0, inclination: 53.0, raan: 180.0, phaseOffset: 0.48, swathRadiusKm: 480, purpose: 'Low-Latency Orbital Broadband Mesh', strategicRelevance: 'Provides resilient bypass connectivity during state internet shutdowns while sparking regulatory sovereignty debates.' },
  { id: '44718', name: 'STARLINK-1016', code: '44718', launchDate: '2019-11-11', country: 'US (SpaceX)', operator: 'SpaceX', missionType: 'comms', orbitRegime: 'LEO', altitude: 550, period: 95.0, inclination: 53.0, raan: 225.0, phaseOffset: 0.6, swathRadiusKm: 480, purpose: 'Low-Latency Orbital Broadband Mesh', strategicRelevance: 'Tracked in orbital conjunction (Kessler risk) assessments alongside automated AI collision-avoidance maneuvers.' },
  { id: '44719', name: 'STARLINK-1017', code: '44719', launchDate: '2019-11-11', country: 'US (SpaceX)', operator: 'SpaceX', missionType: 'comms', orbitRegime: 'LEO', altitude: 550, period: 95.0, inclination: 53.0, raan: 270.0, phaseOffset: 0.72, swathRadiusKm: 480, purpose: 'Low-Latency Orbital Broadband Mesh', strategicRelevance: 'Dual-use space communications platform shaping UN outer-space non-militarization working groups.' },
  { id: '44720', name: 'STARLINK-1018', code: '44720', launchDate: '2019-11-11', country: 'US (SpaceX)', operator: 'SpaceX', missionType: 'comms', orbitRegime: 'LEO', altitude: 550, period: 95.0, inclination: 53.0, raan: 315.0, phaseOffset: 0.84, swathRadiusKm: 480, purpose: 'Low-Latency Orbital Broadband Mesh', strategicRelevance: 'Direct-to-cell payload testing alters cross-border telecommunications censorship & emergency broadcast control.' },

  { id: '45156', name: 'ONEWEB-0101', code: '45156', launchDate: '2020-02-06', country: 'UK / France (Eutelsat)', operator: 'Eutelsat OneWeb', missionType: 'comms', orbitRegime: 'LEO', altitude: 1200, period: 109.0, inclination: 87.9, raan: 25.0, phaseOffset: 0.05, swathRadiusKm: 640, purpose: 'High-Inclination Sovereign Broadband Node', strategicRelevance: 'UK-French sovereign-backed LEO constellation supporting allied maritime, Arctic, and enterprise resilience.' },
  { id: '45157', name: 'ONEWEB-0102', code: '45157', launchDate: '2020-02-06', country: 'UK / France (Eutelsat)', operator: 'Eutelsat OneWeb', missionType: 'comms', orbitRegime: 'LEO', altitude: 1200, period: 109.0, inclination: 87.9, raan: 145.0, phaseOffset: 0.35, swathRadiusKm: 640, purpose: 'High-Inclination Sovereign Broadband Node', strategicRelevance: 'Partnered with Bharti Airtel & regional telcos to extend sovereign-gateway rural broadband across India & Africa.' },
  { id: '45158', name: 'ONEWEB-0103', code: '45158', launchDate: '2020-02-06', country: 'UK / France (Eutelsat)', operator: 'Eutelsat OneWeb', missionType: 'comms', orbitRegime: 'LEO', altitude: 1200, period: 109.0, inclination: 87.9, raan: 265.0, phaseOffset: 0.65, swathRadiusKm: 640, purpose: 'High-Inclination Sovereign Broadband Node', strategicRelevance: 'Provides European and UK defense/humanitarian redundancy independent of US mega-constellations.' },

  { id: '41917', name: 'IRIDIUM-101', code: '41917', launchDate: '2017-01-14', country: 'US (Iridium)', operator: 'Iridium Communications', missionType: 'comms', orbitRegime: 'LEO', altitude: 780, period: 100.0, inclination: 86.4, raan: 30.0, phaseOffset: 0.0, swathRadiusKm: 600, purpose: 'Polar Cross-Linked L-Band Safety Network', strategicRelevance: 'Carries global GMDSS maritime distress, polar aviation ADS-B telemetry, and alternative STL encrypted PNT.' },
  { id: '41918', name: 'IRIDIUM-102', code: '41918', launchDate: '2017-01-14', country: 'US (Iridium)', operator: 'Iridium Communications', missionType: 'comms', orbitRegime: 'LEO', altitude: 780, period: 100.0, inclination: 86.4, raan: 90.0, phaseOffset: 0.25, swathRadiusKm: 600, purpose: 'Polar Cross-Linked L-Band Safety Network', strategicRelevance: 'Supports remote NGO humanitarian coordination and uninterruptible polar environmental sensor uplinks.' },
  { id: '41919', name: 'IRIDIUM-103', code: '41919', launchDate: '2017-01-14', country: 'US (Iridium)', operator: 'Iridium Communications', missionType: 'comms', orbitRegime: 'LEO', altitude: 780, period: 100.0, inclination: 86.4, raan: 150.0, phaseOffset: 0.5, swathRadiusKm: 600, purpose: 'Polar Cross-Linked L-Band Safety Network', strategicRelevance: 'Cross-linked mesh architecture operates autonomously without local ground gateways during regional blackouts.' },
  { id: '41920', name: 'IRIDIUM-104', code: '41920', launchDate: '2017-01-14', country: 'US (Iridium)', operator: 'Iridium Communications', missionType: 'comms', orbitRegime: 'LEO', altitude: 780, period: 100.0, inclination: 86.4, raan: 210.0, phaseOffset: 0.75, swathRadiusKm: 600, purpose: 'Polar Cross-Linked L-Band Safety Network', strategicRelevance: 'Relays Spire & Aireon global flight/maritime tracking telemetry used to pinpoint EW GPS-spoofing corridors.' }
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const limit = parseInt(searchParams.get('limit') || '42');

  const liveStations = await getCelesTrakStationOverrides();
  const nowMin = Date.now() / 1000 / 60;
  const EarthRotationSpeed = 360 / 1440;

  const propagated = BASE_SATELLITES.map((base) => {
    const live = liveStations[base.code];
    const sat = live
      ? {
          ...base,
          period: live.period ?? base.period,
          inclination: live.inclination ?? base.inclination,
          raan: live.raan ?? base.raan
        }
      : base;

    const inclinationRad = (sat.inclination * Math.PI) / 180;
    const theta = (2 * Math.PI * nowMin) / sat.period + sat.phaseOffset;

    const sinLat = Math.sin(inclinationRad) * Math.sin(theta);
    const latRad = Math.asin(Math.max(-1, Math.min(1, sinLat)));
    const latitude = (latRad * 180) / Math.PI;

    const yPrime = Math.cos(inclinationRad) * Math.sin(theta);
    const xPrime = Math.cos(theta);
    const lonOrbit = Math.atan2(yPrime, xPrime);

    const earthRotationDrift = (nowMin * EarthRotationSpeed) % 360;
    let longitude = (lonOrbit * 180) / Math.PI + sat.raan - earthRotationDrift;
    longitude = ((longitude + 180) % 360) - 180;
    if (longitude < -180) longitude += 360;

    const orbitalVelocity = Math.sqrt(398600.44 / (6378.1 + sat.altitude)).toFixed(2);
    const revPerDay = (1440 / sat.period).toFixed(2);

    return {
      ...sat,
      latitude: parseFloat(latitude.toFixed(5)),
      longitude: parseFloat(longitude.toFixed(5)),
      velocity: orbitalVelocity,
      revolutionsPerDay: revPerDay,
      desc: sat.purpose,
      ephemerisSource: live ? 'CelesTrak Live GP + Keplerian' : 'Sovereign Keplerian Propagator'
    };
  });

  if (code) {
    const single = propagated.find((s) => s.code === code);
    return NextResponse.json(single ? [single] : []);
  }

  return NextResponse.json(propagated.slice(0, limit));
}
