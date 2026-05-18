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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 800);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    // Initialize scrolling side logs
    let currentL = Array(24).fill('').map(() => HIGH_TECH_LOGS_LEFT[Math.floor(Math.random() * HIGH_TECH_LOGS_LEFT.length)]);
    let currentR = Array(24).fill('').map(() => HIGH_TECH_LOGS_RIGHT[Math.floor(Math.random() * HIGH_TECH_LOGS_RIGHT.length)]);

    // Scroll logs interval
    const logScrollInterval = setInterval(() => {
      if (isMobile) return;
      currentL.shift();
      currentL.push(HIGH_TECH_LOGS_LEFT[Math.floor(Math.random() * HIGH_TECH_LOGS_LEFT.length)]);
      currentR.shift();
      currentR.push(HIGH_TECH_LOGS_RIGHT[Math.floor(Math.random() * HIGH_TECH_LOGS_RIGHT.length)]);
    }, 450);

    // Grid Dimensions
    const W_total = isMobile ? 54 : 110;
    const H = isMobile ? 22 : 26;
    
    const W_globe = 54;
    const H_globe = isMobile ? 22 : 26;
    const R = isMobile ? 8.2 : 11.0;
    const aspect = 1.95; // Font aspect ratio correction
    
    let angleY = 0;
    const angleX = 0.35;

    const renderInterval = setInterval(() => {
      const buffer = Array(H).fill(null).map(() => Array(W_total).fill(' '));

      if (!isMobile) {
        // Render Left Logs (Columns 0 to 20)
        for (let y = 0; y < H; y++) {
          const logLine = currentL[y] || '';
          for (let x = 0; x < Math.min(20, logLine.length); x++) {
            buffer[y][x] = logLine[x];
          }
        }
        // Left border separator
        for (let y = 0; y < H; y++) {
          buffer[y][21] = '│';
        }

        // Render Right Logs (Columns 89 to 109)
        for (let y = 0; y < H; y++) {
          const logLine = currentR[y] || '';
          for (let x = 0; x < Math.min(20, logLine.length); x++) {
            buffer[y][89 + x] = logLine[x];
          }
        }
        // Right border separator
        for (let y = 0; y < H; y++) {
          buffer[y][88] = '│';
        }
      }

      // Render rotating globe inside central section
      const globeOffset = isMobile ? 0 : 22;
      const zBuffer = Array(H_globe).fill(null).map(() => Array(W_globe).fill(-1000));
      const globeBuffer = Array(H_globe).fill(null).map(() => Array(W_globe).fill(' '));

      // Draw latitude lines (parallels)
      for (let lat = -80; lat <= 80; lat += (isMobile ? 25 : 20)) {
        const theta = (lat * Math.PI) / 180;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        for (let lon = 0; lon < 360; lon += (isMobile ? 3.5 : 2.5)) {
          const phi = (lon * Math.PI) / 180;
          const cosPhi = Math.cos(phi);
          const sinPhi = Math.sin(phi);

          const x = R * cosTheta * cosPhi;
          const y = R * sinTheta;
          const z = R * cosTheta * sinPhi;

          // Rotation
          const x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
          const z1 = x * Math.sin(angleY) + z * Math.cos(angleY);
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

        for (let lat = -90; lat <= 90; lat += (isMobile ? 4.0 : 2.0)) {
          const theta = (lat * Math.PI) / 180;
          const cosTheta = Math.cos(theta);
          const sinTheta = Math.sin(theta);

          const x = R * cosTheta * cosPhi;
          const y = R * sinTheta;
          const z = R * cosTheta * sinPhi;

          const x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
          const z1 = x * Math.sin(angleY) + z * Math.cos(angleY);
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

      // Target HUD circular grid
      const cx = W_globe / 2;
      const cy = H_globe / 2;
      const radarRadius = R * 1.35;

      for (let y = 0; y < H_globe; y++) {
        for (let x = 0; x < W_globe; x++) {
          const dx = (x - cx) / aspect;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (Math.abs(dist - radarRadius) < 0.35) {
            if (globeBuffer[y][x] === ' ' || globeBuffer[y][x] === '·') {
              globeBuffer[y][x] = '·';
            }
          }

          if (Math.abs(dx) < 0.15 && Math.abs(dy - radarRadius) < 0.8) globeBuffer[y][x] = '|';
          if (Math.abs(dx) < 0.15 && Math.abs(dy + radarRadius) < 0.8) globeBuffer[y][x] = '|';
          if (Math.abs(dy) < 0.15 && Math.abs(dx - radarRadius) < 0.8) globeBuffer[y][x] = '—';
          if (Math.abs(dy) < 0.15 && Math.abs(dx + radarRadius) < 0.8) globeBuffer[y][x] = '—';
        }
      }

      const writeGlobeStr = (str, gx, gy) => {
        for (let i = 0; i < str.length; i++) {
          if (gx + i >= 0 && gx + i < W_globe && gy >= 0 && gy < H_globe) {
            globeBuffer[gy][gx + i] = str[i];
          }
        }
      };

      // Cyber corners
      writeGlobeStr('┌', 6, 2);
      writeGlobeStr('┐', W_globe - 7, 2);
      writeGlobeStr('└', 6, H_globe - 3);
      writeGlobeStr('┘', W_globe - 7, H_globe - 3);

      if (!isMobile) {
        writeGlobeStr('LOCK: [ ACQUIRED ]', 8, 3);
        writeGlobeStr('SYS_STAT: MONITORING', W_globe - 28, 3);
        writeGlobeStr('TELEMETRY LOCK ON TARGET', 8, H_globe - 4);
        writeGlobeStr('SECURE VAULT CHANNEL', W_globe - 28, H_globe - 4);
      } else {
        // Mobile compact tags
        writeGlobeStr('LOCK [OK]', 8, 3);
        writeGlobeStr('SYS: MONITOR', W_globe - 20, 3);
        writeGlobeStr('SECURE FEED', 8, H_globe - 4);
        writeGlobeStr('OSINT STREAM', W_globe - 21, H_globe - 4);
      }

      // Transfer
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W_globe; x++) {
          buffer[y][globeOffset + x] = globeBuffer[y][x];
        }
      }

      const output = buffer.map((row) => row.join('')).join('\n');
      setFrame(output);
      angleY += 0.035;
    }, 45);

    return () => {
      clearInterval(logScrollInterval);
      clearInterval(renderInterval);
    };
  }, [isMobile]);

  return (
    <div style={{
      width: '100%',
      maxWidth: isMobile ? '360px' : '850px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      padding: isMobile ? '4px' : '10px',
      background: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      border: '1px solid rgba(0, 240, 255, 0.05)'
    }}>
      <pre style={{
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: isMobile ? '7.5px' : '10px',
        lineHeight: isMobile ? '8.5px' : '11px',
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
