import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateCompanyDomain, deleteCompanyDomain } from '@/lib/services/company-domain.service';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    const body = await req.json();

    const updates: any = {};
    if (body.domain !== undefined) updates.domain = body.domain;
    if (body.name !== undefined) updates.name = body.name;
    if (body.industry !== undefined) updates.industry = body.industry;
    if (body.is_active !== undefined) updates.is_active = body.is_active ? 1 : 0;

    await updateCompanyDomain(id, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/admin/domains/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);

    await deleteCompanyDomain(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/domains/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
