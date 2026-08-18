import { getRandomActiveCompanyDomain } from '@/lib/services/company-domain.service';
import type { AiProvider, ScenarioDraft, ScenarioGenerationParams } from './types';
import { ScenarioDraftSchema } from './types';
import crypto from 'crypto';

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

// ─── OpenRouter adapter ───────────────────────────────────────────────────────
export class OpenRouterProvider implements AiProvider {
  private apiKey: string;
  private modelName: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set in .env.local');
    this.apiKey = apiKey;
    // Using a good free tier model. Deepseek or Llama-3 8B are great free options on OpenRouter.
    this.modelName = process.env.AI_MODEL ?? 'meta-llama/llama-3.1-8b-instruct:free';
  }

  async generateScenario(params: ScenarioGenerationParams): Promise<ScenarioDraft> {
    const { category, difficulty, indicatorBias = [], forcePhishing, forceHallucination, recentSubjects = [] } = params;

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

    const hallucinationNote = forceHallucination
      ? '\n[CRITICAL INSTRUCTION: INTENTIONAL HALLUCINATION]\nYou must intentionally include blatantly false, hallucinatory, or factually incorrect information in the email premise or details (e.g. referencing non-existent physics, impossible dates, fake laws, or bizarre internal company events that could not happen). The user needs to practice spotting these AI hallucinations. You MUST set is_hallucinated to true.\n'
      : '\nYou MUST set is_hallucinated to false.\n';

    const userPrompt = `Generate a ${difficulty} difficulty cybersecurity training email scenario.
Category: ${category} — ${categoryCtx}${biasNote}${phishingNote}

COMPANY CONTEXT:
${companyContext}
(Ensure the recipient and internal references match this company).

${hallucinationNote}
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

Respond with ONLY a JSON object — no markdown, no code fences, no extra text. The JSON must have these exact keys:
- category (string)
- difficulty (string: 'beginner', 'intermediate', 'advanced')
- sender (string)
- recipient (string)
- subject (string)
- body (string)
- is_phishing (boolean)
- is_hallucinated (boolean)
- indicators (array of EXACTLY 4 objects, each with 'type' (string), 'present' (boolean), and 'description' (string))
- explanation (string, min 80 chars)
- recommended_training_skill (string)`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
        top_p: 0.95
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter API error (${res.status}): ${text}`);
    }

    const data = await res.json();
    let text = data.choices[0]?.message?.content;
    
    if (!text) {
      throw new Error('OpenRouter returned empty content');
    }

    // Attempt to strip any markdown code block wrappers if they slipped through
    text = text.replace(/^```(json)?\n/, '').replace(/\n```$/, '');

    // Parse JSON
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error(`OpenRouter returned non-JSON content: ${text.slice(0, 200)}`);
    }

    // Re-validate with our Zod schema
    const parsed = ScenarioDraftSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `OpenRouter output failed Zod validation: ${parsed.error.issues.map(i => i.message).join('; ')}`
      );
    }

    return parsed.data;
  }
}
