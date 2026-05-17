/**
 * Pure JavaScript Keplerian Orbital Propagator
 * Highly optimized, zero-dependency engine for real-time aerospace tracking.
 */

const GM = 3.986004418e14; // Earth's standard gravitational parameter (m^3/s^2)
const R_E = 6378137.0;     // Earth's equatorial WGS84 radius (meters)
const O_ROT = 7.292115e-5; // Earth's rotation angular velocity (rad/s)

/**
 * Solves Kepler's Equation E - e * sin(E) = M using Newton-Raphson iteration.
 * @param {number} M Mean Anomaly (radians)
 * @param {number} e Eccentricity
 * @returns {number} Eccentric Anomaly (radians)
 */
function solveKepler(M, e) {
  let E = M;
  for (let step = 0; step < 5; step++) {
    const dE = (M - (E - e * Math.sin(E))) / (1.0 - e * Math.cos(E));
    E += dE;
  }
  return E;
}

/**
 * Propagates a satellite's state to a specific time.
 * @param {object} sat Satellite elements database entry
 * @param {number} timeMs Timestamp in milliseconds
 * @returns {object} Full propagated telemetry state (ECEF coordinates, lat, lon, alt, speed)
 */
export function propagateSatellite(sat, timeMs) {
  const { a, e, i, raan, argPerigee, meanAnomaly } = sat;

  // 1. Convert initial angles to radians
  const iRad = (i * Math.PI) / 180;
  const raanRad = (raan * Math.PI) / 180;
  const argRad = (argPerigee * Math.PI) / 180;
  const m0Rad = (meanAnomaly * Math.PI) / 180;

  // 2. Mean motion (n) and mean anomaly (M) propagation
  const n = Math.sqrt(GM / Math.pow(a, 3)); // Mean motion (rad/s)
  const t = timeMs / 1000;                  // Elapsed seconds
  const M = (m0Rad + n * t) % (2 * Math.PI);

  // 3. Solve Kepler's Equation
  const E = solveKepler(M, e);

  // 4. Coordinates in orbital plane
  const xOrb = a * (Math.cos(E) - e);
  const yOrb = a * Math.sqrt(1.0 - e * e) * Math.sin(E);

  // 5. Rotate from orbital plane to ECI (Earth-Centered Inertial)
  const cosO = Math.cos(raanRad), sinO = Math.sin(raanRad);
  const cosI = Math.cos(iRad), sinI = Math.sin(iRad);
  const cosW = Math.cos(argRad), sinW = Math.sin(argRad);

  const xEci = xOrb * (cosO * cosW - sinO * sinW * cosI) - yOrb * (cosO * sinW + sinO * cosW * cosI);
  const yEci = xOrb * (sinO * cosW + cosO * sinW * cosI) - yOrb * (sinO * sinW - cosO * cosW * cosI);
  const zEci = xOrb * (sinW * sinI) + yOrb * (cosW * sinI);

  // 6. Convert ECI to ECEF (Earth-Centered Earth-Fixed) - Earth's Rotation
  const gst = (t * O_ROT) % (2 * Math.PI); // Greenwich Sidereal Time approximation
  const cosG = Math.cos(gst), sinG = Math.sin(gst);

  const xEcef = xEci * cosG + yEci * sinG;
  const yEcef = -xEci * sinG + yEci * cosG;
  const zEcef = zEci;

  // 7. Calculate Geodetic Telemetry (lat, lon, alt, speed)
  const r = Math.sqrt(xEcef * xEcef + yEcef * yEcef + zEcef * zEcef);
  const alt = r - R_E;

  const lat = Math.asin(zEcef / r) * (180 / Math.PI);
  const lon = Math.atan2(yEcef, xEcef) * (180 / Math.PI);

  // Exact speed using vis-viva equation: v^2 = GM * (2/r - 1/a)
  const speed = Math.sqrt(GM * (2.0 / r - 1.0 / a)); // in m/s
  const speedKmS = speed / 1000;                     // in km/s

  const periodMins = (2 * Math.PI * Math.sqrt(Math.pow(a, 3) / GM)) / 60;

  return {
    position: { x: xEcef, y: yEcef, z: zEcef },
    lat,
    lon,
    alt: alt / 1000, // in km
    speed: speedKmS, // in km/s
    period: periodMins
  };
}

/**
 * Generates an array of ECEF coordinates representing a full orbit path at a specific reference time.
 * @param {object} sat Satellite elements database entry
 * @param {number} referenceTimeMs Current time reference
 * @param {number} pointsCount Number of points to sample (e.g. 120 points for smooth ellipse)
 * @returns {Array} Array of {x, y, z} ECEF Cartesian coordinates representing the orbital ring
 */
export function generateOrbitPath(sat, referenceTimeMs, pointsCount = 120) {
  const { a } = sat;
  const periodSecs = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / GM);
  const stepSecs = periodSecs / pointsCount;
  const path = [];

  for (let step = 0; step < pointsCount; step++) {
    const timeOffsetMs = step * stepSecs * 1000;
    const propagated = propagateSatellite(sat, referenceTimeMs + timeOffsetMs);
    path.push(propagated.position);
  }

  // Close the loop beautifully by adding first point to the end
  if (path.length > 0) {
    path.push(path[0]);
  }

  return path;
}
