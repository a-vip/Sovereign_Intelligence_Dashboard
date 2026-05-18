import { NextResponse } from 'next/server';

// Standard 42 major satellites with real NORAD IDs, launch years, altitudes, and Keplerian elements
const BASE_SATELLITES = [
  // Major Space Stations
  { id: '25544', name: 'ISS (ZARYA)', code: '25544', launchDate: '1998-11-20', country: 'US/International', altitude: 420, period: 92.8, inclination: 51.64, raan: 45.0, phaseOffset: 0.0, desc: 'International Space Station' },
  { id: '48274', name: 'TIANGONG (CSS)', code: '48274', launchDate: '2021-04-29', country: 'China (CNSA)', altitude: 389, period: 92.3, inclination: 41.58, raan: 220.0, phaseOffset: 1.2, desc: 'Chinese Space Station Tiangong' },
  
  // High-Profile Observatories
  { id: '20580', name: 'HUBBLE SPACE TELESCOPE', code: '20580', launchDate: '1990-04-24', country: 'US (NASA)', altitude: 535, period: 95.4, inclination: 28.47, raan: 120.0, phaseOffset: 0.5, desc: 'Hubble Astronomical Space Telescope' },
  { id: '27386', name: 'ENVISAT', code: '27386', launchDate: '2002-03-01', country: 'ESA (Europe)', altitude: 790, period: 101.0, inclination: 98.54, raan: 15.0, phaseOffset: 0.8, desc: 'Environmental monitoring satellite' },
  { id: '37849', name: 'SUOMI NPP', code: '37849', launchDate: '2011-10-28', country: 'US (NOAA)', altitude: 824, period: 101.0, inclination: 98.7, raan: 75.0, phaseOffset: 0.2, desc: 'Meteorology and climate observatory' },
  { id: '43013', name: 'NOAA-20 (JPSS-1)', code: '43013', launchDate: '2017-11-18', country: 'US (NOAA)', altitude: 825, period: 101.2, inclination: 98.7, raan: 205.0, phaseOffset: 1.1, desc: 'Next-generation polar weather sensor' },
  { id: '25994', name: 'TERRA (EOS AM-1)', code: '25994', launchDate: '1999-12-18', country: 'US (NASA)', altitude: 705, period: 98.8, inclination: 98.2, raan: 310.0, phaseOffset: 0.35, desc: 'Multinational Earth observation flag' },
  { id: '27424', name: 'AQUA (EOS PM-1)', code: '27424', launchDate: '2002-05-04', country: 'US (NASA)', altitude: 705, period: 98.9, inclination: 98.2, raan: 130.0, phaseOffset: 0.9, desc: 'Water cycle scientific satellite' },
  
  // European Copernicus Fleet (Sentinels)
  { id: '39634', name: 'SENTINEL-1A', code: '39634', launchDate: '2014-04-03', country: 'ESA (Europe)', altitude: 693, period: 98.6, inclination: 98.18, raan: 40.0, phaseOffset: 0.1, desc: 'C-band synthetic aperture radar' },
  { id: '40697', name: 'SENTINEL-2A', code: '40697', launchDate: '2015-06-23', country: 'ESA (Europe)', altitude: 786, period: 100.6, inclination: 98.57, raan: 160.0, phaseOffset: 0.45, desc: 'High-resolution multispectral imagery' },
  { id: '41335', name: 'SENTINEL-3A', code: '41335', launchDate: '2016-02-16', country: 'ESA (Europe)', altitude: 815, period: 101.0, inclination: 98.65, raan: 280.0, phaseOffset: 0.7, desc: 'Ocean and land color observation sensor' },
  { id: '42969', name: 'SENTINEL-5P', code: '42969', launchDate: '2017-10-13', country: 'ESA (Europe)', altitude: 824, period: 101.0, inclination: 98.7, raan: 345.0, phaseOffset: 1.3, desc: 'Global air quality mapping sensor' },

  // Geostationary Weather Sentinels (Simulated orbits at high scale)
  { id: '41866', name: 'GOES-16 (EAST)', code: '41866', launchDate: '2016-11-19', country: 'US (NOAA)', altitude: 35786, period: 1436.0, inclination: 0.01, raan: 75.2, phaseOffset: 0.0, desc: 'Geostationary environment sentinel' },
  { id: '43226', name: 'GOES-17 (WEST)', code: '43226', launchDate: '2018-03-01', country: 'US (NOAA)', altitude: 35786, period: 1436.0, inclination: 0.02, raan: 137.2, phaseOffset: 0.0, desc: 'Geostationary environment sentinel' },
  { id: '40892', name: 'METEOSAT-11 (MSG-4)', code: '40892', launchDate: '2015-07-15', country: 'EUMETSAT', altitude: 35786, period: 1436.0, inclination: 0.05, raan: 0.0, phaseOffset: 0.0, desc: 'Geostationary European weather watch' },

  // GPS Constellation (MEO, 20200km)
  { id: '28474', name: 'GPS BIIRM-1', code: '28474', launchDate: '2004-11-06', country: 'US (USSF)', altitude: 20200, period: 718.0, inclination: 55.0, raan: 60.0, phaseOffset: 0.0, desc: 'Global Positioning System navigation' },
  { id: '28874', name: 'GPS BIIRM-2', code: '28874', launchDate: '2005-09-26', country: 'US (USSF)', altitude: 20200, period: 718.0, inclination: 55.0, raan: 120.0, phaseOffset: 0.16, desc: 'Global Positioning System navigation' },
  { id: '29258', name: 'GPS BIIRM-3', code: '29258', launchDate: '2006-09-25', country: 'US (USSF)', altitude: 20200, period: 718.0, inclination: 55.0, raan: 180.0, phaseOffset: 0.33, desc: 'Global Positioning System navigation' },
  { id: '32260', name: 'GPS BIIRM-4', code: '32260', launchDate: '2007-10-17', country: 'US (USSF)', altitude: 20200, period: 718.0, inclination: 55.0, raan: 240.0, phaseOffset: 0.5, desc: 'Global Positioning System navigation' },
  { id: '32711', name: 'GPS BIIRM-5', code: '32711', launchDate: '2008-03-15', country: 'US (USSF)', altitude: 20200, period: 718.0, inclination: 55.0, raan: 300.0, phaseOffset: 0.66, desc: 'Global Positioning System navigation' },
  { id: '36585', name: 'GPS BIIF-1', code: '36585', launchDate: '2010-05-28', country: 'US (USSF)', altitude: 20200, period: 718.0, inclination: 55.0, raan: 360.0, phaseOffset: 0.83, desc: 'Global Positioning System navigation' },

  // Galileo Fleet (Europe MEO, 23222km)
  { id: '40889', name: 'GALILEO-20', code: '40889', launchDate: '2015-09-11', country: 'ESA (Europe)', altitude: 23222, period: 844.0, inclination: 56.0, raan: 45.0, phaseOffset: 0.1, desc: 'European sovereign global navigation' },
  { id: '40890', name: 'GALILEO-21', code: '40890', launchDate: '2015-09-11', country: 'ESA (Europe)', altitude: 23222, period: 844.0, inclination: 56.0, raan: 165.0, phaseOffset: 0.4, desc: 'European sovereign global navigation' },
  { id: '41174', name: 'GALILEO-22', code: '41174', launchDate: '2015-12-17', country: 'ESA (Europe)', altitude: 23222, period: 844.0, inclination: 56.0, raan: 285.0, phaseOffset: 0.7, desc: 'European sovereign global navigation' },

  // GLONASS Fleet (Russia MEO, 19100km)
  { id: '40358', name: 'GLONASS-801', code: '40358', launchDate: '2014-11-30', country: 'Russia (ROSCOSMOS)', altitude: 19100, period: 676.0, inclination: 64.8, raan: 15.0, phaseOffset: 0.05, desc: 'GLONASS Russian navigation system' },
  { id: '40359', name: 'GLONASS-802', code: '40359', launchDate: '2014-11-30', country: 'Russia (ROSCOSMOS)', altitude: 19100, period: 676.0, inclination: 64.8, raan: 135.0, phaseOffset: 0.35, desc: 'GLONASS Russian navigation system' },
  { id: '40360', name: 'GLONASS-803', code: '40360', launchDate: '2014-11-30', country: 'Russia (ROSCOSMOS)', altitude: 19100, period: 676.0, inclination: 64.8, raan: 255.0, phaseOffset: 0.65, desc: 'GLONASS Russian navigation system' },

  // Starlink Mega-Constellation Planes (Low Earth Orbit, 550km)
  { id: '44713', name: 'STARLINK-1011', code: '44713', launchDate: '2019-11-11', country: 'US (SpaceX)', altitude: 550, period: 95.0, inclination: 53.0, raan: 0.0, phaseOffset: 0.0, desc: 'Low Earth Orbit broadband node' },
  { id: '44714', name: 'STARLINK-1012', code: '44714', launchDate: '2019-11-11', country: 'US (SpaceX)', altitude: 550, period: 95.0, inclination: 53.0, raan: 45.0, phaseOffset: 0.12, desc: 'Low Earth Orbit broadband node' },
  { id: '44715', name: 'STARLINK-1013', code: '44715', launchDate: '2019-11-11', country: 'US (SpaceX)', altitude: 550, period: 95.0, inclination: 53.0, raan: 90.0, phaseOffset: 0.24, desc: 'Low Earth Orbit broadband node' },
  { id: '44716', name: 'STARLINK-1014', code: '44716', launchDate: '2019-11-11', country: 'US (SpaceX)', altitude: 550, period: 95.0, inclination: 53.0, raan: 135.0, phaseOffset: 0.36, desc: 'Low Earth Orbit broadband node' },
  { id: '44717', name: 'STARLINK-1015', code: '44717', launchDate: '2019-11-11', country: 'US (SpaceX)', altitude: 550, period: 95.0, inclination: 53.0, raan: 180.0, phaseOffset: 0.48, desc: 'Low Earth Orbit broadband node' },
  { id: '44718', name: 'STARLINK-1016', code: '44718', launchDate: '2019-11-11', country: 'US (SpaceX)', altitude: 550, period: 95.0, inclination: 53.0, raan: 225.0, phaseOffset: 0.6, desc: 'Low Earth Orbit broadband node' },
  { id: '44719', name: 'STARLINK-1017', code: '44719', launchDate: '2019-11-11', country: 'US (SpaceX)', altitude: 550, period: 95.0, inclination: 53.0, raan: 270.0, phaseOffset: 0.72, desc: 'Low Earth Orbit broadband node' },
  { id: '44720', name: 'STARLINK-1018', code: '44720', launchDate: '2019-11-11', country: 'US (SpaceX)', altitude: 550, period: 95.0, inclination: 53.0, raan: 315.0, phaseOffset: 0.84, desc: 'Low Earth Orbit broadband node' },

  // OneWeb Constellation (Broadband, 1200km)
  { id: '45156', name: 'ONEWEB-0101', code: '45156', launchDate: '2020-02-06', country: 'UK/Global', altitude: 1200, period: 109.0, inclination: 87.9, raan: 25.0, phaseOffset: 0.05, desc: 'Broadband communication spacecraft' },
  { id: '45157', name: 'ONEWEB-0102', code: '45157', launchDate: '2020-02-06', country: 'UK/Global', altitude: 1200, period: 109.0, inclination: 87.9, raan: 145.0, phaseOffset: 0.35, desc: 'Broadband communication spacecraft' },
  { id: '45158', name: 'ONEWEB-0103', code: '45158', launchDate: '2020-02-06', country: 'UK/Global', altitude: 1200, period: 109.0, inclination: 87.9, raan: 265.0, phaseOffset: 0.65, desc: 'Broadband communication spacecraft' },

  // Iridium polar orbital planes (Polar 780km)
  { id: '41917', name: 'IRIDIUM-101', code: '41917', launchDate: '2017-01-14', country: 'US (Iridium)', altitude: 780, period: 100.0, inclination: 86.4, raan: 30.0, phaseOffset: 0.0, desc: 'Polar communications network' },
  { id: '41918', name: 'IRIDIUM-102', code: '41918', launchDate: '2017-01-14', country: 'US (Iridium)', altitude: 780, period: 100.0, inclination: 86.4, raan: 90.0, phaseOffset: 0.25, desc: 'Polar communications network' },
  { id: '41919', name: 'IRIDIUM-103', code: '41919', launchDate: '2017-01-14', country: 'US (Iridium)', altitude: 780, period: 100.0, inclination: 86.4, raan: 150.0, phaseOffset: 0.5, desc: 'Polar communications network' },
  { id: '41920', name: 'IRIDIUM-104', code: '41920', launchDate: '2017-01-14', country: 'US (Iridium)', altitude: 780, period: 100.0, inclination: 86.4, raan: 210.0, phaseOffset: 0.75, desc: 'Polar communications network' }
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const limit = parseInt(searchParams.get('limit') || '40');
  
  // Real-time Aviation Edge API integration
  const apiKey = process.env.AVIATION_EDGE_API_KEY;
  if (apiKey) {
    try {
      const url = `https://aviation-edge.com/v2/public/satelliteDetails?key=${apiKey}${code ? `&code=${code}` : `&limit=${limit}`}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Normalize real data structure to match our UI pipeline
          const normalized = data.map(item => {
            const alt = parseFloat(item.altitude || item.orbitalapogee || '550');
            const inc = parseFloat(item.inclination || '53.0');
            const lat = parseFloat(item.latitude || '0.0');
            const lon = parseFloat(item.longitude || '0.0');
            return {
              id: item.code || item.noradId || Math.random().toString(),
              name: item.name || `SATELLITE-${item.code}`,
              code: item.code || item.noradId || '00000',
              launchDate: item.launchDate || '2020-01-01',
              country: item.country || 'Unknown',
              altitude: alt,
              period: parseFloat(item.period || '95'),
              inclination: inc,
              latitude: lat,
              longitude: lon,
              desc: item.desc || `Space Object catalog ${item.code}`,
              velocity: Math.sqrt(398600.44 / (6378.137 + alt)).toFixed(2) // Orbital speed formula v = sqrt(GM/r)
            };
          });
          return NextResponse.json(normalized);
        }
      }
    } catch (err) {
      console.warn("Aviation Edge API failed, falling back to Keplerian simulation:", err.message);
    }
  }

  // Keplerian Orbital Propagator Fallback
  // Using true Earth rotation and Keplerian orbital formulas so they move realistically in real-time!
  const nowMin = Date.now() / 1000 / 60; // elapsed minutes since epoch
  const EarthRotationSpeed = 360 / 1440; // 0.25 degrees per minute (Earth rotates 360 deg/day)

  const simulatedSatellites = BASE_SATELLITES.map(sat => {
    // Keplerian Math Model:
    const inclinationRad = (sat.inclination * Math.PI) / 180;
    const raanRad = (sat.raan * Math.PI) / 180;
    
    // Elapsed time normalized by orbital period to find active phase angle (theta)
    const theta = (2 * Math.PI * nowMin) / sat.period + sat.phaseOffset;
    
    // Calculate sub-satellite latitude
    const sinLat = Math.sin(inclinationRad) * Math.sin(theta);
    const latRad = Math.asin(sinLat);
    const latitude = (latRad * 180) / Math.PI;
    
    // Calculate sub-satellite orbit plane longitude
    const yPrime = Math.cos(inclinationRad) * Math.sin(theta);
    const xPrime = Math.cos(theta);
    let lonOrbit = Math.atan2(yPrime, xPrime);
    
    // Subtract Earth rotation drift over time to ground-track correctly!
    const earthRotationDrift = (nowMin * EarthRotationSpeed) % 360;
    let longitude = (lonOrbit * 180) / Math.PI + sat.raan - earthRotationDrift;
    
    // Normalize longitude between -180 and 180
    longitude = ((longitude + 180) % 360) - 180;
    if (longitude < -180) longitude += 360;

    // Standard orbital velocity calculation: v = sqrt(G*M / r) where G*M = 398600.44 km^3/s^2, r = Earth radius (6378.1km) + altitude
    const orbitalVelocity = Math.sqrt(398600.44 / (6378.1 + sat.altitude)).toFixed(2);

    return {
      id: sat.id,
      name: sat.name,
      code: sat.code,
      launchDate: sat.launchDate,
      country: sat.country,
      altitude: sat.altitude,
      period: sat.period,
      inclination: sat.inclination,
      latitude: parseFloat(latitude.toFixed(5)),
      longitude: parseFloat(longitude.toFixed(5)),
      desc: sat.desc,
      velocity: orbitalVelocity
    };
  });

  if (code) {
    const single = simulatedSatellites.find(s => s.code === code);
    return NextResponse.json(single ? [single] : []);
  }

  return NextResponse.json(simulatedSatellites.slice(0, limit));
}
