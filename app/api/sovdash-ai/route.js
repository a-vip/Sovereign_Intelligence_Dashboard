import { NextResponse } from 'next/server';
import { extractSessionPayload } from '@/lib/adminAuth';
import { getUserById, initDb } from '@/lib/db';
import {
  getAiConfig,
  getKnowledgeChunkStats,
  getSessionMessages,
  getUserChatSessions,
  updateMessageFeedback
} from '@/lib/sovdashAiDb';
import { runSovDashAiTurn } from '@/lib/sovdashAiEngine';

export const dynamic = 'force-dynamic';

async function requireAuthenticatedUser(request) {
  await initDb();
  const payload = extractSessionPayload(request);
  if (!payload?.email) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to use SovDash AI.' },
        { status: 401 }
      )
    };
  }
  const dbUser = payload.uid ? await getUserById(payload.uid).catch(() => null) : null;
  return {
    user: dbUser || {
      id: payload.uid || payload.email,
      email: payload.email,
      role: payload.role || 'analyst',
      fullName: payload.fullName || payload.email.split('@')[0]
    }
  };
}

export async function GET(request) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const [sessions, messages, config, indexStats] = await Promise.all([
      getUserChatSessions(auth.user.email),
      sessionId ? getSessionMessages(sessionId, auth.user.email) : Promise.resolve([]),
      getAiConfig(),
      getKnowledgeChunkStats()
    ]);

    return NextResponse.json({
      success: true,
      user: { email: auth.user.email, role: auth.user.role },
      activeEngine: {
        provider: config.provider,
        modelId: config.modelId,
        allowWebAugmentation: config.allowWebAugmentation,
        strictCitationLock: config.strictCitationLock
      },
      indexStats,
      sessions,
      messages
    });
  } catch (error) {
    console.error('[/api/sovdash-ai GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const prompt = String(body.prompt || body.question || '').trim();
    const sessionId = body.sessionId ? String(body.sessionId).trim() : null;
    const history = Array.isArray(body.history) ? body.history : [];

    if (prompt.length < 3 || prompt.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Prompt must be between 3 and 2000 characters.' },
        { status: 400 }
      );
    }

    const result = await runSovDashAiTurn({
      prompt,
      history,
      user: auth.user,
      sessionId,
      persist: true
    });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[/api/sovdash-ai POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const messageId = String(body.messageId || '').trim();
    const feedback = body.feedback === 'up' || body.feedback === 'down' ? body.feedback : null;

    if (!messageId) {
      return NextResponse.json({ success: false, error: 'messageId is required.' }, { status: 400 });
    }

    const res = await updateMessageFeedback(messageId, auth.user.email, feedback);
    return NextResponse.json({ success: true, ...res });
  } catch (error) {
    console.error('[/api/sovdash-ai PATCH] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
