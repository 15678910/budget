import { NextRequest, NextResponse } from 'next/server';
import { insertEvent } from '@/lib/analytics/db';

// ---------------------------------------------------------------------------
// POST /api/analytics/event
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, eventType, eventData, pagePath } = body as {
      sessionId?: string;
      eventType?: string;
      eventData?: Record<string, unknown>;
      pagePath?: string;
    };

    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: 'sessionId and eventType are required' },
        { status: 400 },
      );
    }

    // Insert the event
    await insertEvent({
      sessionId,
      eventType,
      eventData: eventData ?? {},
      pagePath: pagePath ?? '',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[analytics/event] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
