import { db } from '@/lib/db';
import { sql } from 'kysely';
import { getAiProvider } from '@/lib/ai/provider-factory';
import { generateWithValidation } from '@/lib/services/validation.service';
import { getRandomActiveCompanyDomain } from '@/lib/services/company-domain.service';
import type { ScenarioGenerationParams, ScenarioDraft } from '@/lib/ai/types';
import type { Scenario, NewScenario, NewScenarioIndicator } from '@/lib/db/types';

// ─── Fetch a scenario by ID (with its indicators) ────────────────────────────
export async function getScenarioById(id: number) {
  const scenario = await db
    .selectFrom('scenarios as s')
    .innerJoin('categories as c', 'c.id', 's.category_id')
    .innerJoin('difficulty_levels as d', 'd.id', 's.difficulty_id')
    .select([
      's.id', 's.sender', 's.recipient', 's.subject', 's.body',
      's.is_phishing', 's.source', 's.explanation', 's.recommended_training_skill',
      's.category_id', 's.difficulty_id',
      'c.name as category_name', 'c.slug as category_slug',
      'd.name as difficulty_name', 'd.slug as difficulty_slug',
    ])
    .where('s.id', '=', id)
    .executeTakeFirst();

  if (!scenario) return null;

  const indicators = await db
    .selectFrom('scenario_indicators')
    .selectAll()
    .where('scenario_id', '=', id)
    .execute();

  const activeDomain = await getRandomActiveCompanyDomain();

  if (activeDomain) {
    const defaultDomain = 'company-training.local';
    const replaceDomain = (text: string | null) => {
      if (!text) return text;
      return text.replace(new RegExp(defaultDomain, 'gi'), activeDomain.domain);
    };

    scenario.sender = replaceDomain(scenario.sender) as string;
    scenario.recipient = replaceDomain(scenario.recipient) as string;
    scenario.subject = replaceDomain(scenario.subject) as string;
    scenario.body = replaceDomain(scenario.body) as string;
    if (scenario.explanation) {
      scenario.explanation = replaceDomain(scenario.explanation) as string;
    }

    indicators.forEach(ind => {
      if (ind.description) {
        ind.description = replaceDomain(ind.description) as string;
      }
    });
  }

  return { ...scenario, indicators };
}

// ─── Get fallback scenario for a category/difficulty ─────────────────────────
export async function getFallbackScenario(
  categorySlug: string,
  difficultySlug: string,
  forceHallucination?: boolean,
  recentSubjects?: string[]
): Promise<ScenarioDraft> {
  let query = db
    .selectFrom('scenarios as s')
    .innerJoin('categories as c', 'c.id', 's.category_id')
    .innerJoin('difficulty_levels as d', 'd.id', 's.difficulty_id')
    .selectAll('s')
    .where('s.source', '=', 'fallback')
    .where('s.validation_status', '=', 'passed')
    .where('c.slug', '=', categorySlug)
    .where('d.slug', '=', difficultySlug)
    .where('s.is_hallucinated', '=', forceHallucination ? 1 : 0);

  if (recentSubjects && recentSubjects.length > 0) {
    query = query.where('s.subject', 'not in', recentSubjects);
  }

  const scenario = await query
    .orderBy(sql`RAND()`)
    .limit(1)
    .executeTakeFirst();

  if (!scenario) {
    // Last resort: any fallback scenario
    let anyQuery = db
      .selectFrom('scenarios')
      .selectAll()
      .where('source', '=', 'fallback')
      .where('validation_status', '=', 'passed')
      .where('is_hallucinated', '=', forceHallucination ? 1 : 0);

    if (recentSubjects && recentSubjects.length > 0) {
      anyQuery = anyQuery.where('subject', 'not in', recentSubjects);
    }

    const any = await anyQuery
      .orderBy(sql`RAND()`)
      .limit(1)
      .executeTakeFirst();

    if (!any) throw new Error('No fallback scenarios available in database');

    const indicators = await db
      .selectFrom('scenario_indicators')
      .selectAll()
      .where('scenario_id', '=', any.id)
      .execute();

    return scenarioRowToDraft(any, indicators);
  }

  const indicators = await db
    .selectFrom('scenario_indicators')
    .selectAll()
    .where('scenario_id', '=', scenario.id)
    .execute();

  return scenarioRowToDraft(scenario, indicators);
}

function scenarioRowToDraft(scenario: any, indicators: any[]): ScenarioDraft {
  return {
    category: scenario.category_slug ?? 'social_engineering',
    difficulty: scenario.difficulty_slug ?? 'beginner',
    sender: scenario.sender,
    recipient: scenario.recipient,
    subject: scenario.subject,
    body: scenario.body,
    is_phishing: Boolean(scenario.is_phishing),
    is_hallucinated: Boolean(scenario.is_hallucinated),
    indicators: indicators.map((i) => ({
      type: i.indicator_type,
      present: Boolean(i.is_present),
      description: i.description,
    })),
    explanation: scenario.explanation,
    recommended_training_skill: scenario.recommended_training_skill ?? 'general_awareness',
  };
}

