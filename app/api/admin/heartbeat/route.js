import { NextResponse } from 'next/server';
import { logAccess, updateHeartbeat, getActiveUsers } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

function getClientIp(request) {
  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  return ip || '127.0.0.1';
}

function geolocateFallback(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
    return 'Local Workstation (Encrypted Loopback)';
  }
  return 'Authenticated Edge Node (GeoIP Redacted)';
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
        return `${data.city}, ${data.country_name} [${data.country || ''}] (${data.org || 'ISP Uplink'})`;
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
    
    let location = await fetchRealGeolocation(ip);
    if (!location) {
      location = geolocateFallback(ip);
    }

    if (isLogin) {
      await logAccess(email, name || 'Anonymous Operator', ip, location, userAgent);
    }
    
    await updateHeartbeat(email, name || 'Anonymous Operator', ip, location);

    const activeUsers = await getActiveUsers();
    const auth = await verifyAdmin(request);
    const isAdmin = !auth.error && auth.user?.role === 'admin';

    return NextResponse.json({
      success: true,
      location,
      count: activeUsers.length,
      activeUsers: isAdmin ? activeUsers : []
    });
  } catch (error) {
    console.error('Operator heartbeat logging error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const activeUsers = await getActiveUsers();
    const auth = await verifyAdmin(request);
    const isAdmin = !auth.error && auth.user?.role === 'admin';

    return NextResponse.json({
      success: true,
      count: activeUsers.length,
      activeUsers: isAdmin ? activeUsers : []
    });
  } catch (error) {
    console.error('Operator heartbeat fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
