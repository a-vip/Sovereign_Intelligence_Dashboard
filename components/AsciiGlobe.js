'use client';
import { useEffect, useState } from 'react';

const HIGH_TECH_LOGS_LEFT = [
  '[ OK ] INGESTING GDELT STREAM...',
  '[ OK ] RESOLVING OSINT PROXIES...',
  '[SEC] SHA-256 KEY ACQUIRED',
  '[OK] STOP KILLER ROBOTS DB SYNC',
  '[OK] LAWS DISARMAMENT FEED ON',
  'SYS_LAT: 35.8617° N [CHINA]',
  'SYS_LON: 104.1954° E [CHINA]',
  'PORT: 443 [HTTPS/SECURE]',
  'SYS_LOAD: 21.4% (CORES: 8)',
  '[OK] OBSIDIAN VAULT SYNCED',
  'VAULT: sovereign-intelligence',
  'TELEMETRY: ACTIVE',
  'SIGINT_GEO: RESOLVED [CHINA]',
  'SIGINT_GEO: RESOLVED [GENEVA]',
  'SIGINT_GEO: RESOLVED [REUTERS]',
  '[WARN] STATE LAWS VIOLATED',
  '[OK] GDELT INGESTION CRON ACTIVE',
  '[OK] LOCAL PERSIST DB INSTANCE',
  '[OK] VERCEL DEPLOYMENT SECURE',
  '[OK] SIGNAL LOCK ACQUIRED',
  '[OK] RESOLVED HIGH FIDELITY CITY',
  'SYS_LAT: 31.3500° N [GAZA]',
  'SYS_LON: 34.3000° E [GAZA]',
  'SYS_LAT: 50.4501° N [KYIV]'
];

const HIGH_TECH_LOGS_RIGHT = [
  'FEED: [ stop-killer-robots ]',
  'FEED: [ gdacs-humanitarian ]',
  'FEED: [ reliefweb-ocha ]',
  'SIGNAL: [ LOCK_ON_TARGET ]',
  'STATUS: MONITORING ANOMALIES',
  'MONITOR: LAWS Disarmament',
  'MONITOR: Autonomous Weapons',
  'MONITOR: State Violations',
  'DECRYPT: FT.COM live wires...',
  'DECRYPT: REUTERS global...',
  'DECRYPT: AL JAZEERA intel...',
  'SYS_ELEVATION: 38.2°',
  'SYS_AZIMUTH: 184.9°',
  'RANGE: 8,421 KM',
  'SIGNAL_QUALITY: 99.2%',
  'SEC_LEVEL: ALPHA-5 [TOP_SEC]',
  'CRON: api/cron/ingest ACTIVE',
  'POSTGRES_DB: [ CONNECTED ]',
  'COMPILATION: SUCCESSFUL [200]',
  'LIVE_FEED: STREAMING EVENTS...',
  'OVERLAY_HUD: MINIMIZED [OK]',
  'GEOCODING SPECIFICITY: LEVEL 3',
  'FUZZY MATCH JACCARD: ACTIVE',
  'DEDUPLICATION DEEP SCAN: ON'
];

