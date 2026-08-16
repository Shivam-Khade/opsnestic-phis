import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { submitAttempt } from '@/lib/services/training.service';

const attemptSchema = z.object({
  sessionId: z.number().int().positive(),
  scenarioId: z.number().int().positive(),
  userDecision: z.enum(['phishing', 'legitimate']),
  indicatorsSelected: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = attemptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const userId = Number(session.user.id);
    const result = await submitAttempt({
      sessionId: parsed.data.sessionId,
      userId,
      scenarioId: parsed.data.scenarioId,
      userDecision: parsed.data.userDecision,
      indicatorsSelected: parsed.data.indicatorsSelected,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/training/attempt]', error);
    return NextResponse.json({ error: 'Failed to submit attempt' }, { status: 500 });
  }
}