// ─── Generate + validate + persist a new scenario ────────────────────────────
export async function generateAndPersistScenario(
  params: ScenarioGenerationParams
): Promise<{ scenarioId: number; usedFallback: boolean; retryCount: number }> {
  const provider = getAiProvider();

  const category = await db
    .selectFrom('categories')
    .select(['id', 'slug'])
    .where('slug', '=', params.category)
    .executeTakeFirstOrThrow();

  const difficulty = await db
    .selectFrom('difficulty_levels')
    .select(['id', 'slug'])
    .where('slug', '=', params.difficulty)
    .executeTakeFirstOrThrow();

  let recentSubjects: string[] = [];

  if (params.userId) {
    // If we have a user context, fetch scenarios this specific user has seen recently
    // across ALL sources (so we avoid repeating fallbacks too!)
    const userHistory = await db
      .selectFrom('user_attempts as ua')
      .innerJoin('scenarios as s', 's.id', 'ua.scenario_id')
      .select(['s.subject', 'ua.responded_at'])
      .where('ua.user_id', '=', params.userId)
      .orderBy('ua.responded_at', 'desc')
      .limit(15)
      .execute();
    recentSubjects = userHistory.map((h) => h.subject);
  } else {
    // Global fallback for anonymous generation
    const recentScenarios = await db
      .selectFrom('scenarios')
      .select('subject')
      .where('category_id', '=', category.id)
      .orderBy('created_at', 'desc')
      .limit(10)
      .execute();
    recentSubjects = recentScenarios.map((s) => s.subject);
  }
    
  const generatorParams = { ...params, recentSubjects };

  const result = await generateWithValidation(
    () => provider.generateScenario(generatorParams),
    () => getFallbackScenario(params.category, params.difficulty, params.forceHallucination, recentSubjects)
  );

  const { draft, validationReport, retryCount, usedFallback } = result;

  // Persist scenario
  const insertResult = await db
    .insertInto('scenarios')
    .values({
      category_id: category.id,
      difficulty_id: difficulty.id,
      sender: draft.sender,
      recipient: draft.recipient,
      subject: draft.subject,
      body: draft.body,
      is_phishing: draft.is_phishing ? 1 : 0,
      is_hallucinated: draft.is_hallucinated ? 1 : 0,
      source: usedFallback ? 'fallback' : 'ai_generated',
      validation_status: validationReport.passed ? 'passed' : 'failed',
      explanation: draft.explanation,
      recommended_training_skill: draft.recommended_training_skill,
    } as NewScenario)
    .executeTakeFirst();

  const scenarioId = Number(insertResult.insertId);

  // Persist indicators
  if (draft.indicators.length > 0) {
    await db
      .insertInto('scenario_indicators')
      .values(
        draft.indicators.map((ind) => ({
          scenario_id: scenarioId,
          indicator_type: ind.type,
          description: ind.description,
          is_present: ind.present ? 1 : 0,
        } as NewScenarioIndicator))
      )
      .execute();
  }

  // Persist validation result (audit trail)
  await db
    .insertInto('validation_results')
    .values({
      scenario_id: scenarioId,
      passed: validationReport.passed ? 1 : 0,
      failed_checks: JSON.stringify(validationReport.failedChecks) as any,
      retry_count: retryCount,
      used_fallback: usedFallback ? 1 : 0,
    })
    .execute();

  return { scenarioId, usedFallback, retryCount };
}

// ─── Admin: list scenarios ────────────────────────────────────────────────────
export async function listScenarios(page = 1, perPage = 20) {
  const offset = (page - 1) * perPage;
  const scenarios = await db
    .selectFrom('scenarios as s')
    .innerJoin('categories as c', 'c.id', 's.category_id')
    .innerJoin('difficulty_levels as d', 'd.id', 's.difficulty_id')
    .select([
      's.id', 's.sender', 's.subject', 's.is_phishing', 's.source',
      's.validation_status', 's.created_at',
      'c.name as category_name', 'd.name as difficulty_name',
    ])
    .orderBy('s.created_at', 'desc')
    .limit(perPage)
    .offset(offset)
    .execute();

  const [{ count }] = await db
    .selectFrom('scenarios')
    .select(db.fn.countAll<number>().as('count'))
    .execute();

  const activeDomain = await getRandomActiveCompanyDomain();

  if (activeDomain) {
    const defaultDomain = 'company-training.local';
    const replaceDomain = (text: string | null) => {
      if (!text) return text;
      return text.replace(new RegExp(defaultDomain, 'gi'), activeDomain.domain);
    };

    scenarios.forEach(s => {
      s.sender = replaceDomain(s.sender) as string;
      s.subject = replaceDomain(s.subject) as string;
    });
  }

  return { scenarios, total: Number(count), page, perPage };
}
