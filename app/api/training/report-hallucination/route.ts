import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = Number(session.user.id);

    const body = await req.json();
    const { scenarioId, sessionId } = body;

    if (!scenarioId || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify session belongs to user
    const userSession = await db
      .selectFrom('training_sessions')
      .selectAll()
      .where('id', '=', Number(sessionId))
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!userSession) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 });
    }

    await db
      .insertInto('reported_hallucinations')
      .values({
        user_id: userId,
        scenario_id: Number(scenarioId),
        session_id: Number(sessionId),
      })
      .execute();

    const scenario = await db
      .selectFrom('scenarios')
      .select('is_hallucinated')
      .where('id', '=', Number(scenarioId))
      .executeTakeFirst();

    return NextResponse.json({ 
      success: true, 
      wasHallucinated: Boolean(scenario?.is_hallucinated) 
    });
  } catch (error) {
    console.error('Error reporting hallucination:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
