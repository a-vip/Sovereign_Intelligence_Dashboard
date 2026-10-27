import { NextResponse } from 'next/server';
import { sendSuggestionEmail } from '@/lib/mail';
import { initDb, saveSuggestion } from '@/lib/db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req) {
  try {
    // Ensure DB is initialized (highly resilient)
    await initDb();

    const body = await req.json();
    const { type, subject, details, targetId, operatorEmail, operatorName, screenshot } = body;

    // 1. Validation and Sanity checks
    if (!type || !subject || !details || !operatorEmail || !operatorName) {
      return NextResponse.json(
        { error: 'Missing required transmission fields. Submitter session data, subject, and details are required.' },
        { status: 400 }
      );
    }

    const host = req.headers.get('host') || 'localhost:3000';

    // 2. Persist suggestion to the Neon/local database
    await saveSuggestion({
      type,
      subject: subject.trim(),
      details: details.trim(),
      targetId: targetId ? targetId.trim() : null,
      operatorEmail: operatorEmail.toLowerCase().trim(),
      operatorName: operatorName.trim(),
      screenshot: screenshot || null
    });

    // 3. Dispatch Feedback Intelligence Report email (resilient, non-blocking fallback)
    try {
      await sendSuggestionEmail({
        type,
        subject: subject.trim(),
        details: details.trim(),
        targetId: targetId ? targetId.trim() : null,
        operatorEmail: operatorEmail.toLowerCase().trim(),
        operatorName: operatorName.trim(),
        screenshot: screenshot || null,
        host
      });
    } catch (emailError) {
      console.error('[SUGGESTIONS] Failed to dispatch feedback email notification:', emailError);
      // Proceed gracefully - feedback is already safely persisted in the database!
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback intelligence report successfully saved and dispatched to system administrator.'
    }, { status: 200, headers: CORS_HEADERS });

  } catch (error) {
    console.error('Suggestions API Error:', error);
    return NextResponse.json(
      { error: 'Internal system fault. Could not dispatch feedback report.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