export default function AsciiGlobe() {
  const [frame, setFrame] = useState('');
  const [logsL, setLogsL] = useState([]);
  const [logsR, setLogsR] = useState([]);

  useEffect(() => {
    // Initialize scrolling side logs
    let currentL = Array(24).fill('').map(() => HIGH_TECH_LOGS_LEFT[Math.floor(Math.random() * HIGH_TECH_LOGS_LEFT.length)]);
    let currentR = Array(24).fill('').map(() => HIGH_TECH_LOGS_RIGHT[Math.floor(Math.random() * HIGH_TECH_LOGS_RIGHT.length)]);
    setLogsL(currentL);
    setLogsR(currentR);

    // Scroll logs interval
    const logScrollInterval = setInterval(() => {
      currentL.shift();
      currentL.push(HIGH_TECH_LOGS_LEFT[Math.floor(Math.random() * HIGH_TECH_LOGS_LEFT.length)]);
      currentR.shift();
      currentR.push(HIGH_TECH_LOGS_RIGHT[Math.floor(Math.random() * HIGH_TECH_LOGS_RIGHT.length)]);
      
      setLogsL([...currentL]);
      setLogsR([...currentR]);
    }, 450);

    // Globe physics parameters
    const W_total = 114; // Complete grid width
    const H = 26; // Grid height
    
    const W_globe = 56; // Center globe section width
    const H_globe = 26; // Center globe section height
    const R = 11; // Globe radius
    const aspect = 2.0; // Monospace aspect correction
    
    let angleY = 0; // Rotation angle
    const angleX = 0.35; // Fixed Tilt

    const renderInterval = setInterval(() => {
      // 1. Initialize empty buffer for the entire widescreen terminal
      const buffer = Array(H).fill(null).map(() => Array(W_total).fill(' '));

      // 2. Render Left Hackery Log Flow (Columns 0 to 22)
      for (let y = 0; y < H; y++) {
        const logLine = currentL[y] || '';
        for (let x = 0; x < Math.min(22, logLine.length); x++) {
          buffer[y][x] = logLine[x];
        }
      }

      // Draw left solid border
      for (let y = 0; y < H; y++) {
        buffer[y][23] = '│';
      }

      // 3. Render Right Hackery Log Flow (Columns 91 to 113)
      for (let y = 0; y < H; y++) {
        const logLine = currentR[y] || '';
        for (let x = 0; x < Math.min(22, logLine.length); x++) {
          buffer[y][91 + x] = logLine[x];
        }
      }

      // Draw right solid border
      for (let y = 0; y < H; y++) {
        buffer[y][90] = '│';
      }

      // 4. Render Rotating 3D Globe inside columns 24 to 89 (offset x by 24)
      const globeOffset = 24;
      const zBuffer = Array(H_globe).fill(null).map(() => Array(W_globe).fill(-1000));
      const globeBuffer = Array(H_globe).fill(null).map(() => Array(W_globe).fill(' '));

      // Draw latitude lines (parallels)
      for (let lat = -80; lat <= 80; lat += 20) {
        const theta = (lat * Math.PI) / 180;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        for (let lon = 0; lon < 360; lon += 2.5) {
          const phi = (lon * Math.PI) / 180;
          const cosPhi = Math.cos(phi);
          const sinPhi = Math.sin(phi);

          const x = R * cosTheta * cosPhi;
          const y = R * sinTheta;
          const z = R * cosTheta * sinPhi;

          // Rotation Y (Spin)
          const x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
          const z1 = x * Math.sin(angleY) + z * Math.cos(angleY);

          // Rotation X (Tilt)
          const y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
          const z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);

          const px = Math.round(W_globe / 2 + x1 * aspect);
          const py = Math.round(H_globe / 2 - y2);

          if (px >= 0 && px < W_globe && py >= 0 && py < H_globe) {
            if (z2 > zBuffer[py][px]) {
              zBuffer[py][px] = z2;
              globeBuffer[py][px] = z2 > 0 ? '#' : '·';
            }
          }
        }
      }

      // Draw longitude lines (meridians)
      for (let lon = 0; lon < 360; lon += 30) {
        const phi = (lon * Math.PI) / 180;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        for (let lat = -90; lat <= 90; lat += 2) {
          const theta = (lat * Math.PI) / 180;
          const cosTheta = Math.cos(theta);
          const sinTheta = Math.sin(theta);

          const x = R * cosTheta * cosPhi;
          const y = R * sinTheta;
          const z = R * cosTheta * sinPhi;

          // Rotation Y (Spin)
          const x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
          const z1 = x * Math.sin(angleY) + z * Math.cos(angleY);

          // Rotation X (Tilt)
          const y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
          const z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);

          const px = Math.round(W_globe / 2 + x1 * aspect);
          const py = Math.round(H_globe / 2 - y2);

          if (px >= 0 && px < W_globe && py >= 0 && py < H_globe) {
            if (z2 > zBuffer[py][px]) {
              zBuffer[py][px] = z2;
              let char = z2 > 0 ? 'O' : ':';
              if (Math.abs(lat) < 5) char = z2 > 0 ? '+' : '-';
              globeBuffer[py][px] = char;
            }
          }
        }
      }

      // Draw high-tech HUD radar circles on the center globe canvas
      const cx = W_globe / 2;
      const cy = H_globe / 2;
      const radarRadius = R * 1.35; // Outer scanner ring

      for (let y = 0; y < H_globe; y++) {
        for (let x = 0; x < W_globe; x++) {
          const dx = (x - cx) / aspect;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Render radar target dots
          if (Math.abs(dist - radarRadius) < 0.35) {
            if (globeBuffer[y][x] === ' ' || globeBuffer[y][x] === '·') {
              globeBuffer[y][x] = '·';
            }
          }

          // Blinking HUD crosshair marks
          if (Math.abs(dx) < 0.15 && Math.abs(dy - radarRadius) < 0.8) {
            globeBuffer[y][x] = '|';
          }
          if (Math.abs(dx) < 0.15 && Math.abs(dy + radarRadius) < 0.8) {
            globeBuffer[y][x] = '|';
          }
          if (Math.abs(dy) < 0.15 && Math.abs(dx - radarRadius) < 0.8) {
            globeBuffer[y][x] = '—';
          }
          if (Math.abs(dy) < 0.15 && Math.abs(dx + radarRadius) < 0.8) {
            globeBuffer[y][x] = '—';
          }
        }
      }

      // Draw radar target corners
      const writeGlobeStr = (str, gx, gy) => {
        for (let i = 0; i < str.length; i++) {
          if (gx + i >= 0 && gx + i < W_globe && gy >= 0 && gy < H_globe) {
            globeBuffer[gy][gx + i] = str[i];
          }
        }
      };

      // Overlay cyber locking brackets
      writeGlobeStr('┌', 6, 2);
      writeGlobeStr('┐', W_globe - 7, 2);
      writeGlobeStr('└', 6, H_globe - 3);
      writeGlobeStr('┘', W_globe - 7, H_globe - 3);

      // Dynamic telemetry data tags in center globe screen
      writeGlobeStr('LOCK: [ ACQUIRED ]', 8, 3);
      writeGlobeStr('SYS_STAT: MONITORING', W_globe - 28, 3);
      writeGlobeStr('TELEMETRY LOCK ON TARGET', 8, H_globe - 4);
      writeGlobeStr('SECURE VAULT CHANNEL', W_globe - 28, H_globe - 4);

      // 5. Transfer globe buffer to full screen buffer (offset by 24 columns)
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W_globe; x++) {
          const char = globeBuffer[y][x];
          buffer[y][globeOffset + x] = char;
        }
      }

      // 6. Convert full buffer into final formatted string
      const output = buffer.map((row) => row.join('')).join('\n');
      setFrame(output);
      angleY += 0.035; // Adjust rotation speed
    }, 45);

    return () => {
      clearInterval(logScrollInterval);
      clearInterval(renderInterval);
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflowX: 'auto',
      padding: '10px',
      background: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      border: '1px solid rgba(0, 240, 255, 0.05)'
    }}>
      <pre style={{
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '10px',
        lineHeight: '11px',
        color: '#00f0ff', // Glowing cyber cyan
        textShadow: '0 0 10px rgba(0, 240, 255, 0.7)',
        background: 'transparent',
        whiteSpace: 'pre',
        letterSpacing: '0.5px',
        userSelect: 'none',
        pointerEvents: 'none'
      }}>
        {frame}
      </pre>
    </div>
  );
}
