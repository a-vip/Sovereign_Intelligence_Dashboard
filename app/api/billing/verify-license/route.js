import { NextResponse } from 'next/server';
import { redeemLicenseKey } from '../../../../lib/db.js';
import { signSessionToken } from '../../../../lib/auth.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, licenseKey } = body || {};

    if (!licenseKey || typeof licenseKey !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid Sovereign License Key (e.g. SOV-XXXX-XXXX-XXXX).' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await redeemLicenseKey(email || '', licenseKey);
    const { license, user } = result;

    let sessionToken = null;
    const responsePayload = {
      success: true,
      tier: license.plan || 'pro',
      licenseKey: license.license_key,
      email: license.email,
      user: user
        ? {
            id: user.id,
            email: user.email,
            fullName: user.full_name || user.fullName,
            role: user.role,
            tier: user.tier || license.plan || 'pro',
            licenseKey: user.license_key || license.license_key
          }
        : null
    };

    if (responsePayload.user) {
      sessionToken = signSessionToken(responsePayload.user);
      responsePayload.user.sessionToken = sessionToken;
    }

    const response = NextResponse.json(responsePayload, { status: 200, headers: CORS_HEADERS });

    if (sessionToken) {
      response.cookies.set('sov_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'License verification failed.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}

