'use client';
import { useEffect, useState } from 'react';

export default function AsciiGlobe() {
  const [frame, setFrame] = useState('');

  useEffect(() => {
    const W = 60; // Grid Width
    const H = 26; // Grid Height
    const R = 11;  // Globe Radius
    const aspect = 2.0; // Font aspect ratio correction (monospace is taller than wide)
    
    let angleY = 0; // Rotation angle around Y axis
    const angleX = 0.35; // Fixed Tilt (approx 20 degrees)

    const interval = setInterval(() => {
      // Initialize empty grid buffer
      const buffer = Array(H).fill(null).map(() => Array(W).fill(' '));
      const zBuffer = Array(H).fill(null).map(() => Array(W).fill(-1000));

      // Draw latitude lines (parallels)
      for (let lat = -80; lat <= 80; lat += 20) {
        const theta = (lat * Math.PI) / 180;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        for (let lon = 0; lon < 360; lon += 3) {
          const phi = (lon * Math.PI) / 180;
          const cosPhi = Math.cos(phi);
          const sinPhi = Math.sin(phi);

          // 3D coordinates
          const x = R * cosTheta * cosPhi;
          const y = R * sinTheta;
          const z = R * cosTheta * sinPhi;

          // Rotate around Y-axis (Spinning)
          const x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
          const z1 = x * Math.sin(angleY) + z * Math.cos(angleY);

          // Rotate around X-axis (Tilt)
          const y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
          const z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);

          // Perspective projection and grid mapping
          const px = Math.round(W / 2 + x1 * aspect);
          const py = Math.round(H / 2 - y2);

          if (px >= 0 && px < W && py >= 0 && py < H) {
            if (z2 > zBuffer[py][px]) {
              zBuffer[py][px] = z2;
              // Depth-based shading (Brighter on front, dimmer on back)
              buffer[py][px] = z2 > 0 ? '#' : '.';
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

          // 3D coordinates
          const x = R * cosTheta * cosPhi;
          const y = R * sinTheta;
          const z = R * cosTheta * sinPhi;

          // Rotate around Y-axis (Spinning)
          const x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
          const z1 = x * Math.sin(angleY) + z * Math.cos(angleY);

          // Rotate around X-axis (Tilt)
          const y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
          const z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);

          // Perspective projection and grid mapping
          const px = Math.round(W / 2 + x1 * aspect);
          const py = Math.round(H / 2 - y2);

          if (px >= 0 && px < W && py >= 0 && py < H) {
            if (z2 > zBuffer[py][px]) {
              zBuffer[py][px] = z2;
              // Highlight prime meridian and equator intersections with custom symbols
              let char = z2 > 0 ? 'O' : ':';
              if (Math.abs(lat) < 5) char = z2 > 0 ? '+' : '-';
              buffer[py][px] = char;
            }
          }
        }
      }

      // Render grid to string
      const output = buffer.map((row) => row.join('')).join('\n');
      setFrame(output);
      angleY += 0.04; // Adjust spin speed
    }, 40);

    return () => clearInterval(interval);
  }, []);

  return (
    <pre style={{
      fontFamily: 'Courier New, Courier, monospace',
      fontSize: '11px',
      lineHeight: '12px',
      color: '#10b981', // Neon green color
      textShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
      background: 'transparent',
      margin: '0 auto',
      whiteSpace: 'pre',
      letterSpacing: '1px',
      userSelect: 'none',
      pointerEvents: 'none'
    }}>
      {frame}
    </pre>
  );
}
