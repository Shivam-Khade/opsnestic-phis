import { db } from '@/lib/db';
import { selectNextScenario } from '@/lib/adaptive-engine';
import { generateAndPersistScenario, getScenarioById } from '@/lib/services/scenario.service';
import type { NewUserAttempt } from '@/lib/db/types';

// ─── Start or get current training session ────────────────────────────────────
export async function getOrCreateSession(userId: number): Promise<number> {
  const existing = await db
    .selectFrom('training_sessions')
    .select(['id'])
    .where('user_id', '=', userId)
    .where('ended_at', 'is', null)
    .orderBy('started_at', 'desc')
    .limit(1)
    .executeTakeFirst();

  if (existing) return existing.id;

  const result = await db
    .insertInto('training_sessions')
    .values({ user_id: userId })
    .executeTakeFirst();

  return Number(result.insertId);
}

// ─── Get the next scenario for a user (via adaptive engine) ──────────────────
export async function getNextScenarioForUser(userId: number): Promise<{
  scenarioId: number;
  usedFallback: boolean;
  adaptiveSelection: { category: string; difficulty: string; indicatorBias: string[] };
}> {
  // Load user's performance records for the adaptive engine
  const performanceRecords = await db
    .selectFrom('user_performance as up')
    .innerJoin('categories as c', 'c.id', 'up.category_id')
    .innerJoin('difficulty_levels as d', 'd.id', 'up.difficulty_id')
    .select([
      'up.category_id',
      'c.slug as category_slug',
      'up.indicator_type',
      'up.difficulty_id',
      'd.slug as difficulty_slug',
      'd.numeric_rank as difficulty_rank',
      'up.correct_count',
      'up.incorrect_count',
    ])
    .where('up.user_id', '=', userId)
    .execute();

  // Run adaptive engine (pure function — no DB dependency)
  const selection = selectNextScenario(performanceRecords as any);

  // Generate (or fetch fallback) a scenario matching the selection
  const { scenarioId, usedFallback } = await generateAndPersistScenario({
    category: selection.category,
    difficulty: selection.difficulty,
    indicatorBias: selection.indicatorBias,
    forcePhishing: Math.random() < 0.5,
  });

  return { scenarioId, usedFallback, adaptiveSelection: selection };
}

// ─── Submit an attempt ────────────────────────────────────────────────────────
export async function submitAttempt(params: {
  sessionId: number;
  userId: number;
  scenarioId: number;
  userDecision: 'phishing' | 'legitimate';
  indicatorsSelected: string[];
}): Promise<{
  isCorrect: boolean;
  score: number;
  explanation: string;
  indicators: Array<{ type: string; present: boolean; description: string }>;
}> {
  const scenario = await getScenarioById(params.scenarioId);
  if (!scenario) throw new Error('Scenario not found');

  const correctDecision = scenario.is_phishing ? 'phishing' : 'legitimate';
  const isCorrect = params.userDecision === correctDecision;

  // Scoring: 100 for correct decision + up to 50 bonus for identified indicators
  let score = 0;
  if (isCorrect) {
    score = 100;
    const presentIndicators = scenario.indicators
      .filter((i) => i.is_present)
      .map((i) => i.indicator_type);
    const correctlyIdentified = params.indicatorsSelected.filter((s) =>
      presentIndicators.includes(s)
    );
    const bonusPerIndicator = presentIndicators.length > 0
      ? Math.floor(50 / presentIndicators.length)
      : 0;
    score += correctlyIdentified.length * bonusPerIndicator;
  }

  // Persist attempt
  await db
    .insertInto('user_attempts')
    .values({
      session_id: params.sessionId,
      user_id: params.userId,
      scenario_id: params.scenarioId,
      user_decision: params.userDecision,
      indicators_selected: JSON.stringify(params.indicatorsSelected) as any,
      is_correct: isCorrect ? 1 : 0,
      score,
    } as NewUserAttempt)
    .execute();

  // Update performance aggregates
  await updateUserPerformance({
    userId: params.userId,
    categoryId: (scenario as any).category_id as number,
    indicators: scenario.indicators as any[],
    selectedIndicators: params.indicatorsSelected,
    difficultyId: (scenario as any).difficulty_id as number,
    isCorrect,
  });

  return {
    isCorrect,
    score,
    explanation: scenario.explanation,
    indicators: scenario.indicators.map((i) => ({
      type: i.indicator_type,
      present: Boolean(i.is_present),
      description: i.description,
    })),
  };
}

