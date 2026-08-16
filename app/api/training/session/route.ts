import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrCreateSession, getNextScenarioForUser } from '@/lib/services/training.service';

// POST /api/training/session — start or resume a session and get the next scenario
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const sessionId = await getOrCreateSession(userId);
    const nextScenario = await getNextScenarioForUser(userId);

    return NextResponse.json({
      sessionId,
      scenarioId: nextScenario.scenarioId,
      adaptiveSelection: nextScenario.adaptiveSelection,
      usedFallback: nextScenario.usedFallback,
    });
  } catch (error) {
    console.error('[POST /api/training/session]', error);
    return NextResponse.json({ error: 'Failed to start training session' }, { status: 500 });
  }
}
