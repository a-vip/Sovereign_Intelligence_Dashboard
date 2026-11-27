'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Send,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  History,
  Plus,
  Lock,
  MapPin,
  Maximize2,
  Minimize2,
  Loader2
} from 'lucide-react';

const STARTER_PROMPTS = [
  'What are the most recent AI related events which have happened in USA?',
  'Who is the national AI supervisory agency in Spain?',
  'Compare mandatory incident-reporting windows across EU AI Act, California SB 53, and South Korea AI Basic Act.',
  'How many data center facilities are tracked in the United States?'
];

const THINKING_NODES = [
  { code: 'US', label: 'Washington · US CAISI', lat: 38.9, lon: -77.0, kw: ['us', 'usa', 'united states', 'california', 'sb 53', 'nist'] },
  { code: 'EU', label: 'Brussels · EU AI Office', lat: 50.8, lon: 4.3, kw: ['eu', 'europe', 'spain', 'germany', 'france', 'aesia'] },
  { code: 'UK', label: 'London · UK AISI', lat: 51.5, lon: -0.1, kw: ['uk', 'britain', 'london', 'aisi'] },
  { code: 'KR', label: 'Seoul · AI Basic Act', lat: 37.5, lon: 127.0, kw: ['korea', 'seoul'] },
  { code: 'JP', label: 'Tokyo · Hiroshima Process', lat: 35.7, lon: 139.7, kw: ['japan', 'tokyo'] },
  { code: 'SG', label: 'Singapore · IMDA Verify', lat: 1.3, lon: 103.8, kw: ['singapore', 'asean'] },
  { code: 'VN', label: 'Hanoi · Digital Tech Law', lat: 21.0, lon: 105.8, kw: ['vietnam', 'hanoi', 'ho chi minh'] },
  { code: 'IN', label: 'New Delhi · IndiaAI', lat: 28.6, lon: 77.2, kw: ['india', 'delhi', 'mumbai'] },
  { code: 'CN', label: 'Beijing · CAC Registry', lat: 39.9, lon: 116.4, kw: ['china', 'beijing', 'shanghai'] },
  { code: 'BR', label: 'Brasília · ANPD / PL 2338', lat: -15.8, lon: -47.9, kw: ['brazil', 'latin'] },
  { code: 'KE', label: 'Nairobi · ODPC Africa', lat: -1.3, lon: 36.8, kw: ['kenya', 'africa', 'nigeria'] },
  { code: 'AU', label: 'Canberra · AI Guardrails', lat: -35.3, lon: 149.1, kw: ['australia', 'sydney'] }
];

const PING_INSIGHTS = [
  'Scanning 60+ national AI statutory & regulator dossiers',
  'Querying live OSINT signals & verified research citations',
  'Cross-checking PeeringDB & Epoch AI compute clusters',
  'Auditing primary statutory text & cross-border treaties',
  'Verifying factual grounding & inline source links'
];

