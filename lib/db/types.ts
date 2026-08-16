import type { Generated, Insertable, Selectable, Updateable, JSONColumnType } from 'kysely';

// ─── Users ───────────────────────────────────────────────────────────────────
export interface UserTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  name: string;
  role: 'user' | 'admin';
  created_at: Generated<Date>;
}
export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

// ─── Categories ──────────────────────────────────────────────────────────────
export interface CategoryTable {
  id: Generated<number>;
  name: string;
  description: string;
  slug: string;
}
export type Category = Selectable<CategoryTable>;

// ─── Difficulty Levels ───────────────────────────────────────────────────────
export interface DifficultyLevelTable {
  id: Generated<number>;
  name: string;
  slug: string;
  numeric_rank: number;
}
export type DifficultyLevel = Selectable<DifficultyLevelTable>;

// ─── Scenarios ───────────────────────────────────────────────────────────────
export interface ScenarioTable {
  id: Generated<number>;
  category_id: number;
  difficulty_id: number;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  is_phishing: 0 | 1;
  source: 'ai_generated' | 'fallback';
  validation_status: 'passed' | 'failed' | 'pending';
  explanation: string;
  recommended_training_skill: string | null;
  created_at: Generated<Date>;
}
export type Scenario = Selectable<ScenarioTable>;
export type NewScenario = Insertable<ScenarioTable>;

// ─── Scenario Indicators ─────────────────────────────────────────────────────
export interface ScenarioIndicatorTable {
  id: Generated<number>;
  scenario_id: number;
  indicator_type: string;
  description: string;
  is_present: 0 | 1;
}
export type ScenarioIndicator = Selectable<ScenarioIndicatorTable>;
export type NewScenarioIndicator = Insertable<ScenarioIndicatorTable>;

// ─── Validation Results ──────────────────────────────────────────────────────
export interface FailedCheck {
  rule: string;
  message: string;
}
export interface ValidationResultTable {
  id: Generated<number>;
  scenario_id: number;
  passed: 0 | 1;
  failed_checks: JSONColumnType<FailedCheck[]>;
  retry_count: number;
  used_fallback: 0 | 1;
  validated_at: Generated<Date>;
}
export type ValidationResult = Selectable<ValidationResultTable>;
export type NewValidationResult = Insertable<ValidationResultTable>;

// ─── Training Sessions ───────────────────────────────────────────────────────
export interface TrainingSessionTable {
  id: Generated<number>;
  user_id: number;
  started_at: Generated<Date>;
  ended_at: Date | null;
}
export type TrainingSession = Selectable<TrainingSessionTable>;
export type NewTrainingSession = Insertable<TrainingSessionTable>;

// ─── User Attempts ───────────────────────────────────────────────────────────
export interface UserAttemptTable {
  id: Generated<number>;
  session_id: number;
  user_id: number;
  scenario_id: number;
  user_decision: 'phishing' | 'legitimate';
  indicators_selected: JSONColumnType<string[]>;
  is_correct: 0 | 1;
  score: number;
  responded_at: Generated<Date>;
}
export type UserAttempt = Selectable<UserAttemptTable>;
export type NewUserAttempt = Insertable<UserAttemptTable>;

// ─── User Performance ────────────────────────────────────────────────────────
export interface UserPerformanceTable {
  id: Generated<number>;
  user_id: number;
  category_id: number;
  indicator_type: string;
  difficulty_id: number;
  correct_count: number;
  incorrect_count: number;
  last_updated: Generated<Date>;
}
export type UserPerformance = Selectable<UserPerformanceTable>;
export type NewUserPerformance = Insertable<UserPerformanceTable>;

// ─── User Skills ─────────────────────────────────────────────────────────────
export interface UserSkillTable {
  id: Generated<number>;
  user_id: number;
  skill_area: string;
  proficiency_level: 'strong' | 'moderate' | 'weak';
  accuracy_score: number;
  updated_at: Generated<Date>;
}
export type UserSkill = Selectable<UserSkillTable>;
export type NewUserSkill = Insertable<UserSkillTable>;

// ─── Kysely DB interface ─────────────────────────────────────────────────────
export interface DB {
  users: UserTable;
  categories: CategoryTable;
  difficulty_levels: DifficultyLevelTable;
  scenarios: ScenarioTable;
  scenario_indicators: ScenarioIndicatorTable;
  validation_results: ValidationResultTable;
  training_sessions: TrainingSessionTable;
  user_attempts: UserAttemptTable;
  user_performance: UserPerformanceTable;
  user_skills: UserSkillTable;
}