// ─── Update UserPerformance aggregate ─────────────────────────────────────────
async function updateUserPerformance(params: {
  userId: number;
  categoryId: number;
  indicators: Array<{ indicator_type: string; is_present: number }>;
  selectedIndicators: string[];
  difficultyId: number;
  isCorrect: boolean;
}) {
  const { userId, categoryId, difficultyId, isCorrect } = params;

  // Update general category performance
  await upsertPerformance(userId, categoryId, 'general', difficultyId, isCorrect);

  // Update per-indicator performance (was the user correct about each indicator?)
  for (const indicator of params.indicators.filter((i) => i.is_present)) {
    const userIdentifiedIt = params.selectedIndicators.includes(indicator.indicator_type);
    await upsertPerformance(userId, categoryId, indicator.indicator_type, difficultyId, userIdentifiedIt);
  }

  // Refresh user_skills table
  await refreshUserSkills(userId);
}

async function upsertPerformance(
  userId: number,
  categoryId: number,
  indicatorType: string,
  difficultyId: number,
  isCorrect: boolean
) {
  const existing = await db
    .selectFrom('user_performance')
    .select(['id', 'correct_count', 'incorrect_count'])
    .where('user_id', '=', userId)
    .where('category_id', '=', categoryId)
    .where('indicator_type', '=', indicatorType)
    .where('difficulty_id', '=', difficultyId)
    .executeTakeFirst();

  if (existing) {
    await db
      .updateTable('user_performance')
      .set({
        correct_count: existing.correct_count + (isCorrect ? 1 : 0),
        incorrect_count: existing.incorrect_count + (isCorrect ? 0 : 1),
      })
      .where('id', '=', existing.id)
      .execute();
  } else {
    await db
      .insertInto('user_performance')
      .values({
        user_id: userId,
        category_id: categoryId,
        indicator_type: indicatorType,
        difficulty_id: difficultyId,
        correct_count: isCorrect ? 1 : 0,
        incorrect_count: isCorrect ? 0 : 1,
      })
      .execute();
  }
}

// ─── Refresh UserSkills from performance data ─────────────────────────────────
export async function refreshUserSkills(userId: number) {
  const performanceRows = await db
    .selectFrom('user_performance as up')
    .innerJoin('categories as c', 'c.id', 'up.category_id')
    .select([
      'c.slug as skill_area',
      'up.correct_count',
      'up.incorrect_count',
    ])
    .where('up.user_id', '=', userId)
    .where('up.indicator_type', '=', 'general')
    .execute();

  const statsMap = new Map<string, { correct: number; incorrect: number }>();
  for (const row of performanceRows) {
    const stats = statsMap.get(row.skill_area) || { correct: 0, incorrect: 0 };
    stats.correct += row.correct_count;
    stats.incorrect += row.incorrect_count;
    statsMap.set(row.skill_area, stats);
  }

  for (const [skill_area, stats] of statsMap.entries()) {
    const total = stats.correct + stats.incorrect;
    if (total === 0) continue;
    const accuracy = stats.correct / total;
    const level =
      accuracy >= 0.85 ? 'strong' : accuracy >= 0.60 ? 'moderate' : 'weak';

    const existing = await db
      .selectFrom('user_skills')
      .select(['id'])
      .where('user_id', '=', userId)
      .where('skill_area', '=', skill_area)
      .executeTakeFirst();

    if (existing) {
      await db
        .updateTable('user_skills')
        .set({ proficiency_level: level, accuracy_score: accuracy * 100 })
        .where('id', '=', existing.id)
        .execute();
    } else {
      await db
        .insertInto('user_skills')
        .values({
          user_id: userId,
          skill_area: skill_area,
          proficiency_level: level,
          accuracy_score: accuracy * 100,
        })
        .execute();
    }
  }
}

// ─── Training history ─────────────────────────────────────────────────────────
export async function getTrainingHistory(userId: number, limit = 20) {
  return db
    .selectFrom('user_attempts as ua')
    .innerJoin('scenarios as s', 's.id', 'ua.scenario_id')
    .innerJoin('categories as c', 'c.id', 's.category_id')
    .innerJoin('difficulty_levels as d', 'd.id', 's.difficulty_id')
    .select([
      'ua.id',
      'ua.user_decision',
      'ua.is_correct',
      'ua.score',
      'ua.responded_at',
      's.subject',
      's.is_phishing',
      'c.name as category_name',
      'd.name as difficulty_name',
    ])
    .where('ua.user_id', '=', userId)
    .orderBy('ua.responded_at', 'desc')
    .limit(limit)
    .execute();
}
