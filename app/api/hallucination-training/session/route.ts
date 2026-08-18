import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrCreateSession, getNextScenarioForUser } from '@/lib/services/training.service';

// POST /api/hallucination-training/session — start or resume a hallucination session
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const sessionId = await getOrCreateSession(userId);
    
    // 50-50 chance of hallucination
    const forceHallucination = Math.random() < 0.5;
    const nextScenario = await getNextScenarioForUser(userId, forceHallucination);

    return NextResponse.json({
      sessionId,
      scenarioId: nextScenario.scenarioId,
      adaptiveSelection: nextScenario.adaptiveSelection,
      usedFallback: nextScenario.usedFallback,
    });
  } catch (error) {
    console.error('[POST /api/hallucination-training/session]', error);
    return NextResponse.json({ error: 'Failed to start hallucination training session' }, { status: 500 });
  }
}
