import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listScenarios } from '@/lib/services/scenario.service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const result = await listScenarios(page, 20);

  return NextResponse.json(result);
}
