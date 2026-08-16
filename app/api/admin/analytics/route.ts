import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'kysely';


export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [totalUsers, totalAttempts, totalScenarios, categoryBreakdown, validationStats] =
    await Promise.all([
      db.selectFrom('users').select(db.fn.countAll<number>().as('count')).executeTakeFirst(),
      db.selectFrom('user_attempts').select(db.fn.countAll<number>().as('count')).executeTakeFirst(),
      db.selectFrom('scenarios').select(db.fn.countAll<number>().as('count')).executeTakeFirst(),
      db
        .selectFrom('user_attempts as ua')
        .innerJoin('scenarios as s', 's.id', 'ua.scenario_id')
        .innerJoin('categories as c', 'c.id', 's.category_id')
        .select([
          'c.name as category',
          db.fn.countAll<number>().as('attempts'),
          sql<number>`AVG(ua.is_correct)`.as('accuracy'),
        ])
        .groupBy(['c.id', 'c.name'])
        .execute(),
      db
        .selectFrom('validation_results')
        .select([
          db.fn.countAll<number>().as('total'),
          sql<number>`SUM(passed)`.as('passed'),
          sql<number>`SUM(used_fallback)`.as('fallbacks'),
        ])
        .executeTakeFirst(),
    ]);

  return NextResponse.json({
    totalUsers: Number(totalUsers?.count ?? 0),
    totalAttempts: Number(totalAttempts?.count ?? 0),
    totalScenarios: Number(totalScenarios?.count ?? 0),
    categoryBreakdown,
    validationStats,
  });
}
