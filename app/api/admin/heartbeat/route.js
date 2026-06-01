import { NextResponse } from 'next/server';
import { logAccess, updateHeartbeat } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getClientIp(request) {
  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  return ip || '127.0.0.1';
}

function geolocateMock(ip, email) {
  const cleanEmail = (email || '').toLowerCase().trim();
  const mockMap = {
    'workwithavip@gmail.com': 'Munich, Germany (Command Terminal Stn-1)',
    'analyst1@sovdash.com': 'London, UK (OSINT Hub-4)',
    'guest@sovdash.com': 'Tokyo, Japan (Remote Observer Station)',
  };
  if (mockMap[cleanEmail]) {
    return mockMap[cleanEmail];
  }
  
  const locations = [
    'Washington D.C., US (HQ Command Desk)',
    'Brussels, Belgium (NATO Cyber Command)',
    'Geneva, Switzerland (Disarmament Watch)',
    'Stockholm, Sweden (Sovereign Node-B)',
    'Canberra, Australia (Pacific Uplink)'
  ];
  let hash = 0;
  for (let i = 0; i < cleanEmail.length; i++) {
    hash = cleanEmail.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % locations.length;
  return locations[idx];
}

async function fetchRealGeolocation(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip.startsWith('172.31.')) {
    return null;
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.city && data.country_name) {
        return `${data.city}, ${data.country_name} (${data.org || 'ISP Uplink'})`;
      }
    }
  } catch (err) {
    console.warn(`Real GeoIP lookup failed for IP ${ip}:`, err.message);
  }
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, isLogin } = body;

    if (!email) {
      return NextResponse.json({ error: 'Operator email is required for telemetry update.' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown Agent';
    
    // Attempt dynamic lookup, fallback to deterministic cyber stations for local testing
    let location = await fetchRealGeolocation(ip);
    if (!location) {
      location = geolocateMock(ip, email);
    }

    if (isLogin) {
      await logAccess(email, name || 'Anonymous Operator', ip, location, userAgent);
    }
    
    await updateHeartbeat(email, name || 'Anonymous Operator', ip, location);

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error('Operator heartbeat logging error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
