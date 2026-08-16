import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const perPage = 20;
  const offset = (page - 1) * perPage;

  const [users, [{ count }]] = await Promise.all([
    db
      .selectFrom('users as u')
      .select([
        'u.id', 'u.email', 'u.name', 'u.role', 'u.created_at',
        db.fn.countAll<number>().as('attempt_count'),
      ])
      .leftJoin('user_attempts as ua', 'ua.user_id', 'u.id')
      .groupBy(['u.id', 'u.email', 'u.name', 'u.role', 'u.created_at'])
      .orderBy('u.created_at', 'desc')
      .limit(perPage)
      .offset(offset)
      .execute(),
    db.selectFrom('users').select(db.fn.countAll<number>().as('count')).execute(),
  ]);

  return NextResponse.json({ users, total: Number(count), page, perPage });
}
