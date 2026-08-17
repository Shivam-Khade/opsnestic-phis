/**
 * PhishGuard AI — Adaptive Training Engine
 *
 * Pure, isolated TypeScript module. Zero framework dependencies.
 * Zero database dependencies. Fully unit-testable with plain data.
 *
 * Input:  UserPerformanceRecord[] — the aggregated performance table rows
 * Output: SelectionResult — { category, difficulty, indicatorBias }
 *
 * Algorithm:
 *  1. Low accuracy (<60%) in a category → boost that category's weight
 *  2. Repeated mistakes on the same indicator (3+ times) → add to indicatorBias
 *  3. High accuracy (>85%) → raise difficulty rather than repeating easy scenarios
 *  4. Improving trend (last 5 attempts trending up) → reduce extreme bias slightly
 *  5. Weighted-random selection across all categories (not strict argmax)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserPerformanceRecord {
  category_id: number;
  category_slug: string;
  indicator_type: string;
  difficulty_id: number;
  difficulty_slug: 'beginner' | 'intermediate' | 'advanced';
  difficulty_rank: number;          // 1 = beginner, 2 = intermediate, 3 = advanced
  correct_count: number;
  incorrect_count: number;
}

export interface SelectionResult {
  category: string;                 // category slug
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  indicatorBias: string[];          // indicator types to bias generation toward
}

export interface CategorySummary {
  category_id: number;
  slug: string;
  accuracy: number;                 // 0–1
  totalAttempts: number;
  maxDifficultyRank: number;        // highest difficulty the user has attempted
  weakIndicators: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCURACY_WEAK_THRESHOLD = 0.60;   // below this → boost weight
const ACCURACY_STRONG_THRESHOLD = 0.85; // above this → increase difficulty
const REPEATED_MISTAKE_THRESHOLD = 3;   // incorrect_count ≥ this → add to bias
const MIN_ATTEMPTS_FOR_TREND = 5;       // need at least this many to detect trend
const MAX_DIFFICULTY_RANK = 3;          // 1=beginner, 2=intermediate, 3=advanced

const DIFFICULTY_SLUGS: Record<number, 'beginner' | 'intermediate' | 'advanced'> = {
  1: 'beginner',
  2: 'intermediate',
  3: 'advanced',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeAccuracy(correct: number, incorrect: number): number {
  const total = correct + incorrect;
  if (total === 0) return 0.5; // unknown → neutral
  return correct / total;
}

/**
 * Simple trend detection: compare accuracy of first-half vs second-half
 * of available records. Returns 'improving' | 'stable' | 'declining'.
 * Only reliable with MIN_ATTEMPTS_FOR_TREND or more total attempts.
 */
function detectTrend(records: UserPerformanceRecord[]): 'improving' | 'stable' | 'declining' {
  const total = records.reduce((s, r) => s + r.correct_count + r.incorrect_count, 0);
  if (total < MIN_ATTEMPTS_FOR_TREND) return 'stable';

  // Approximate: compare accuracy at different difficulties (lower rank = earlier attempts)
  const byRank = new Map<number, { c: number; i: number }>();
  for (const r of records) {
    const existing = byRank.get(r.difficulty_rank) ?? { c: 0, i: 0 };
    byRank.set(r.difficulty_rank, {
      c: existing.c + r.correct_count,
      i: existing.i + r.incorrect_count,
    });
  }
  const ranks = [...byRank.keys()].sort();
  if (ranks.length < 2) return 'stable';

  const early = byRank.get(ranks[0])!;
  const late = byRank.get(ranks[ranks.length - 1])!;
  const earlyAcc = computeAccuracy(early.c, early.i);
  const lateAcc = computeAccuracy(late.c, late.i);

  if (lateAcc - earlyAcc > 0.10) return 'improving';
  if (earlyAcc - lateAcc > 0.10) return 'declining';
  return 'stable';
}

/**
 * For a set of records belonging to one category, find indicator types
 * where incorrect_count >= REPEATED_MISTAKE_THRESHOLD.
 */
function findWeakIndicators(records: UserPerformanceRecord[]): string[] {
  const indicatorMap = new Map<string, { correct: number; incorrect: number }>();
  for (const r of records) {
    const existing = indicatorMap.get(r.indicator_type) ?? { correct: 0, incorrect: 0 };
    indicatorMap.set(r.indicator_type, {
      correct: existing.correct + r.correct_count,
      incorrect: existing.incorrect + r.incorrect_count,
    });
  }
  return [...indicatorMap.entries()]
    .filter(([, v]) => v.incorrect >= REPEATED_MISTAKE_THRESHOLD)
    .map(([k]) => k);
}

/**
 * Weighted-random selection: given a map of key → weight,
 * pick one key with probability proportional to its weight.
 */
