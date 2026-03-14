import { NextRequest, NextResponse } from 'next/server';
import { initializeSchema } from '@/lib/analytics/db';

// ---------------------------------------------------------------------------
// POST /api/analytics/init  — One-time DB schema setup (password-protected)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { password } = (await request.json()) as { password?: string };

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 503 },
      );
    }

    if (!password || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 },
      );
    }

    await initializeSchema();

    return NextResponse.json({
      ok: true,
      message: 'Schema initialized successfully',
    });
  } catch (error) {
    console.error('[analytics/init] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize schema',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
