import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRandomActiveCompanyDomain } from '@/lib/services/company-domain.service';
import type { AiProvider, ScenarioDraft, ScenarioGenerationParams } from './types';
import { ScenarioDraftSchema } from './types';
import crypto from 'crypto';

const SchemaType = { OBJECT: 'object', STRING: 'string', BOOLEAN: 'boolean', ARRAY: 'array' } as const;

// ─── Gemini response schema (mirrors the Zod schema, in Google's format) ─────
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    category:   { type: SchemaType.STRING },
    difficulty: { type: SchemaType.STRING, enum: ['beginner', 'intermediate', 'advanced'] },
    sender:     { type: SchemaType.STRING },
    recipient:  { type: SchemaType.STRING },
    subject:    { type: SchemaType.STRING },
    body:       { type: SchemaType.STRING },
    is_phishing: { type: SchemaType.BOOLEAN },
    indicators: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type:        { type: SchemaType.STRING },
          present:     { type: SchemaType.BOOLEAN },
          description: { type: SchemaType.STRING },
        },
        required: ['type', 'present', 'description'],
      },
    },
    explanation:                { type: SchemaType.STRING },
    recommended_training_skill: { type: SchemaType.STRING },
  },
  required: ['category','difficulty','sender','recipient','subject','body','is_phishing','indicators','explanation','recommended_training_skill'],
};

// ─── Category descriptions for prompt context ──────────────────────────────
const CATEGORY_CONTEXT: Record<string, string> = {
  password_reset:     'An email claiming the user must reset their password urgently',
  hr_communication:   'An HR department communication about payroll, benefits, or policy changes',
  invoice:            'A vendor or billing invoice requiring immediate payment or approval',
  shared_document:    'A document sharing notification from a collaboration platform',
  account_alert:      'A security alert about unusual account activity',
  it_support:         'An IT department request for action or credential verification',
  social_engineering: 'A social-engineering email exploiting authority, urgency, or trust',
};

// ─── Gemini adapter ─────────────────────────────────────────────────────────
export class GeminiProvider implements AiProvider {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = process.env.AI_MODEL ?? 'gemini-1.5-flash';
  }

  async generateScenario(params: ScenarioGenerationParams): Promise<ScenarioDraft> {
    const { category, difficulty, indicatorBias = [], forcePhishing, recentSubjects = [] } = params;

    const companyDomain = await getRandomActiveCompanyDomain();

    const companyContext = companyDomain
      ? `The target company is "${companyDomain.name}" in the "${companyDomain.industry}" industry. The primary internal domain is "${companyDomain.domain}".`
      : 'The target company is "Company Training" (an internal training setup). The primary internal domain is "company-training.local".';

    const recipientDomain = companyDomain ? companyDomain.domain : 'company-training.local';

    const SYSTEM_PROMPT = `You are a cybersecurity training scenario generator for an enterprise security awareness platform.
Your task is to generate realistic email training scenarios for employees.

CRITICAL RULES — never violate these:
1. Use only SIMULATED, clearly fictional sender email addresses and domains unless instructed to impersonate an internal sender.
2. Use only harmless, non-resolving URLs if needed (e.g. http://suspicious-link.simulation/). Never use real external URLs.
3. Never simulate forms that collect real credentials. Decision UI only.
4. The "recipient" field must always be an employee@${recipientDomain} address.
5. Output ONLY valid JSON matching the requested schema — no prose, no markdown fences.
6. The "explanation" field must be factual, educational, and at least 80 words.
7. Every indicator marked "present: true" MUST have a corresponding, observable cue in the sender, subject, or body text.
8. If you generate a 'domain_mismatch' indicator, occasionally use subtle spelling mistakes of known brand domains or the company domain (e.g. ${recipientDomain.replace('.', '0.')}) to make it observable.`;

    const categoryCtx = CATEGORY_CONTEXT[category] ?? `An email related to: ${category}`;
    const biasNote = indicatorBias.length > 0
      ? `\nIMPORTANT: The scenario MUST include observable examples of these indicator types: ${indicatorBias.join(', ')}. These are this user's known weaknesses.`
      : '';
    const phishingNote = forcePhishing !== undefined
      ? `\nThis scenario must be: ${forcePhishing ? 'PHISHING' : 'LEGITIMATE'}.`
      : '\nDecide randomly whether to make this phishing or legitimate — aim for roughly 50% phishing, 50% legitimate across many generations.';

    const uniquenessSeed = crypto.randomUUID();

    const userPrompt = `Generate a ${difficulty} difficulty cybersecurity training email scenario.
Category: ${category} — ${categoryCtx}${biasNote}${phishingNote}

COMPANY CONTEXT:
${companyContext}
(Ensure the recipient and internal references match this company).

${recentSubjects.length > 0 ? `RECENTLY GENERATED SUBJECTS (DO NOT REPEAT OR USE SIMILAR PREMISES):\n${recentSubjects.map(s => `- "${s}"`).join('\n')}\n` : ''}

Uniqueness Seed: ${uniquenessSeed}
(Ensure the specific names, numbers, companies, and exact phrasing are 100% unique and have never been used before. NEVER repeat the exact same text or scenario).

Requirements:
- difficulty: exactly "${difficulty}"
- category: exactly "${category}"  
- Include EXACTLY 4 specific, observable indicators marked as present: true
- For phishing: include real red flags a trained employee would notice
- For legitimate: include realistic safe signals, make it feel genuinely authentic
- The explanation must clearly teach WHY it is or isn't phishing
- The email must feel fully distinct from any generic templates. Use specific, believable details.

Respond with ONLY a JSON object — no markdown, no code fences, no extra text.`;

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema as any,
        temperature: 0.9,
        topP: 0.95,
      },
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    // Parse JSON (Gemini JSON-mode should return valid JSON, but we re-validate)
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error(`Gemini returned non-JSON content: ${text.slice(0, 200)}`);
    }

    // Re-validate with our Zod schema — JSON mode reduces errors, doesn't eliminate them
    const parsed = ScenarioDraftSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Gemini output failed Zod validation: ${parsed.error.issues.map(i => i.message).join('; ')}`
      );
    }

    return parsed.data;
  }
}
