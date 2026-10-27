import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createOrUpdateLicense } from '../../../../lib/db.js';

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
    const { email, licenseKey, plan = 'pro', amount = 2900, paymentIntentId = null } = body || {};

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid operator email is required for license provisioning.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    let finalKey = (licenseKey || '').trim().toUpperCase();
    if (!finalKey || !finalKey.startsWith('SOV-')) {
      const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase();
      finalKey = `SOV-${seg()}-${seg()}-${seg()}`;
    }

    const record = await createOrUpdateLicense({
      licenseKey: finalKey,
      email: email.trim().toLowerCase(),
      plan,
      amount,
      paymentIntentId
    });

    return NextResponse.json(
      {
        success: true,
        licenseKey: finalKey,
        email: record.email,
        plan: record.plan,
        status: 'active'
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('[Billing Provision Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to provision license.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