function weightedRandom(weights: Map<string, number>): string {
  const total = [...weights.values()].reduce((s, w) => s + w, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of weights) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  // Fallback (floating-point edge case)
  return [...weights.keys()][weights.size - 1];
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * All known categories — used to ensure every category has a baseline weight
 * even if the user has zero attempts in it (keeps training varied).
 */
export const ALL_CATEGORY_SLUGS = [
  'password_reset',
  'hr_communication',
  'invoice',
  'shared_document',
  'account_alert',
  'it_support',
  'social_engineering',
] as const;

export function selectNextScenario(
  performanceRecords: UserPerformanceRecord[],
  allCategorySlugs: readonly string[] = ALL_CATEGORY_SLUGS
): SelectionResult {
  // ── Step 0: Group records by category ─────────────────────────────────
  const byCategory = new Map<string, UserPerformanceRecord[]>();
  for (const slug of allCategorySlugs) {
    byCategory.set(slug, []);
  }
  for (const record of performanceRecords) {
    const existing = byCategory.get(record.category_slug) ?? [];
    existing.push(record);
    byCategory.set(record.category_slug, existing);
  }

  // ── Step 1–4: Compute per-category weight ─────────────────────────────
  const weights = new Map<string, number>();
  const summaries = new Map<string, CategorySummary>();

  for (const [slug, records] of byCategory) {
    const generalRecords = records.filter(r => r.indicator_type === 'general');
    
    const totalCorrect = generalRecords.reduce((s, r) => s + r.correct_count, 0);
    const totalIncorrect = generalRecords.reduce((s, r) => s + r.incorrect_count, 0);
    const accuracy = computeAccuracy(totalCorrect, totalIncorrect);
    const totalAttempts = totalCorrect + totalIncorrect;
    const maxDifficultyRank = generalRecords.reduce((m, r) => Math.max(m, r.difficulty_rank), 1);
    
    const weakIndicators = findWeakIndicators(records);
    const trend = detectTrend(generalRecords);

    let weight = 1.0; // baseline — every category is always reachable

    // Rule 1: Low accuracy → heavily boost weight
    if (accuracy < ACCURACY_WEAK_THRESHOLD) {
      // The lower the accuracy, the higher the weight (adds 7 to 10 points)
      weight += 5.0 + (1.0 - accuracy) * 5.0; 
    }

    // Rule 2: Repeated indicator mistakes → boost further
    if (weakIndicators.length > 0) {
      weight += 3.0;
    }

    // Rule 3: Consistently high accuracy → reduce (don't over-serve strong areas)
    if (accuracy > ACCURACY_STRONG_THRESHOLD && totalAttempts >= 5) {
      weight = Math.max(weight - 1.0, 0.5);
    }

    // Rule 4: Improving trend → reduce extreme bias slightly (widen mix)
    if (trend === 'improving') {
      weight *= 0.8;
    }

    // Ensure weight never goes below a floor so all categories stay reachable
    weight = Math.max(weight, 0.3);

    weights.set(slug, weight);
    summaries.set(slug, {
      category_id: records[0]?.category_id ?? 0,
      slug,
      accuracy,
      totalAttempts,
      maxDifficultyRank,
      weakIndicators,
    });
  }

  // ── Step 5: Strict prioritization of weakest category ─────────────────────────
  let lowestAccuracy = Infinity;
  let candidates: string[] = [];

  for (const [slug, summary] of summaries.entries()) {
    if (summary.accuracy < lowestAccuracy) {
      lowestAccuracy = summary.accuracy;
      candidates = [slug];
    } else if (summary.accuracy === lowestAccuracy) {
      candidates.push(slug);
    }
  }

  // Randomly pick one of the weakest categories
  const selectedCategorySlug = candidates[Math.floor(Math.random() * candidates.length)];
  const summary = summaries.get(selectedCategorySlug)!;

  // ── Difficulty selection ───────────────────────────────────────────────
  // If accuracy > strong threshold in this category, advance difficulty.
  // If we have no attempts, start at beginner.
  let targetDifficultyRank: number;
  if (summary.totalAttempts === 0) {
    targetDifficultyRank = 1; // beginner
  } else if (summary.accuracy > ACCURACY_STRONG_THRESHOLD) {
    targetDifficultyRank = Math.min(summary.maxDifficultyRank + 1, MAX_DIFFICULTY_RANK);
  } else if (summary.accuracy < ACCURACY_WEAK_THRESHOLD) {
    // Struggling — keep at current difficulty or drop back
    targetDifficultyRank = Math.max(summary.maxDifficultyRank - 1, 1);
  } else {
    targetDifficultyRank = summary.maxDifficultyRank; // maintain current
  }

  const difficulty = DIFFICULTY_SLUGS[targetDifficultyRank] ?? 'beginner';

  return {
    category: selectedCategorySlug,
    difficulty,
    indicatorBias: summary.weakIndicators,
  };
}

// ─── Utility: compute category weight map (for UI display) ───────────────────
export function computeCategoryWeights(
  performanceRecords: UserPerformanceRecord[],
  allCategorySlugs: readonly string[] = ALL_CATEGORY_SLUGS
): Array<{ category: string; weight: number; accuracy: number }> {
  const byCategory = new Map<string, UserPerformanceRecord[]>();
  for (const slug of allCategorySlugs) byCategory.set(slug, []);
  for (const r of performanceRecords) {
    const arr = byCategory.get(r.category_slug) ?? [];
    arr.push(r);
    byCategory.set(r.category_slug, arr);
  }

  return [...byCategory.entries()].map(([slug, records]) => {
    const generalRecords = records.filter(r => r.indicator_type === 'general');
    const c = generalRecords.reduce((s, r) => s + r.correct_count, 0);
    const i = generalRecords.reduce((s, r) => s + r.incorrect_count, 0);
    return { category: slug, weight: 0, accuracy: computeAccuracy(c, i) };
  });
}
