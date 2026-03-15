import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { castVote, getVoteCounts, getUserVote } from '@/lib/analytics/db';
import { verifyUserToken, COOKIE_NAME } from '@/lib/analytics/auth';

// ---------------------------------------------------------------------------
// Helper: resolve userId from cookie (returns null for anonymous users)
// ---------------------------------------------------------------------------
async function resolveUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = await verifyUserToken(token);
    return payload?.userId ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// GET /api/votes?itemId=xxx
// Returns: { counts: { add: 5, confused: 2, ... }, userVote: 'add' | null }
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const itemId = req.nextUrl.searchParams.get('itemId');
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    const [counts, userId] = await Promise.all([
      getVoteCounts(itemId),
      resolveUserId(),
    ]);

    let userVote: string | null = null;
    if (userId) {
      userVote = await getUserVote(itemId, userId);
    }

    return NextResponse.json({ counts, userVote });
  } catch (err) {
    console.error('[votes GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/votes
// Body: { itemId: string, voteType: string }
// Returns: { counts: { ... }, userVote: string | null }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { itemId?: string; voteType?: string };
    const { itemId, voteType } = body;

    if (!itemId || !voteType) {
      return NextResponse.json({ error: 'itemId and voteType are required' }, { status: 400 });
    }

    const validVoteTypes = ['add', 'confused', 'reduce', 'remove'];
    if (!validVoteTypes.includes(voteType)) {
      return NextResponse.json({ error: 'Invalid voteType' }, { status: 400 });
    }

    const userId = await resolveUserId();

    // For anonymous users derive a stable session id from cookie or generate one
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('vote_session')?.value ?? null;

    await castVote(itemId, voteType, userId ?? undefined, sessionId ?? undefined);

    const counts = await getVoteCounts(itemId);
    const userVote = userId ? await getUserVote(itemId, userId) : voteType;

    const response = NextResponse.json({ counts, userVote });

    // Persist anonymous session cookie if not already set
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      response.cookies.set('vote_session', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
    }

    return response;
  } catch (err) {
    console.error('[votes POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