function SovDashThinkingVisualizer({ elapsedSec, promptText = '' }) {
  const canvasRef = useRef(null);
  const pointerRef = useRef({ active: false, nx: 0, ny: 0, px: 0, py: 0 });
  const ripplesRef = useRef([]);
  const sparksRef = useRef([]);
  const boostRef = useRef(0);
  const [pingCount, setPingCount] = useState(0);
  const [hoveredHub, setHoveredHub] = useState(null);

  const stageIdx = elapsedSec < 0.9 ? 0 : elapsedSec < 2.2 ? 1 : elapsedSec < 3.8 ? 2 : 3;
  const stages = [
    { short: 'Intent', detail: 'Parsing query scope & entities' },
    { short: 'Archive', detail: 'Scanning SovDash laws, compute & feeds' },
    { short: 'Verify', detail: 'Cross-checking primary & global sources' },
    { short: 'Synthesize', detail: 'Composing concise cited answer' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = null;
    let rotY = -0.55;
    let rotX = 0.24;
    let targetTiltX = 0.24;
    let targetTiltVel = 0;
    let lastTs = performance.now();
    let packetClock = 0;
    const packets = [];

    const lowerPrompt = String(promptText || '').toLowerCase();
    const matchedCodes = new Set(
      THINKING_NODES.filter((n) => n.kw.some((k) => lowerPrompt.includes(k))).map((n) => n.code)
    );

    const spawnPacket = (forcedNodeIdx = null) => {
      const idx = forcedNodeIdx != null ? forcedNodeIdx : Math.floor(Math.random() * THINKING_NODES.length);
      packets.push({
        nodeIdx: idx,
        t: 0,
        speed: 0.85 + Math.random() * 0.75,
        hueShift: Math.random() > 0.5 ? 0 : 1
      });
      if (packets.length > 14) packets.shift();
    };
    for (let i = 0; i < 5; i++) spawnPacket(i * 2);

    const render = (now) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth || 340;
      const h = canvas.clientHeight || 126;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const isLight =
        document.documentElement.getAttribute('data-ui-theme') === 'light' ||
        document.documentElement.classList.contains('editorial-light');
      const primaryRgb = isLight ? '2, 132, 199' : '0, 240, 255';
      const secondaryRgb = isLight ? '99, 102, 241' : '192, 132, 252';
      const emeraldRgb = isLight ? '5, 150, 105' : '52, 211, 153';

      boostRef.current = Math.max(0, boostRef.current - dt * 1.6);
      const spinSpeed = 0.68 + boostRef.current * 2.1;

      if (pointerRef.current.active) {
        targetTiltX = 0.22 + pointerRef.current.ny * 0.55;
        targetTiltVel = pointerRef.current.nx * 1.15;
      } else {
        targetTiltX = 0.24 + Math.sin(now * 0.0011) * 0.1;
        targetTiltVel = 0;
      }
      rotX += (targetTiltX - rotX) * Math.min(1, dt * 6);
      rotY += (spinSpeed + targetTiltVel) * dt;

      packetClock += dt;
      if (packetClock > 0.28) {
        packetClock = 0;
        spawnPacket();
      }

      const cx = w * 0.5;
      const cy = h * 0.52;
      const radius = Math.min(w * 0.24, h * 0.39, 48);

      // Subtle ambient radial aura
      const bgGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius * 2.15);
      bgGlow.addColorStop(0, `rgba(${primaryRgb}, ${isLight ? 0.16 : 0.22})`);
      bgGlow.addColorStop(0.55, `rgba(${secondaryRgb}, ${isLight ? 0.06 : 0.09})`);
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, w, h);

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const project3D = (x, y, z) => {
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const persp = 220 / (220 - z2);
        return { sx: cx + x1 * persp, sy: cy - y2 * persp, z: z2, persp };
      };

      // 1. Dual Counter-Rotating Gyroscopic Orbital Rings
      for (let ringIdx = 0; ringIdx < 2; ringIdx++) {
        const ringRadius = radius * (ringIdx === 0 ? 1.28 : 1.44);
        const tiltA = ringIdx === 0 ? 0.52 : -0.46;
        const ringSpin = now * (ringIdx === 0 ? 0.0014 : -0.0011);
        ctx.beginPath();
        for (let s = 0; s <= 64; s++) {
          const a = (s / 64) * Math.PI * 2 + ringSpin;
          const rx = Math.cos(a) * ringRadius;
          const ry = Math.sin(a) * Math.sin(tiltA) * ringRadius;
          const rz = Math.sin(a) * Math.cos(tiltA) * ringRadius;
          const p = project3D(rx, ry, rz);
          if (s === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle =
          ringIdx === 0
            ? `rgba(${primaryRgb}, ${isLight ? 0.34 : 0.38})`
            : `rgba(${secondaryRgb}, ${isLight ? 0.28 : 0.32})`;
        ctx.lineWidth = ringIdx === 0 ? 1.1 : 0.9;
        ctx.setLineDash(ringIdx === 1 ? [3, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting telemetry satellite bead on each gyro ring
        const satAngle = now * (ringIdx === 0 ? 0.0028 : -0.0023) + ringIdx * 2.1;
        const sp = project3D(
          Math.cos(satAngle) * ringRadius,
          Math.sin(satAngle) * Math.sin(tiltA) * ringRadius,
          Math.sin(satAngle) * Math.cos(tiltA) * ringRadius
        );
        ctx.beginPath();
        ctx.arc(sp.sx, sp.sy, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = ringIdx === 0 ? `rgb(${primaryRgb})` : `rgb(${secondaryRgb})`;
        ctx.fill();
      }

      // 2. Geodesic Wireframe Lat/Lon Sphere
      ctx.lineWidth = 0.75;
      for (let lat = -60; lat <= 60; lat += 30) {
        const phi = (lat * Math.PI) / 180;
        const rLat = Math.cos(phi) * radius;
        const yLat = Math.sin(phi) * radius;
        ctx.beginPath();
        for (let lon = 0; lon <= 360; lon += 10) {
          const lam = (lon * Math.PI) / 180;
          const p = project3D(rLat * Math.sin(lam), yLat, rLat * Math.cos(lam));
          if (lon === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = `rgba(${primaryRgb}, ${lat === 0 ? 0.28 : 0.14})`;
        ctx.stroke();
      }

      for (let lon = 0; lon < 180; lon += 30) {
        const lam = (lon * Math.PI) / 180;
        ctx.beginPath();
        for (let deg = 0; deg <= 360; deg += 10) {
          const a = (deg * Math.PI) / 180;
          const x = Math.sin(a) * Math.sin(lam) * radius;
          const y = Math.cos(a) * radius;
          const z = Math.sin(a) * Math.cos(lam) * radius;
          const p = project3D(x, y, z);
          if (deg === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = `rgba(${primaryRgb}, 0.14)`;
        ctx.stroke();
      }

      // 3. Central Pulsing AI Synthesis Core
      const corePulse = 1 + Math.sin(now * 0.006) * 0.18 + boostRef.current * 0.35;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, 13 * corePulse);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.35, `rgba(${primaryRgb}, 0.95)`);
      coreGrad.addColorStop(1, `rgba(${primaryRgb}, 0)`);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 13 * corePulse, 0, Math.PI * 2);
      ctx.fill();

      // 4. Project 12 Global Jurisdiction Nodes + Synaptic Data Packets to Core
      const projectedNodes = THINKING_NODES.map((n, idx) => {
        const phi = (n.lat * Math.PI) / 180;
        const lam = (n.lon * Math.PI) / 180;
        const x = Math.cos(phi) * Math.sin(lam) * radius;
        const y = Math.sin(phi) * radius;
        const z = Math.cos(phi) * Math.cos(lam) * radius;
        return { ...n, idx, ...project3D(x, y, z) };
      });

      // Synaptic streams from surface nodes into the AI core
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i];
        pk.t += dt * pk.speed;
        if (pk.t >= 1) {
          packets.splice(i, 1);
          continue;
        }
        const nd = projectedNodes[pk.nodeIdx];
        if (!nd) continue;
        const ctrlX = (nd.sx + cx) * 0.5 + (nd.sy - cy) * 0.25;
        const ctrlY = (nd.sy + cy) * 0.5 - (nd.sx - cx) * 0.25;
        const u = pk.t;
        const inv = 1 - u;
        const px = inv * inv * nd.sx + 2 * inv * u * ctrlX + u * u * cx;
        const py = inv * inv * nd.sy + 2 * inv * u * ctrlY + u * u * cy;

        ctx.beginPath();
        ctx.moveTo(nd.sx, nd.sy);
        ctx.quadraticCurveTo(ctrlX, ctrlY, cx, cy);
        ctx.strokeStyle = `rgba(${pk.hueShift ? secondaryRgb : primaryRgb}, ${0.18 * (1 - Math.abs(0.5 - u))})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = pk.hueShift ? `rgb(${secondaryRgb})` : `rgb(${primaryRgb})`;
        ctx.fill();
      }

      // Draw Nodes & Find Nearest Node to Cursor
      let closestHub = null;
      let closestDist = 34;

      projectedNodes
        .slice()
        .sort((a, b) => a.z - b.z)
        .forEach((nd) => {
          const frontFactor = (nd.z + radius) / (2 * radius); // 0 back .. 1 front
          const isPromptMatch = matchedCodes.has(nd.code);
          const alpha = 0.22 + frontFactor * 0.78;
          const r = (isPromptMatch ? 3.5 : 2.5) * (0.85 + frontFactor * 0.35);

          if (pointerRef.current.active && frontFactor > 0.35) {
            const d = Math.hypot(pointerRef.current.px - nd.sx, pointerRef.current.py - nd.sy);
            if (d < closestDist) {
              closestDist = d;
              closestHub = nd;
            }
          }

          ctx.beginPath();
          ctx.arc(nd.sx, nd.sy, r, 0, Math.PI * 2);
          ctx.fillStyle = isPromptMatch
            ? `rgba(${emeraldRgb}, ${Math.min(1, alpha + 0.2)})`
            : `rgba(${primaryRgb}, ${alpha})`;
          ctx.fill();

          if (frontFactor > 0.62 || isPromptMatch) {
            ctx.font = `700 8px ui-monospace, SFMono-Regular, Menlo, monospace`;
            ctx.fillStyle = isLight
              ? `rgba(15, 23, 42, ${0.55 + frontFactor * 0.4})`
              : `rgba(226, 232, 240, ${0.5 + frontFactor * 0.45})`;
            ctx.fillText(nd.code, nd.sx + 5, nd.sy + 2.5);
          }
        });

      // Magnetic cursor tether when hovering near a node
      if (closestHub && pointerRef.current.active) {
        ctx.beginPath();
        ctx.moveTo(pointerRef.current.px, pointerRef.current.py);
        ctx.lineTo(closestHub.sx, closestHub.sy);
        ctx.strokeStyle = `rgba(${emeraldRgb}, 0.65)`;
        ctx.lineWidth = 1.1;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(closestHub.sx, closestHub.sy, 6.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${emeraldRgb}, 0.9)`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
      setHoveredHub((prev) => (prev?.code === closestHub?.code ? prev : closestHub ? { code: closestHub.code, label: closestHub.label } : null));

      // 5. Interactive Click Sonar Ripples & Neural Sparks
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rp = ripplesRef.current[i];
        rp.r += dt * 135;
        rp.alpha -= dt * 1.25;
        if (rp.alpha <= 0) {
          ripplesRef.current.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${primaryRgb}, ${rp.alpha})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const sp = sparksRef.current[i];
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.life -= dt * 1.6;
        if (sp.life <= 0) {
          sparksRef.current.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${sp.alt ? secondaryRgb : primaryRgb}, ${sp.life})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [promptText]);

  const handlePointerMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    pointerRef.current = {
      active: true,
      px,
      py,
      nx: (px / rect.width) * 2 - 1,
      ny: (py / rect.height) * 2 - 1
    };
  };

  const handleCanvasPulse = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ripplesRef.current.push({ x, y, r: 4, alpha: 0.95 });
    ripplesRef.current.push({ x, y, r: 12, alpha: 0.55 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const spd = 38 + Math.random() * 55;
      sparksRef.current.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.95,
        alt: i % 2 === 0
      });
    }
    boostRef.current = 1.0;
    setPingCount((c) => c + 1);
  };

  return (
    <div
      style={{
        flexShrink: 0,
        borderRadius: '14px',
        border: '1px solid var(--sov-border)',
        background: 'var(--sov-card-bg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.18)'
      }}
    >
      <style>{`
        @keyframes sovAiOrbitCw { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes sovAiOrbitCcw { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
        @keyframes sovAiEqBar {
          0%, 100% { transform: scaleY(0.32); opacity: 0.55; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>

      {/* Top Live Status Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '9px 12px',
          borderBottom: '1px solid var(--sov-border)',
          background: 'var(--sov-panel-bg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
          {/* Dual Counter-Rotating Concentric Orbital Spinner */}
          <div style={{ position: 'relative', width: '20px', height: '20px', flexShrink: 0 }}>
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: 'var(--sov-accent)',
                borderRightColor: 'var(--sov-accent)',
                animation: 'sovAiOrbitCw 0.85s linear infinite'
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: '4px',
                borderRadius: '50%',
                border: '1.5px solid transparent',
                borderBottomColor: 'var(--sov-purple, #c084fc)',
                borderLeftColor: 'var(--sov-purple, #c084fc)',
                animation: 'sovAiOrbitCcw 1.3s linear infinite'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--sov-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {stages[stageIdx].detail}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Spectral Waveform Bars */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', height: '13px' }} aria-hidden="true">
            {[0, 0.14, 0.28, 0.42, 0.2].map((delay, bi) => (
              <span
                key={bi}
                style={{
                  width: '2.5px',
                  height: '12px',
                  borderRadius: '2px',
                  background: 'var(--sov-accent)',
                  transformOrigin: 'center',
                  animation: `sovAiEqBar 0.85s ease-in-out ${delay}s infinite`
                }}
              />
            ))}
          </div>

          <span
            style={{
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--sov-accent)',
              minWidth: '34px',
              textAlign: 'right'
            }}
          >
            {elapsedSec.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Interactive 3D Holographic Geodesic Globe Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '124px', cursor: 'crosshair', userSelect: 'none' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handlePointerMove}
          onMouseLeave={() => {
            pointerRef.current.active = false;
            setHoveredHub(null);
          }}
          onClick={handleCanvasPulse}
          onTouchStart={(e) => {
            if (e.touches?.[0]) {
              handlePointerMove(e.touches[0]);
              handleCanvasPulse(e.touches[0]);
            }
          }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Floating Live Node / Sonar Feedback Pill */}
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '10px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            fontSize: '10px',
            fontFamily: 'var(--font-jetbrains-fallback)',
            color: 'var(--sov-muted)'
          }}
        >
          <span
            style={{
              padding: '2px 7px',
              borderRadius: '999px',
              background: 'var(--sov-panel-bg)',
              border: '1px solid var(--sov-border)',
              color: hoveredHub || pingCount > 0 ? 'var(--sov-accent)' : 'var(--sov-muted)',
              fontWeight: 600,
              maxWidth: '72%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {hoveredHub
              ? `🛰️ ${hoveredHub.label}`
              : pingCount > 0
                ? `⚡ ${PING_INSIGHTS[(pingCount - 1) % PING_INSIGHTS.length]}`
                : 'Move cursor to tilt · Click orb to ping'}
          </span>

          {pingCount > 0 && (
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '999px',
                background: 'var(--sov-accent-soft)',
                border: '1px solid var(--sov-accent)',
                color: 'var(--sov-accent)',
                fontWeight: 700
              }}
            >
              PING ×{pingCount}
            </span>
          )}
        </div>
      </div>

      {/* 4-Stage Pipeline Progress Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '5px',
          padding: '8px 10px',
          borderTop: '1px solid var(--sov-border)',
          background: 'var(--sov-panel-bg)'
        }}
      >
        {stages.map((st, idx) => {
          const isDone = idx < stageIdx;
          const isCurrent = idx === stageIdx;
          return (
            <div
              key={st.short}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '4px 5px',
                borderRadius: '6px',
                border: `1px solid ${isCurrent ? 'var(--sov-accent)' : isDone ? 'rgba(16, 185, 129, 0.4)' : 'var(--sov-border)'}`,
                background: isCurrent ? 'var(--sov-accent-soft)' : isDone ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: isCurrent ? 'var(--sov-accent)' : isDone ? '#10b981' : 'var(--sov-muted)',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: 'var(--font-jetbrains-fallback)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{isDone ? '✓' : isCurrent ? '●' : `${idx + 1}`}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.short}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatCitationUrl(c) {
  return c?.url || c?.permalink || 'https://app.sovdash.com/';
}

function renderInlineTokens(text, citations = [], onHighlightCitation) {
  const tokens = String(text || '').split(/(\*\*[^*]+\*\*|\[W?\d+\])/gi);
  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={i} style={{ color: 'var(--sov-text)', fontWeight: 700 }}>
          {tok.slice(2, -2)}
        </strong>
      );
    }
    const citMatch = tok.match(/^\[(W?\d+)\]$/i);
    if (citMatch) {
      const tag = citMatch[1].toUpperCase();
      const cit = citations.find((c) => String(c.tag).toUpperCase() === tag);
      if (!cit) return <span key={i}>{tok}</span>;
      return (
        <button
          key={i}
          type="button"
          onClick={() => onHighlightCitation?.(tag)}
          title={cit.title}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 2px',
            padding: '0 5px',
            height: '16px',
            borderRadius: '4px',
            border: '1px solid var(--sov-border)',
            background: 'var(--sov-accent-soft)',
            color: 'var(--sov-accent)',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: 'var(--font-jetbrains-fallback)',
            cursor: 'pointer',
            verticalAlign: 'middle'
          }}
        >
          {tag}
        </button>
      );
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}

function renderFormattedText(text, citations = [], onHighlightCitation) {
  const rawLines = String(text || '').split('\n');
  const blocks = [];
  let tableBuffer = [];

  const flushTable = (keyPrefix) => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .filter((l) => !/^\|[\s\-:|]+\|$/.test(l.trim()))
      .map((l) =>
        l
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim())
      );
    tableBuffer = [];
    if (rows.length === 0) return;
    const [head, ...body] = rows;
    blocks.push(
      <div key={`${keyPrefix}-tbl`} style={{ overflowX: 'auto', margin: '4px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--sov-border)' }}>
              {head.map((h, hi) => (
                <th key={hi} style={{ textAlign: 'left', padding: '5px 7px', fontWeight: 700, color: 'var(--sov-accent)' }}>
                  {renderInlineTokens(h, citations, onHighlightCitation)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid var(--sov-border)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: '5px 7px', color: 'var(--sov-text)', lineHeight: 1.45, verticalAlign: 'top' }}>
                    {renderInlineTokens(cell, citations, onHighlightCitation)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  rawLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
      tableBuffer.push(trimmed);
      return;
    }
    flushTable(`row-${idx}`);

    if (!trimmed) {
      blocks.push(<div key={idx} style={{ height: '5px' }} />);
      return;
    }

    const isH2 = trimmed.startsWith('## ');
    const isH3 = trimmed.startsWith('### ');
    const isBullet = /^[-*•]\s+/.test(trimmed);
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    const cleanContent = isH3
      ? trimmed.slice(4)
      : isH2
      ? trimmed.slice(3)
      : isBullet
      ? trimmed.replace(/^[-*•]\s+/, '')
      : numMatch
      ? numMatch[2]
      : trimmed;

    if (isH2 || isH3) {
      blocks.push(
        <div key={idx} style={{ fontSize: isH2 ? '13px' : '12.5px', fontWeight: 700, color: 'var(--sov-text)', marginTop: '4px' }}>
          {renderInlineTokens(cleanContent, citations, onHighlightCitation)}
        </div>
      );
      return;
    }

    if (isBullet || numMatch) {
      blocks.push(
        <div key={idx} style={{ display: 'flex', gap: '7px', paddingLeft: '2px', lineHeight: 1.5, fontSize: '12.5px' }}>
          <span style={{ color: 'var(--sov-accent)', fontWeight: 700, flexShrink: 0 }}>{numMatch ? `${numMatch[1]}.` : '•'}</span>
          <span>{renderInlineTokens(cleanContent, citations, onHighlightCitation)}</span>
        </div>
      );
      return;
    }

    blocks.push(
      <div key={idx} style={{ lineHeight: 1.55, fontSize: '12.5px' }}>
        {renderInlineTokens(cleanContent, citations, onHighlightCitation)}
      </div>
    );
  });

  flushTable('end');
  return blocks;
}

export default function SovDashAiDrawer({ isOpen, onClose, currentUser, onRequestAuth, onFocusLocation }) {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [expandedReasoning, setExpandedReasoning] = useState({});
  const [expandedSources, setExpandedSources] = useState({});
  const [highlightedCitKey, setHighlightedCitKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const checkViewport = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    if (!isOpen || !currentUser?.email) return;
    let active = true;
    fetch('/api/sovdash-ai', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!active || !json?.success) return;
        setSessions(json.sessions || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, currentUser?.email]);

  useEffect(() => {
    if (!loading) {
      setElapsedSec(0);
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Number(((Date.now() - started) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };
    const rafId = typeof window !== 'undefined' ? window.requestAnimationFrame(scrollToBottom) : null;
    const settleTimer = setTimeout(scrollToBottom, 90);
    return () => {
      if (rafId !== null && typeof window !== 'undefined') window.cancelAnimationFrame(rafId);
      clearTimeout(settleTimer);
    };
  }, [messages.length, loading]);

  if (!isOpen) return null;

  const loadSession = async (sid) => {
    setShowSessions(false);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/sovdash-ai?sessionId=${encodeURIComponent(sid)}`, { cache: 'no-store' });
      const json = await res.json();
      if (json?.success) {
        setSessionId(sid);
        const hydrated = [];
        for (const row of json.messages || []) {
          hydrated.push({ id: `${row.id}-u`, role: 'user', content: row.prompt });
          hydrated.push({
            id: row.id,
            role: 'assistant',
            content: row.answer,
            reasoning: row.reasoning,
            citations: row.citations || [],
            latencyMs: row.latency_ms,
            feedback: row.user_feedback
          });
        }
        setMessages(hydrated);
      }
    } catch (err) {
      setErrorMsg(`Could not load chat: ${err.message}`);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setShowSessions(false);
    setErrorMsg('');
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const handleSend = async (overridePrompt = null) => {
    const promptText = String(overridePrompt ?? input).trim();
    if (!promptText || loading) return;

    setErrorMsg('');
    if (!overridePrompt) setInput('');

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: promptText };
    const nextHistory = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/sovdash-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, sessionId, history: nextHistory })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      if (json.sessionId) setSessionId(json.sessionId);
      const aiMsgId = json.messageId || `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          content: json.answer,
          reasoning: json.reasoning,
          citations: json.citations || [],
          latencyMs: json.latencyMs,
          feedback: null
        }
      ]);

      fetch('/api/sovdash-ai', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => s?.sessions && setSessions(s.sessions))
        .catch(() => {});
    } catch (err) {
      setErrorMsg(err.message || 'Unable to reach Ask SovDash right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId, val) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: m.feedback === val ? null : val } : m))
    );
    try {
      await fetch('/api/sovdash-ai', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, feedback: val })
      });
    } catch {}
  };

  const handleCopy = (id, text) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  };

  const handleHighlightCitation = (msgId, tag) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: true }));
    setHighlightedCitKey(`${msgId}:${tag}`);
    setTimeout(() => {
      const el = document.getElementById(`sov-cit-${msgId}-${tag}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  const iconBtnStyle = (active = false) => ({
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: `1px solid ${active ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
    background: active ? 'var(--sov-accent-soft)' : 'transparent',
    color: active ? 'var(--sov-accent)' : 'var(--sov-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  // Non-blocking floating card on desktop (globe & left feed remain 100% visible & interactive!)
  const floatingFrameStyle = isMobile
    ? {
        position: 'fixed',
        left: '8px',
        right: '8px',
        bottom: '10px',
        height: '72dvh',
        maxHeight: 'calc(100dvh - 70px)',
        borderRadius: '16px'
      }
    : {
        position: 'fixed',
        top: '58px',
        right: '14px',
        width: isExpanded ? '540px' : '400px',
        maxWidth: 'calc(100vw - 28px)',
        height: 'min(640px, calc(100dvh - 104px))',
        borderRadius: '16px',
        transition: 'width 0.2s ease'
      };

  return (
    <aside
      role="dialog"
      aria-label="Ask SovDash AI Assistant"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      style={{
        ...floatingFrameStyle,
        zIndex: 10040,
        background: 'var(--sov-panel-bg)',
        color: 'var(--sov-text)',
        border: '1px solid var(--sov-border)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--sov-shadow, 0 20px 56px rgba(0, 0, 0, 0.42))',
        backdropFilter: 'blur(18px)',
        fontFamily: 'var(--font-inter-fallback), system-ui, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Clean Compact Header */}
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '11px 14px',
          borderBottom: '1px solid var(--sov-border)',
          background: 'var(--sov-card-bg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: 'var(--sov-accent-soft)',
              border: '1px solid var(--sov-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sov-accent)'
            }}
          >
            <Sparkles size={13} />
          </div>
          <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Ask SovDash AI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {currentUser && (
            <>
              <button
                type="button"
                onClick={() => setShowSessions((s) => !s)}
                title="Past Conversations"
                style={iconBtnStyle(showSessions)}
              >
                <History size={13} />
              </button>
              <button type="button" onClick={handleNewChat} title="New Chat" style={iconBtnStyle(false)}>
                <Plus size={14} />
              </button>
            </>
          )}
          {!isMobile && (
            <button
              type="button"
              onClick={() => setIsExpanded((e) => !e)}
              title={isExpanded ? 'Compact Window' : 'Expand Window'}
              style={iconBtnStyle(isExpanded)}
            >
              {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Ask SovDash"
            style={iconBtnStyle(false)}
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* Guest Sign-In Gate */}
      {!currentUser ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--sov-accent-soft)',
              border: '1px solid var(--sov-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sov-accent)'
            }}
          >
            <Lock size={19} />
          </div>
          <div style={{ maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Sign in to Ask SovDash AI</h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--sov-muted)', lineHeight: 1.55 }}>
              Ask questions across live global AI events, laws, frontier labs, and compute infrastructure.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestAuth?.();
            }}
            style={{
              padding: '9px 18px',
              borderRadius: '9px',
              border: 'none',
              background: 'var(--sov-accent)',
              color: '#020617',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sign In / Create Account
          </button>
        </div>
      ) : (
        <>
          {/* Collapsible Past Conversations */}
          {showSessions && (
            <div
              style={{
                borderBottom: '1px solid var(--sov-border)',
                background: 'var(--sov-card-bg)',
                padding: '9px 12px',
                maxHeight: '175px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}
            >
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--sov-muted)' }}>
                Recent Conversations
              </div>
              {sessions.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--sov-muted)' }}>No saved chats yet.</div>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => loadSession(s.id)}
                    style={{
                      textAlign: 'left',
                      padding: '6px 9px',
                      borderRadius: '7px',
                      border: `1px solid ${s.id === sessionId ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                      background: s.id === sessionId ? 'var(--sov-accent-soft)' : 'transparent',
                      color: 'var(--sov-text)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {s.title}
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--sov-muted)', flexShrink: 0 }}>
                      {s.message_count || 1}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Conversation Scroll Area */}
          <div
            ref={scrollRef}
            style={{
              flex: '1 1 0%',
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              padding: '14px 14px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.length === 0 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', flexShrink: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--sov-text)', marginBottom: '2px' }}>
                  What would you like to explore?
                </div>
                <div style={{ fontSize: '12px', color: 'var(--sov-muted)', lineHeight: 1.5, marginBottom: '4px' }}>
                  Ask about recent global events, national AI laws, regulators, or data centers.
                </div>

                {STARTER_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    style={{
                      textAlign: 'left',
                      padding: '9px 11px',
                      borderRadius: '10px',
                      border: '1px solid var(--sov-border)',
                      background: 'var(--sov-card-bg)',
                      color: 'var(--sov-text)',
                      fontSize: '12px',
                      lineHeight: 1.4,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{q}</span>
                    <span style={{ color: 'var(--sov-accent)', fontWeight: 700 }}>→</span>
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => {
              if (m.role === 'user') {
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                    <div
                      style={{
                        maxWidth: '86%',
                        padding: '8px 12px',
                        borderRadius: '14px 14px 3px 14px',
                        background: 'var(--sov-accent-soft)',
                        border: '1px solid var(--sov-accent)',
                        color: 'var(--sov-text)',
                        fontSize: '12.5px',
                        lineHeight: 1.45,
                        fontWeight: 500
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              }

              const isReasonOpen = Boolean(expandedReasoning[m.id]);
              const isSourcesOpen = Boolean(expandedSources[m.id]);
              const secStr = m.latencyMs ? `${(m.latencyMs / 1000).toFixed(1)}s` : '1.0s';

              return (
                <div
                  key={m.id}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--sov-border)',
                    background: 'var(--sov-card-bg)'
                  }}
                >
                  {/* Collapsible Reasoning Trace */}
                  {m.reasoning && (
                    <button
                      type="button"
                      onClick={() => setExpandedReasoning((p) => ({ ...p, [m.id]: !p[m.id] }))}
                      style={{
                        alignSelf: 'flex-start',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--sov-muted)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {isReasonOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <span>
                        Thought for {secStr} · {(m.citations || []).length} sources
                      </span>
                    </button>
                  )}

                  {isReasonOpen && m.reasoning && (
                    <div
                      style={{
                        padding: '7px 10px',
                        borderRadius: '7px',
                        borderLeft: '2px solid var(--sov-accent)',
                        background: 'var(--sov-panel-bg)',
                        fontSize: '11px',
                        color: 'var(--sov-muted)',
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {m.reasoning}
                    </div>
                  )}

                  {/* Clean Concise Answer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {renderFormattedText(m.content, m.citations || [], (tag) => handleHighlightCitation(m.id, tag))}
                  </div>

                  {/* Minimal Footer */}
                  {(m.citations?.length > 0 || m.content) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        paddingTop: '6px',
                        borderTop: '1px solid var(--sov-border)'
                      }}
                    >
                      {(m.citations || []).length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setExpandedSources((p) => ({ ...p, [m.id]: !p[m.id] }))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--sov-border)',
                            background: isSourcesOpen ? 'var(--sov-accent-soft)' : 'transparent',
                            color: isSourcesOpen ? 'var(--sov-accent)' : 'var(--sov-muted)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <span>Sources ({m.citations.length})</span>
                          {isSourcesOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        </button>
                      ) : (
                        <span />
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.content)}
                          title="Copy"
                          style={{ background: 'transparent', border: 'none', color: 'var(--sov-muted)', padding: '3px', cursor: 'pointer', display: 'flex' }}
                        >
                          {copiedId === m.id ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'up')}
                          title="Helpful"
                          style={{ background: 'transparent', border: 'none', color: m.feedback === 'up' ? '#10b981' : 'var(--sov-muted)', padding: '3px', cursor: 'pointer', display: 'flex' }}
                        >
                          <ThumbsUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'down')}
                          title="Not helpful"
                          style={{ background: 'transparent', border: 'none', color: m.feedback === 'down' ? '#ef4444' : 'var(--sov-muted)', padding: '3px', cursor: 'pointer', display: 'flex' }}
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {isSourcesOpen && (m.citations || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '2px' }}>
                      {m.citations.map((c) => {
                        const isHighlighted = highlightedCitKey === `${m.id}:${String(c.tag).toUpperCase()}`;
                        const hasCoords = c.lat != null && c.lon != null && !Number.isNaN(Number(c.lat));
                        return (
                          <div
                            key={c.tag}
                            id={`sov-cit-${m.id}-${String(c.tag).toUpperCase()}`}
                            style={{
                              padding: '7px 9px',
                              borderRadius: '8px',
                              border: `1px solid ${isHighlighted ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                              background: isHighlighted ? 'var(--sov-accent-soft)' : 'var(--sov-panel-bg)',
                              fontSize: '11px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: 'var(--sov-text)', lineHeight: 1.35 }}>
                              <span style={{ color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)', marginRight: '5px' }}>
                                [{c.tag}]
                              </span>
                              {c.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', color: 'var(--sov-muted)', fontSize: '10.5px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    letterSpacing: '0.02em',
                                    background: c.isExternalWeb ? 'rgba(56,189,248,0.12)' : 'var(--sov-accent-soft)',
                                    color: c.isExternalWeb ? '#38bdf8' : 'var(--sov-accent)',
                                    border: `1px solid ${c.isExternalWeb ? 'rgba(56,189,248,0.3)' : 'var(--sov-border)'}`
                                  }}
                                >
                                  {c.isExternalWeb ? (c.sourceLabel || 'Web Verification') : 'SovDash'}
                                </span>
                                <span>{[c.location, c.dateStr].filter(Boolean).join(' · ')}</span>
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {hasCoords && onFocusLocation && (
                                  <button
                                    type="button"
                                    onClick={() => onFocusLocation(c.lat, c.lon)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '1px 6px',
                                      borderRadius: '5px',
                                      border: '1px solid var(--sov-border)',
                                      background: 'transparent',
                                      color: 'var(--sov-accent)',
                                      fontSize: '10.5px',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <MapPin size={10} /> Locate
                                  </button>
                                )}
                                <a
                                  href={formatCitationUrl(c)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--sov-accent)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                >
                                  Source <ExternalLink size={10} />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <SovDashThinkingVisualizer
                elapsedSec={elapsedSec}
                promptText={messages[messages.length - 1]?.content || ''}
              />
            )}

            {errorMsg && (
              <div style={{ flexShrink: 0, padding: '8px 11px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.45)', background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '12px' }}>
                {errorMsg}
              </div>
            )}
            <div aria-hidden="true" style={{ height: '4px', flexShrink: 0 }} />
          </div>

          {/* Clean Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              flexShrink: 0,
              padding: '10px 12px',
              borderTop: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              display: 'flex',
              gap: '7px',
              alignItems: 'flex-end'
            }}
          >
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about events, laws, or infrastructure..."
              style={{
                flex: 1,
                resize: 'none',
                padding: '8px 10px',
                borderRadius: '9px',
                border: '1px solid var(--sov-border)',
                background: 'var(--sov-panel-bg)',
                color: 'var(--sov-text)',
                fontSize: '12.5px',
                lineHeight: 1.4,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || input.trim().length < 3}
              aria-label="Send message"
              style={{
                height: '36px',
                width: '36px',
                borderRadius: '9px',
                border: 'none',
                background: input.trim().length >= 3 && !loading ? 'var(--sov-accent)' : 'var(--sov-border)',
                color: '#020617',
                cursor: input.trim().length >= 3 && !loading ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Send size={14} />
            </button>
          </form>

          {/* Subtle PLG Enterprise Private RAG AI Funnel */}
          <div
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderTop: '1px solid var(--sov-border)',
              background: 'var(--sov-panel-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              fontSize: '10.5px',
              color: 'var(--sov-muted)'
            }}
          >
            <span>Need private RAG AI on your company&apos;s own data?</span>
            <a
              href="https://sovdash.com/solutions.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--sov-accent)',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              Enterprise Blueprints <ExternalLink size={10} />
            </a>
          </div>
        </>
      )}
    </aside>
  );
}
