import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCompanyDomains, createCompanyDomain } from '@/lib/services/company-domain.service';

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const domains = await getCompanyDomains();
    return NextResponse.json(domains);
  } catch (error) {
    console.error('[GET /api/admin/domains]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { domain, name, industry, is_active } = body;

    if (!domain || !name || !industry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = await createCompanyDomain({
      domain,
      name,
      industry,
      is_active: is_active ? 1 : 0,
    } as any);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[POST /api/admin/domains]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
