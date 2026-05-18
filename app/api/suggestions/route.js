import { NextResponse } from 'next/server';
import { sendSuggestionEmail } from '@/lib/mail';
import { initDb, saveSuggestion } from '@/lib/db';

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

    // 3. Dispatch Feedback Intelligence Report email
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

    return NextResponse.json({
      success: true,
      message: 'Feedback intelligence report successfully saved and dispatched to system administrator.'
    }, { status: 200 });

  } catch (error) {
    console.error('Suggestions API Error:', error);
    return NextResponse.json(
      { error: 'Internal system fault. Could not dispatch feedback report.' },
      { status: 500 }
    );
  }
}
