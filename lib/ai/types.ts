import { z } from 'zod';

// ─── Zod schema for indicator objects ────────────────────────────────────────
export const IndicatorSchema = z.object({
  type: z.string().min(1),
  present: z.boolean(),
  description: z.string().min(10),
});
export type Indicator = z.infer<typeof IndicatorSchema>;

// ─── Master Zod schema for AI-generated scenario drafts ──────────────────────
// This is the SINGLE source of truth for what we expect from the AI.
// It is used:
//   1. As the JSON-mode response schema sent to Gemini
//   2. To validate every raw AI response server-side (before DB write)
//   3. As TypeScript types throughout the app
export const ScenarioDraftSchema = z.object({
  category: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sender: z.string().email('sender must be a valid email address'),
  recipient: z.string().email('recipient must be a valid email address'),
  subject: z.string().min(5).max(500),
  body: z.string().min(50),
  is_phishing: z.boolean(),
  indicators: z.array(IndicatorSchema).min(2),
  explanation: z.string().min(50, 'explanation must be at least 50 characters'),
  recommended_training_skill: z.string().min(1),
});
export type ScenarioDraft = z.infer<typeof ScenarioDraftSchema>;

// ─── Parameters used to request a scenario from an AI provider ───────────────
export interface ScenarioGenerationParams {
  category: string;             // e.g. "invoice", "hr_communication"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  indicatorBias?: string[];     // indicator types to emphasise, from adaptive engine
  forcePhishing?: boolean;      // override to produce a phishing scenario
}

// ─── The provider interface — any AI backend implements this ─────────────────
export interface AiProvider {
  generateScenario(params: ScenarioGenerationParams): Promise<ScenarioDraft>;
}
