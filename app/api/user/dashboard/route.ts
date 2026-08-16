import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.user.id);

  const [skills, recentAttempts, stats] = await Promise.all([
    db.selectFrom('user_skills').selectAll().where('user_id', '=', userId).execute(),
    db
      .selectFrom('user_attempts as ua')
      .innerJoin('scenarios as s', 's.id', 'ua.scenario_id')
      .innerJoin('categories as c', 'c.id', 's.category_id')
      .select(['ua.id', 'ua.is_correct', 'ua.score', 'ua.responded_at', 'ua.user_decision', 's.subject', 's.is_phishing', 'c.name as category_name'])
      .where('ua.user_id', '=', userId)
      .orderBy('ua.responded_at', 'desc')
      .limit(10)
      .execute(),
    db
      .selectFrom('user_attempts')
      .select([
        db.fn.countAll<number>().as('total_attempts'),
        db.fn.sum<number>('is_correct').as('correct_count'),
        db.fn.avg<number>('score').as('avg_score'),
      ])
      .where('user_id', '=', userId)
      .executeTakeFirst(),
  ]);

  return NextResponse.json({ skills, recentAttempts, stats });
}
