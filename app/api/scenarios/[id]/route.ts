import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getScenarioById } from '@/lib/services/scenario.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid scenario ID' }, { status: 400 });
    }

    const scenario = await getScenarioById(id);
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    // Strip ground-truth fields from client response (anti-cheat)
    // Users must not see is_phishing / explanation / indicator.present before attempting
    const { is_phishing, explanation, ...safeScenario } = scenario;
    const sanitizedIndicators = scenario.indicators.map(({ indicator_type, description }) => ({
      indicator_type,
      description,
      // is_present is intentionally omitted here
    }));

    return NextResponse.json({ ...safeScenario, indicators: sanitizedIndicators });
  } catch (error) {
    console.error('[GET /api/scenarios/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
